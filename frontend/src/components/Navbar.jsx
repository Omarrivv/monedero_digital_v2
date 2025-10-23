import React from 'react'
import { Link } from 'react-router-dom'
import { useWeb3 } from '../context/Web3Context'
import { useAuth } from '../context/AuthContext'
import { Wallet, User, LogOut, Home } from 'lucide-react'

function Navbar() {
  const { account, connectWallet, disconnectWallet, isConnecting } = useWeb3()
  const { user, userRole, logout } = useAuth()

  const handleLogout = () => {
    logout()
    disconnectWallet()
  }

  const formatAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Wallet className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">
              Monedero Digital
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Inicio</span>
            </Link>

            {user && (
              <Link 
                to={`/${userRole}/dashboard`}
                className="flex items-center space-x-1 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            )}
          </div>

          {/* Wallet & Auth Section */}
          <div className="flex items-center space-x-4">
            {!account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-primary"
              >
                {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <div className="text-gray-600">Wallet:</div>
                  <div className="font-mono text-gray-900">
                    {formatAddress(account)}
                  </div>
                </div>

                {user && (
                  <div className="text-sm">
                    <div className="text-gray-600">Usuario:</div>
                    <div className="font-medium text-gray-900 capitalize">
                      {user.nombre} ({userRole})
                    </div>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar