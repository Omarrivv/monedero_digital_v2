import React from 'react'
import { useWeb3 } from '../context/Web3Context'
import { useAuth } from '../context/AuthContext'

function Debug() {
  const web3State = useWeb3()
  const authState = useAuth()

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Debug Info</h3>
      
      <div className="mb-2">
        <strong>MetaMask:</strong> {window.ethereum ? '✅ Instalado' : '❌ No instalado'}
      </div>
      
      <div className="mb-2">
        <strong>Web3 State:</strong>
        <pre>{JSON.stringify({
          account: web3State?.account,
          isConnecting: web3State?.isConnecting,
          network: web3State?.network,
          hasProvider: !!web3State?.provider
        }, null, 2)}</pre>
      </div>
      
      <div>
        <strong>Auth State:</strong>
        <pre>{JSON.stringify({
          user: authState?.user?.name,
          role: authState?.userRole,
          isLoading: authState?.isLoading
        }, null, 2)}</pre>
      </div>
    </div>
  )
}

export default Debug