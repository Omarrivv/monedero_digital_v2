import React from 'react'
import { Link } from 'react-router-dom'
import { useWeb3 } from '../context/Web3Context'
import { useAuth } from '../context/AuthContext'
import { 
  Wallet, 
  Users, 
  Store, 
  Shield, 
  TrendingUp, 
  Calendar,
  History,
  ArrowRight 
} from 'lucide-react'

function Home() {
  const { account } = useWeb3()
  const { user, userRole } = useAuth()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="animate-fade-in">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Monedero Digital DApp
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Una aplicación descentralizada que permite a los padres gestionar 
            el dinero de sus hijos de manera segura y controlada, 
            mientras los comercios pueden recibir pagos fácilmente.
          </p>
          
          {!account ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Conecta tu wallet MetaMask para comenzar
              </p>
            </div>
          ) : user ? (
            <Link 
              to={`/${userRole}/dashboard`}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <span>Ir al Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-gray-700 mb-6">
                ¿Qué tipo de usuario eres?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/register/padre" 
                  className="btn-primary"
                  onClick={() => console.log('Click en botón Padre')}
                >
                  Soy Padre/Tutor
                </Link>
                <Link 
                  to="/register/comercio" 
                  className="btn-secondary"
                  onClick={() => console.log('Click en botón Comercio')}
                >
                  Soy Comercio
                </Link>
                <Link 
                  to="/login" 
                  className="btn-outline"
                  onClick={() => console.log('Click en botón Login')}
                >
                  Soy Hijo (Login)
                </Link>
              </div>
              

            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Características Principales
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Padre/Tutor */}
            <div className="card text-center animate-slide-up">
              <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Para Padres/Tutores</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Registrar y gestionar hijos</li>
                <li>• Establecer límites de gasto</li>
                <li>• Transferir fondos</li>
                <li>• Ver historial completo</li>
              </ul>
            </div>

            {/* Hijo */}
            <div className="card text-center animate-slide-up">
              <Wallet className="h-12 w-12 text-secondary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Para Hijos</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Ver saldo disponible</li>
                <li>• Realizar pagos seguros</li>
                <li>• Respetar límites establecidos</li>
                <li>• Historial de transacciones</li>
              </ul>
            </div>

            {/* Comercio */}
            <div className="card text-center animate-slide-up">
              <Store className="h-12 w-12 text-accent-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Para Comercios</h3>
              <ul className="text-gray-600 space-y-2">
                <li>• Recibir pagos digitales</li>
                <li>• Gestionar productos</li>
                <li>• Ver historial de ventas</li>
                <li>• Categorización automática</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Tecnologías Utilizadas
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold">Blockchain</h4>
              <p className="text-sm text-gray-600">Ethereum, Sepolia, Holesky</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold">Smart Contracts</h4>
              <p className="text-sm text-gray-600">Solidity</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h4 className="font-semibold">Frontend</h4>
              <p className="text-sm text-gray-600">React 19, Vite, TailwindCSS</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <History className="h-8 w-8 text-orange-600 mx-auto mb-3" />
              <h4 className="font-semibold">Backend</h4>
              <p className="text-sm text-gray-600">Node.js, MongoDB, Express</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            ¡Comienza a usar el Monedero Digital!
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Únete a la revolución de los pagos digitales seguros y controlados
          </p>
          
          {!account && (
            <div className="space-y-4">
              <p className="text-lg">
                Instala MetaMask y conecta tu wallet para empezar
              </p>
              <a 
                href="https://metamask.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-block"
              >
                Instalar MetaMask
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home