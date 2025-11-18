import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import API_CONFIG from '../config/apiConfig.js';
import {
  LogIn,
  Wallet,
  User,
  Users,
  Store,
  Shield,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
} from "lucide-react";

function Login() {
  const [activeTab, setActiveTab] = useState("padre");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Credenciales para diferentes tipos de usuario
  const [padreCredentials, setPadreCredentials] = useState({
    email: "",
    password: "",
  });
  
  const [comercioCredentials, setComercioCredentials] = useState({
    email: "",
    password: "",
  });
  
  const [hijoCredentials, setHijoCredentials] = useState({
    hijoId: "",
    password: "",
  });

  const { account, connectWallet, isConnecting } = useWeb3();
  const { checkUserAuthentication, loginHijo, user, userRole, isLoading: authLoading } = useAuth();
  
  // 🚀 USAR CONFIGURACIÓN CENTRALIZADA
  const API_BASE = API_CONFIG.BASE_URL;

  // Redirigir automáticamente cuando el usuario se autentica
  useEffect(() => {
    if (user && userRole && !authLoading) {
      console.log('User authenticated, redirecting...', { user: user.name, role: userRole });
      setIsLoading(false); // Detener loading local
      
      switch (userRole) {
        case 'padre':
          toast.success('¡Bienvenido, Padre!', { id: 'login-check' });
          navigate('/padre/dashboard');
          break;
        case 'comercio':
          toast.success('¡Bienvenido, Comercio!', { id: 'login-check' });
          navigate('/comercio/dashboard');
          break;
        case 'hijo':
          toast.success('¡Bienvenido!', { id: 'login-check' });
          navigate('/hijo/dashboard');
          break;
        default:
          break;
      }
    }
  }, [user, userRole, authLoading, navigate]);

  const handleWalletLogin = async () => {
    if (!account) {
      toast.error('Por favor conecta tu wallet primero');
      return;
    }

    setIsLoading(true);
    toast.loading('Verificando credenciales...', { id: 'login-check' });
    
    try {
      // Debug: Primero verificar qué usuarios hay en la BD
  console.log('Verificando usuarios en BD...');
  const debugResponse = await fetch(`${API_BASE}/auth/debug/users`);
      const debugData = await debugResponse.json();
      console.log('Usuarios en BD:', debugData);
      
      // Llamar manualmente a la verificación con forzado
      await checkUserAuthentication(true);
      
      // Timeout para mostrar error si no se autentica
      setTimeout(() => {
        if (isLoading && !user) {
          toast.error('No se pudo autenticar. Intenta de nuevo.', { id: 'login-check' });
          setIsLoading(false);
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error en login:', error);
      toast.error('Error al verificar credenciales', { id: 'login-check' });
      setIsLoading(false);
    }
  };

  const handleHijoLogin = async (e) => {
    e.preventDefault();

    if (!hijoCredentials.hijoId || !hijoCredentials.password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    const result = await loginHijo(
      hijoCredentials.hijoId,
      hijoCredentials.password
    );

    if (result.success) {
      navigate("/hijo/dashboard");
    }

    setIsLoading(false);
  };

  const handleHijoInputChange = (e) => {
    const { name, value } = e.target;
    setHijoCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg"
          >
            <User className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Iniciar Sesión
          </h1>
          <p className="text-gray-600">
            Elige tu tipo de usuario para continuar
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("padre")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "padre"
                  ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Padre
            </button>
            <button
              onClick={() => setActiveTab("comercio")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "comercio"
                  ? "bg-green-50 text-green-600 border-b-2 border-green-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Store className="w-4 h-4 inline mr-2" />
              Comercio
            </button>
            <button
              onClick={() => setActiveTab("hijo")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "hijo"
                  ? "bg-orange-50 text-orange-600 border-b-2 border-orange-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Hijo
            </button>
          </div>

          <div className="p-6">
            {activeTab === "padre" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Acceso para Padres
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Conecta tu wallet MetaMask para acceder a tu cuenta
                  </p>
                </div>

                {!account ? (
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                  >
                    {isConnecting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Wallet className="w-5 h-5 mr-2" />
                    )}
                    {isConnecting ? "Conectando..." : "Conectar Wallet"}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-sm text-green-800 flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        <strong>Wallet conectada:</strong> {account.slice(0, 6)}...{account.slice(-4)}
                      </p>
                    </div>
                    
                    <button
                      onClick={handleWalletLogin}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <LogIn className="w-5 h-5 mr-2" />
                      )}
                      {isLoading ? "Verificando..." : "Ingresar como Padre"}
                    </button>
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-800">
                    <strong>¿No tienes cuenta?</strong>{" "}
                    <Link
                      to="/register/padre"
                      className="underline hover:no-underline font-medium"
                    >
                      Regístrate como Padre
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "comercio" && (
              <motion.div
                initial={{ opacity: 0, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <Store className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Acceso para Comercios
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Conecta tu wallet MetaMask para acceder a tu cuenta
                  </p>
                </div>

                {!account ? (
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                  >
                    {isConnecting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Wallet className="w-5 h-5 mr-2" />
                    )}
                    {isConnecting ? "Conectando..." : "Conectar Wallet"}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <p className="text-sm text-green-800 flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        <strong>Wallet conectada:</strong> {account.slice(0, 6)}...{account.slice(-4)}
                      </p>
                    </div>
                    
                    <button
                      onClick={handleWalletLogin}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <LogIn className="w-5 h-5 mr-2" />
                      )}
                      {isLoading ? "Verificando..." : "Ingresar como Comercio"}
                    </button>
                  </div>
                )}

                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-green-800">
                    <strong>¿No tienes cuenta?</strong>{" "}
                    <Link
                      to="/register/comercio"
                      className="underline hover:no-underline font-medium"
                    >
                      Regístrate como Comercio
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "hijo" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <User className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Acceso para Hijos
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Ingresa con las credenciales proporcionadas por tu padre
                  </p>
                </div>

                <form onSubmit={handleHijoLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID de Hijo
                    </label>
                    <input
                      type="text"
                      name="hijoId"
                      placeholder="Tu ID único"
                      value={hijoCredentials.hijoId}
                      onChange={handleHijoInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Tu contraseña"
                        value={hijoCredentials.password}
                        onChange={handleHijoInputChange}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white py-4 px-6 rounded-xl font-medium hover:from-orange-500 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <LogIn className="w-5 h-5 mr-2" />
                    )}
                    {isLoading ? "Ingresando..." : "Ingresar"}
                  </button>
                </form>

                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm text-orange-800">
                    <strong>¿No tienes credenciales?</strong> Pídele a tu padre
                    que te registre en su dashboard.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            ¿No tienes cuenta?{" "}
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
