import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWeb3 } from '../context/Web3Context'

function ProtectedRoute({ children, role }) {
  const { user, userRole, isLoading } = useAuth()
  const { account } = useWeb3()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!account) {
    return <Navigate to="/login" replace />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role && userRole !== role) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute