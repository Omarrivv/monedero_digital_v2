import React from 'react'
import frankImg from '../../imagenes/Frank.jpg'
import omarImg from '../../imagenes/Omar.png'
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

      {/* INICIO Section */}
      <section className="py-16 bg-black relative overflow-hidden">
        {/* Fondo animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(120,255,198,0.2),transparent_50%)]"></div>
        </div>

        {/* Grid de fondo */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,119,198,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(120,119,198,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-6 tracking-wider">
              INICIO
            </h2>
            <div className="flex justify-center items-center gap-4">
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50"></div>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent"></div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Columna Izquierda */}
            <div className="space-y-6">
              {/* Descripción */}
              <div className="group bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 hover:border-cyan-400/60 transition-all duration-500 hover:shadow-xl hover:shadow-cyan-400/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="flex items-center text-xl font-bold mb-4 text-white relative z-10">
                  <span className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 text-black rounded-lg flex items-center justify-center text-sm font-black mr-4 shadow-lg shadow-cyan-400/30">
                    01
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">Descripción</span>
                </h3>
                <p className="text-gray-300 leading-relaxed relative z-10">
                  <span className="text-cyan-400 font-semibold">Monedero Digital v2</span> es una 
                  <span className="text-pink-400 font-semibold"> DApp futurista</span> orientada a familias: 
                  gestión de cuentas, límites inteligentes, transferencias blockchain y pagos en comercios. 
                  <span className="text-purple-400 font-semibold">Stack tecnológico avanzado</span>: 
                  React + Vite, Node.js, MongoDB y Metamask.
                </p>
              </div>

              {/* Objetivos */}
              <div className="group bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/60 transition-all duration-500 hover:shadow-xl hover:shadow-purple-400/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="flex items-center text-xl font-bold mb-4 text-white relative z-10">
                  <span className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 text-black rounded-lg flex items-center justify-center text-sm font-black mr-4 shadow-lg shadow-purple-400/30">
                    02
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white">Objetivos</span>
                </h3>
                <div className="space-y-3 relative z-10">
                  <div className="flex items-start text-gray-300 group/item hover:text-cyan-300 transition-colors duration-300">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-cyan-400/50"></span>
                    Plataforma <span className="text-cyan-400 font-semibold">ultra-segura</span> para control parental digital
                  </div>
                  <div className="flex items-start text-gray-300 group/item hover:text-purple-300 transition-colors duration-300">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-purple-400/50"></span>
                    Límites inteligentes con <span className="text-purple-400 font-semibold">IA predictiva</span>
                  </div>
                  <div className="flex items-start text-gray-300 group/item hover:text-pink-300 transition-colors duration-300">
                    <span className="w-2 h-2 bg-pink-400 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-pink-400/50"></span>
                    Ecosystem de pagos <span className="text-pink-400 font-semibold">blockchain-native</span>
                  </div>
                  <div className="flex items-start text-gray-300 group/item hover:text-green-300 transition-colors duration-300">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-green-400/50"></span>
                    Trazabilidad completa con <span className="text-green-400 font-semibold">inmutabilidad</span>
                  </div>
                </div>
              </div>

              {/* Beneficios */}
              <div className="group bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-pink-500/30 hover:border-pink-400/60 transition-all duration-500 hover:shadow-xl hover:shadow-pink-400/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="flex items-center text-xl font-bold mb-4 text-white relative z-10">
                  <span className="w-10 h-10 bg-gradient-to-r from-pink-400 to-cyan-500 text-black rounded-lg flex items-center justify-center text-sm font-black mr-4 shadow-lg shadow-pink-400/30">
                    03
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-white">Beneficios</span>
                </h3>
                <div className="space-y-3 relative z-10">
                  <div className="flex items-start text-gray-300 hover:text-cyan-300 transition-colors duration-300">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-cyan-400/50"></span>
                    Control parental <span className="text-cyan-400 font-semibold">next-gen</span>
                  </div>
                  <div className="flex items-start text-gray-300 hover:text-pink-300 transition-colors duration-300">
                    <span className="w-2 h-2 bg-pink-400 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-pink-400/50"></span>
                    Pagos <span className="text-pink-400 font-semibold">ultra-rápidos</span> para comercios
                  </div>
                  <div className="flex items-start text-gray-300 hover:text-purple-300 transition-colors duration-300">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-purple-400/50"></span>
                    Analytics avanzados y <span className="text-purple-400 font-semibold">dashboards</span> en tiempo real
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha */}
            <div className="space-y-6">
              {/* Características */}
              <div className="group bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 hover:border-green-400/60 transition-all duration-500 hover:shadow-xl hover:shadow-green-400/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <h3 className="flex items-center text-xl font-bold mb-4 text-white relative z-10">
                  <span className="w-10 h-10 bg-gradient-to-r from-green-400 to-cyan-500 text-black rounded-lg flex items-center justify-center text-sm font-black mr-4 shadow-lg shadow-green-400/30">
                    04
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-white">Tech Stack</span>
                </h3>
                <div className="space-y-3 relative z-10">
                  <div className="flex items-start text-gray-300 hover:text-green-300 transition-colors duration-300">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-green-400/50"></span>
                    Sistema de <span className="text-green-400 font-semibold">roles múltiples</span> con permisos granulares
                  </div>
                  <div className="flex items-start text-gray-300 hover:text-cyan-300 transition-colors duration-300">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-cyan-400/50"></span>
                    Calendario inteligente con <span className="text-cyan-400 font-semibold">ML patterns</span>
                  </div>
                  <div className="flex items-start text-gray-300 hover:text-purple-300 transition-colors duration-300">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-purple-400/50"></span>
                    Engine de transferencias <span className="text-purple-400 font-semibold">high-performance</span>
                  </div>
                  <div className="flex items-start text-gray-300 hover:text-pink-300 transition-colors duration-300">
                    <span className="w-2 h-2 bg-pink-400 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-pink-400/50"></span>
                    Storage distribuido <span className="text-pink-400 font-semibold">Cloudinary</span>
                  </div>
                  <div className="flex items-start text-gray-300 hover:text-yellow-300 transition-colors duration-300">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-yellow-400/50"></span>
                    Multi-chain support: <span className="text-yellow-400 font-semibold">Ethereum ecosystem</span>
                  </div>
                </div>
              </div>

              {/* Integrantes del equipo */}
              <div className="group bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/50 hover:border-cyan-400 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-400/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Efecto de escaneo */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <h3 className="flex items-center text-xl font-bold mb-6 text-white relative z-10">
                  <span className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 text-black rounded-lg flex items-center justify-center text-sm font-black mr-4 shadow-lg shadow-cyan-400/30">
                    05
                  </span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Dev Team</span>
                </h3>
                
                <div className="space-y-6 relative z-10">
                  {/* Frank */}
                  <div className="group/member flex items-center gap-4 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-xl p-4 hover:from-cyan-500/20 hover:to-cyan-500/5 transition-all duration-300 border border-cyan-500/20 hover:border-cyan-400/40">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-sm opacity-50 group-hover/member:opacity-75 transition-opacity duration-300"></div>
                      <img 
                        src={frankImg} 
                        alt="Frank Salazar" 
                        className="relative w-16 h-16 rounded-full object-cover border-2 border-cyan-400 shadow-lg" 
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-black rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    </div>
                    <div>
                      <div className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white">Frank Salazar</div>
                      <div className="text-cyan-300 text-sm font-bold tracking-wider">FRONTEND ARCHITECT</div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">React • Vite • TailwindCSS • Web3</div>
                    </div>
                  </div>

                  {/* Omar */}
                  <div className="group/member flex items-center gap-4 bg-gradient-to-r from-purple-500/10 to-transparent rounded-xl p-4 hover:from-purple-500/20 hover:to-purple-500/5 transition-all duration-300 border border-purple-500/20 hover:border-purple-400/40">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-sm opacity-50 group-hover/member:opacity-75 transition-opacity duration-300"></div>
                      <img 
                        src={omarImg} 
                        alt="Omar Rivera" 
                        className="relative w-16 h-16 rounded-full object-cover border-2 border-purple-400 shadow-lg" 
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-black rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    </div>
                    <div>
                      <div className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-white">Omar Rivera</div>
                      <div className="text-purple-300 text-sm font-bold tracking-wider">BACKEND ARCHITECT</div>
                      <div className="text-xs text-gray-400 mt-1 font-mono">Node.js • MongoDB • Solidity • APIs</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20 relative z-10">
                  <p className="text-xs text-center font-mono text-gray-400">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></span>
                    <span className="text-green-400 font-bold">SYSTEM ONLINE</span> • Elite developers building the future
                  </p>
                </div>
              </div>
            </div>
          </div>
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