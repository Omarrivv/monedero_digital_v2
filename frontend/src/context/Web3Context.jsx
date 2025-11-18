import React, { createContext, useContext, useState, useEffect } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

const Web3Context = createContext()

// 🚀 USAR VARIABLES DE ENTORNO PARA BLOCKCHAIN URLs
const SUPPORTED_NETWORKS = {
  ethereum: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: [import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/'],
    blockExplorerUrls: [import.meta.env.VITE_ETHEREUM_EXPLORER || 'https://etherscan.io']
  },
  sepolia: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia Testnet',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: [import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/'],
    blockExplorerUrls: [import.meta.env.VITE_SEPOLIA_EXPLORER || 'https://sepolia.etherscan.io']
  },
  holesky: {
    chainId: '0x4268',
    chainName: 'Holesky Testnet',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: [import.meta.env.VITE_HOLESKY_RPC_URL || 'https://ethereum-holesky.publicnode.com'],
    blockExplorerUrls: [import.meta.env.VITE_HOLESKY_EXPLORER || 'https://holesky.etherscan.io']
  },
  hoodi: {
    chainId: '0x88BB0',
    chainName: 'Ethereum Hoodi',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: [import.meta.env.VITE_HOODI_RPC_URL || 'https://ethereum-hoodi-rpc.publicnode.com'],
    blockExplorerUrls: [import.meta.env.VITE_HOODI_EXPLORER || 'https://hoodi.etherscan.io']
  }
}

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [network, setNetwork] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [balance, setBalance] = useState('0')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    let isMounted = true
    
    const initWeb3 = async () => {
      if (isMounted && !isInitialized) {
        setIsInitialized(true)
        await checkConnection()
      }
    }
    
    initWeb3()
    
    if (window.ethereum && !isInitialized) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    return () => {
      isMounted = false
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const checkConnection = async () => {
    if (!window.ethereum) return
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        setAccount(accounts[0])
        const ethProvider = new ethers.BrowserProvider(window.ethereum)
        const ethSigner = await ethProvider.getSigner()
        const ethNetwork = await ethProvider.getNetwork()

        setProvider(ethProvider)
        setSigner(ethSigner)
        setNetwork(ethNetwork)
        
        // Intentar obtener balance con manejo robusto de errores
        try {
          await updateBalance(accounts[0], ethProvider)
        } catch (balanceError) {
          console.log('No se pudo obtener balance, usando 0 por defecto')
          setBalance('0')
        }
      }
    } catch (error) {
      // Silenciosamente manejar errores de conexión
      setBalance('0')
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask no está instalado. Por favor instálalo para continuar.')
      return false
    }

    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      const ethProvider = new ethers.BrowserProvider(window.ethereum)
      const ethSigner = await ethProvider.getSigner()
      const ethNetwork = await ethProvider.getNetwork()

      setAccount(accounts[0])
      setProvider(ethProvider)
      setSigner(ethSigner)
      setNetwork(ethNetwork)

      // Intentar obtener balance con manejo robusto de errores
      try {
        await updateBalance(accounts[0], ethProvider)
      } catch (balanceError) {
        console.log('No se pudo obtener balance, usando 0 por defecto')
        setBalance('0')
      }
      
      toast.success('Wallet conectada exitosamente')
      return true
    } catch (error) {
      console.error('Error connecting wallet:', error)
      toast.error('Error al conectar la wallet')
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  const updateBalance = async (address, provider) => {
    try {
      console.log('🔍 Intentando obtener balance para:', address)
      
      // Verificar que tenemos provider y address válidos
      if (!provider || !address) {
        console.log('❌ Provider o address no válidos')
        setBalance('0')
        return
      }

      // Verificar la red actual
      const network = await provider.getNetwork()
      console.log('🌐 Red actual:', {
        name: network.name,
        chainId: network.chainId.toString(),
      })

      // Intentar obtener balance con timeout
      console.log('💰 Obteniendo balance...')
      const balancePromise = provider.getBalance(address)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout de 10 segundos')), 10000)
      )

      const balance = await Promise.race([balancePromise, timeoutPromise])
      const formattedBalance = ethers.formatEther(balance)
      
      console.log('✅ Balance obtenido:', formattedBalance, 'ETH')
      
      // Verificar que el balance es un número válido
      if (!isNaN(parseFloat(formattedBalance))) {
        setBalance(formattedBalance)
      } else {
        console.log('❌ Balance no es un número válido')
        setBalance('0')
      }
    } catch (error) {
      // Si hay error de RPC o timeout, usar balance 0
      console.log('❌ Error obteniendo balance:', error.message)
      console.log('🔧 Tipo de error:', error.code || 'Sin código')
      setBalance('0')
    }
  }

  const switchNetwork = async (networkName) => {
    if (!window.ethereum) {
      toast.error('MetaMask no está disponible')
      return false
    }

    const networkConfig = SUPPORTED_NETWORKS[networkName]
    if (!networkConfig) {
      toast.error('Red no soportada')
      return false
    }

    try {
      console.log('🔄 Cambiando a red:', networkConfig.chainName)
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkConfig.chainId }],
      })
      
      // Esperar un momento para que MetaMask procese el cambio
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Actualizar estado manualmente sin recargar
      const ethProvider = new ethers.BrowserProvider(window.ethereum)
      const ethNetwork = await ethProvider.getNetwork()
      
      setNetwork(ethNetwork)
      
      // Actualizar balance si hay cuenta
      if (account) {
        try {
          await updateBalance(account, ethProvider)
        } catch (error) {
          console.log('Balance no disponible en nueva red')
          setBalance('0')
        }
      }
      
      toast.success(`Cambiado a ${networkConfig.chainName}`)
      return true
      
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          console.log('🔧 Agregando nueva red:', networkConfig.chainName)
          
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          })
          
          // Esperar y actualizar estado
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          const ethProvider = new ethers.BrowserProvider(window.ethereum)
          const ethNetwork = await ethProvider.getNetwork()
          
          setNetwork(ethNetwork)
          
          if (account) {
            try {
              await updateBalance(account, ethProvider)
            } catch (error) {
              setBalance('0')
            }
          }
          
          toast.success(`Red ${networkConfig.chainName} agregada y seleccionada`)
          return true
          
        } catch (addError) {
          console.error('Error adding network:', addError)
          toast.error('Error al agregar la red')
          return false
        }
      } else if (switchError.code === 4001) {
        // Usuario canceló
        toast.info('Cambio de red cancelado')
        return false
      } else {
        console.error('Error switching network:', switchError)
        toast.error('Error al cambiar de red')
        return false
      }
    }
  }

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null)
      setProvider(null)
      setSigner(null)
      setNetwork(null)
      setBalance('0')
      toast.success('Wallet desconectada')
    } else {
      setAccount(accounts[0])
      // Intentar actualizar balance cuando cambia la cuenta
      if (provider) {
        try {
          updateBalance(accounts[0], provider)
        } catch (error) {
          setBalance('0')
        }
      }
    }
  }

  const handleChainChanged = async (chainId) => {
    console.log('🔄 Red cambiada a:', chainId)
    
    try {
      // No recargar la página, solo actualizar el estado
      if (window.ethereum) {
        const ethProvider = new ethers.BrowserProvider(window.ethereum)
        const ethNetwork = await ethProvider.getNetwork()
        
        setNetwork(ethNetwork)
        
        // Actualizar balance si hay cuenta conectada
        if (account) {
          try {
            await updateBalance(account, ethProvider)
          } catch (error) {
            console.log('Error actualizando balance tras cambio de red:', error)
            setBalance('0')
          }
        }
        
        console.log('✅ Red actualizada sin recargar página')
      }
    } catch (error) {
      console.error('Error manejando cambio de red:', error)
      // Solo en caso de error crítico, recargar
      // window.location.reload()
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
    setSigner(null)
    setNetwork(null)
    setBalance('0')
    toast.success('Wallet desconectada')
  }

  const sendTransaction = async (to, amount) => {
    if (!signer) {
      toast.error('Wallet no conectada')
      return false
    }

    try {
      console.log('🚀 Enviando transacción...')
      console.log('📍 Red actual:', network?.chainId?.toString())
      console.log('💰 Monto:', amount, 'ETH')
      console.log('📧 Destinatario:', to)

      // Crear una nueva instancia del provider para evitar problemas de red
      const currentProvider = new ethers.BrowserProvider(window.ethereum)
      const currentSigner = await currentProvider.getSigner()
      const currentNetwork = await currentProvider.getNetwork()
      
      console.log('🌐 Red confirmada antes de envío:', currentNetwork.chainId.toString())

      const tx = await currentSigner.sendTransaction({
        to,
        value: ethers.parseEther(amount.toString())
      })

      console.log('✅ Transacción enviada:', tx.hash)
      toast.success('Transacción enviada')

      // Esperar confirmación con manejo de errores de red
      try {
        console.log('⏳ Esperando confirmación...')
        const receipt = await tx.wait()
        console.log('✅ Transacción confirmada:', receipt)
        toast.success('Transacción confirmada')
        
        // Actualizar balance después de la transacción
        try {
          await updateBalance(account, currentProvider)
        } catch (balanceError) {
          console.log('⚠️ No se pudo actualizar balance:', balanceError.message)
        }
        
        return tx
      } catch (waitError) {
        console.log('⚠️ Error esperando confirmación:', waitError.message)
        
        // Si es error de cambio de red, la transacción puede estar pendiente
        if (waitError.code === 'NETWORK_ERROR' || waitError.message.includes('network changed')) {
          console.log('🔄 Error de cambio de red detectado, pero transacción puede estar pendiente')
          toast.warning('Transacción enviada, pero hubo un cambio de red. Verifica en el explorer.')
          
          // Retornar la transacción aunque no podamos esperar la confirmación
          return tx
        } else {
          throw waitError
        }
      }
      
    } catch (error) {
      console.error('❌ Error sending transaction:', error)
      
      // Manejar diferentes tipos de errores
      if (error.code === 'ACTION_REJECTED' || 
          error.code === 4001 || 
          error.message?.includes('user rejected') ||
          error.message?.includes('User denied transaction signature')) {
        toast.error('Transacción cancelada por el usuario. Puedes intentar nuevamente cuando estés listo.', { duration: 4000 })
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        toast.error('Fondos insuficientes. Verifica tu balance antes de continuar.')
      } else if (error.code === 'NETWORK_ERROR') {
        toast.error('Error de red. Verifica que estés en la red correcta.')
      } else if (error.message?.includes('network changed')) {
        toast.error('La red cambió durante la transacción. Inténtalo de nuevo.')
      } else if (error.message?.includes('gas')) {
        toast.error('Error de gas. Intenta aumentar el límite de gas.')
      } else {
        toast.error(`Error al enviar la transacción: ${error.message || 'Error desconocido'}`)
      }
      
      return false
    }
  }

  const refreshBalance = async () => {
    if (account && provider) {
      await updateBalance(account, provider)
    }
  }

  // Función para verificar estabilidad de la red
  const verifyNetworkStability = async () => {
    try {
      if (!window.ethereum) return false
      
      const currentProvider = new ethers.BrowserProvider(window.ethereum)
      const currentNetwork = await currentProvider.getNetwork()
      
      // Verificar que la red no haya cambiado
      if (network && network.chainId !== currentNetwork.chainId) {
        console.log('⚠️ Red cambió durante verificación:', {
          anterior: network.chainId.toString(),
          actual: currentNetwork.chainId.toString()
        })
        return false
      }
      
      return true
    } catch (error) {
      console.log('❌ Error verificando estabilidad de red:', error)
      return false
    }
  }

  const getBalanceDirectly = async () => {
    try {
      if (!account || !window.ethereum) {
        console.log('❌ No hay cuenta o MetaMask')
        return
      }

      console.log('🔧 Intentando obtener balance directamente de MetaMask...')
      
      // Método directo usando MetaMask
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [account, 'latest']
      })
      
      console.log('💰 Balance raw de MetaMask:', balance)
      
      // Convertir de hex a decimal y luego a ETH
      const balanceInWei = parseInt(balance, 16)
      const balanceInEth = balanceInWei / Math.pow(10, 18)
      
      console.log('✅ Balance convertido:', balanceInEth, 'ETH')
      
      setBalance(balanceInEth.toString())
      
    } catch (error) {
      console.log('❌ Error con método directo:', error)
    }
  }

  const value = {
    account,
    provider,
    signer,
    network,
    balance,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    sendTransaction,
    refreshBalance,
    getBalanceDirectly,
    verifyNetworkStability,
    supportedNetworks: SUPPORTED_NETWORKS
  }

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}