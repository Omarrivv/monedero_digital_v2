import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useWeb3 } from './Web3Context'
import apiService from '../services/apiService'
import { authAPI } from '../services/apiService-new'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userChildren, setUserChildren] = useState([])
  const { account } = useWeb3()
  
  // Referencias para control de llamadas
  const isCheckingRef = useRef(false)
  const lastAccountRef = useRef(null)
  const hasCheckedRef = useRef(false)

  const checkUserAuthentication = async (forceCheck = false) => {
    if (!account || isCheckingRef.current) {
      console.log('Skipping auth check: no account or already checking')
      return
    }
    
    // Evitar múltiples llamadas para la misma cuenta, a menos que sea forzado
    if (!forceCheck && lastAccountRef.current === account && hasCheckedRef.current) {
      console.log('Skipping auth check: already checked for this account')
      return
    }
    
    // Evitar llamadas si ya hay un usuario autenticado (a menos que sea forzado)
    if (!forceCheck && user && userRole) {
      console.log('Skipping auth check: user already authenticated')
      return
    }
    
    console.log('Starting auth check for account:', account)
    isCheckingRef.current = true
    hasCheckedRef.current = true
    lastAccountRef.current = account
    setIsLoading(true)

    try {
      console.log('🔍 Making auth check request to:', `/auth/check/${account}`)
      console.log('🔍 API Base URL:', apiService.defaults.baseURL)
      const response = await apiService.get(`/auth/check/${account}`)
      console.log('✅ Auth check response:', response.data)
      
      if (response.data.exists) {
        const userData = response.data.user
        setUser(userData)
        setUserRole(userData.role)
        
        // Guardar token si viene en la respuesta
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token)
          console.log('Token guardado para autenticación')
        }
        
        // No cargar hijos aquí para evitar error 401
        // Los hijos se cargarán después en el dashboard si es necesario
        if (userData.role === 'padre') {
          setUserChildren([]) // Inicializar vacío por ahora
        }
      } else {
        console.log('User not found in database for wallet:', account)
        setUser(null)
        setUserRole(null)
        setUserChildren([])
        // Mostrar mensaje al usuario
        toast.error('No se encontró una cuenta registrada para esta wallet. Por favor regístrate primero.')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      if (error.response?.status === 429) {
        console.log('Rate limit hit - this should not happen in development now')
        toast.error('Servidor sobrecargado. El backend necesita ser reiniciado.')
        // Resetear flags inmediatamente para permitir reintentos
        setTimeout(() => {
          isCheckingRef.current = false
          hasCheckedRef.current = false
        }, 5000) // 5 segundos
        return
      }
      
      // Para otros errores, limpiar estado silenciosamente
      setUser(null)
      setUserRole(null)
      setUserChildren([])
    } finally {
      setIsLoading(false)
      isCheckingRef.current = false
    }
  }

  useEffect(() => {
    // Solo limpiar estado cuando no hay cuenta, NO hacer verificación automática
    if (!account) {
      setUser(null)
      setUserRole(null)
      setUserChildren([])
      setIsLoading(false)
      hasCheckedRef.current = false
      lastAccountRef.current = null
    } else {
      // Solo actualizar la referencia, pero NO verificar automáticamente
      if (lastAccountRef.current !== account) {
        lastAccountRef.current = account
        hasCheckedRef.current = false
        setIsLoading(false) // Detener loading hasta que el usuario haga login manual
      }
    }
  }, [account])

  const registerPadre = async (userData) => {
    try {
      const dataToSend = {
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        telefono: userData.telefono,
        password: userData.password,
        fotoPerfil: userData.fotoPerfil,
        walletAddress: account,
        role: 'padre'
      }

  const response = await authAPI.registerPadre(dataToSend)
      
      if (response.data.success) {
        // Guardar token
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token)
        }
        
        setUser(response.data.user)
        setUserRole('padre')
        toast.success('Registro exitoso como Padre/Tutor')
        return { success: true, user: response.data.user }
      }
    } catch (error) {
      console.error('Error registering padre:', error)
      const message = error.response?.data?.message || 'Error en el registro'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const registerHijo = async (hijoData) => {
    try {
      const dataToSend = {
        ...hijoData,
        padreAddress: user?.walletAddress || account
      }

      const response = await apiService.post('/auth/register/hijo', dataToSend)
      
      if (response.data.success) {
        // Recargar la lista completa de hijos
        await loadChildren()
        toast.success('Hijo registrado exitosamente')
        return { success: true, hijo: response.data.hijo }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar hijo'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const registerComercio = async (comercioData) => {
    try {
      const dataToSend = {
        ...comercioData,
        walletAddress: account,
        role: 'comercio'
      }

      const response = await apiService.post('/auth/register/comercio', dataToSend)
      
      if (response.data.success) {
        // Guardar token
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token)
        }
        
        setUser(response.data.user)
        setUserRole('comercio')
        toast.success('Registro exitoso como Comercio')
        return { success: true, user: response.data.user }
      }
    } catch (error) {
      console.error('Error registering comercio:', error)
      const message = error.response?.data?.message || 'Error en el registro'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const loginPadre = async (email, password, walletAddress) => {
    try {
      const response = await apiService.post('/auth/login/padre', {
        email,
        password,
        walletAddress
      })
      
      if (response.data.success) {
        // Guardar token
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token)
        }
        
        setUser(response.data.user)
        setUserRole('padre')
        
        // Cargar hijos si es padre
        await loadChildren()
        
        toast.success('Login exitoso')
        return { success: true, user: response.data.user }
      }
    } catch (error) {
      console.error('Error logging in padre:', error)
      const message = error.response?.data?.message || 'Error en el login'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const loginComercio = async (email, password, walletAddress) => {
    try {
      const response = await apiService.post('/auth/login/comercio', {
        email,
        password,
        walletAddress
      })
      
      if (response.data.success) {
        // Guardar token
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token)
        }
        
        setUser(response.data.user)
        setUserRole('comercio')
        toast.success('Login exitoso')
        return { success: true, user: response.data.user }
      }
    } catch (error) {
      console.error('Error logging in comercio:', error)
      const message = error.response?.data?.message || 'Error en el login'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const loginHijo = async (hijoId, password) => {
    try {
      const response = await apiService.post('/auth/login/hijo', {
        hijoId,
        password
      })
      
      if (response.data.success) {
        setUser(response.data.hijo)
        setUserRole('hijo')
        toast.success('Login exitoso')
        return { success: true, user: response.data.hijo }
      }
    } catch (error) {
      console.error('Error logging in hijo:', error)
      const message = error.response?.data?.message || 'Error en el login'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const updateProfile = async (updatedData) => {
    try {
      const response = await apiService.put('/auth/profile', {
        ...updatedData,
        walletAddress: account
      })
      
      if (response.data.success) {
        setUser(response.data.user)
        toast.success('Perfil actualizado exitosamente')
        return { success: true, user: response.data.user }
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      const message = error.response?.data?.message || 'Error al actualizar perfil'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const setSpendingLimits = async (hijoId, limits) => {
    try {
      const response = await apiService.post('/auth/set-limits', {
        hijoId,
        limits,
        padreAddress: account
      })
      
      if (response.data.success) {
        toast.success('Límites establecidos exitosamente')
        return { success: true }
      }
    } catch (error) {
      console.error('Error setting limits:', error)
      const message = error.response?.data?.message || 'Error al establecer límites'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const loadChildren = async () => {
    try {
      const response = await apiService.get('/users/children')
      
      if (response.data.success) {
        console.log('👶 Datos completos de hijos:', response.data.children)
        response.data.children.forEach(hijo => {
          console.log(`📊 ${hijo.name} - spendingLimits:`, hijo.spendingLimits)
        })
        setUserChildren(response.data.children)
        console.log(`✅ ${response.data.children.length} hijos cargados`)
      } else {
        setUserChildren([])
      }
    } catch (error) {
      console.error('❌ Error loading children:', error.response?.data || error.message)
      setUserChildren([])
    }
  }

  const getLimits = async (hijoId) => {
    try {
      const response = await apiService.get(`/auth/get-limits/${hijoId}`)
      
      if (response.data.success) {
        return { success: true, limits: response.data.limits }
      } else {
        return { success: false, limits: {} }
      }
    } catch (error) {
      console.error('❌ Error loading limits:', error.response?.data || error.message)
      return { success: false, limits: {} }
    }
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  const logout = () => {
    // Limpiar token
    localStorage.removeItem('authToken')
    
    setUser(null)
    setUserRole(null)
    setUserChildren([])
    toast.success('Sesión cerrada')
  }

  const value = {
    user,
    userRole,
    isLoading,
    userChildren,
    children: userChildren,
    registerPadre,
    registerHijo,
    registerComercio,
    loginPadre,
    loginComercio,
    loginHijo,
    updateProfile,
    updateUser,
    setSpendingLimits,
    logout,
    checkUserAuthentication,
    loadChildren,
    getLimits
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}