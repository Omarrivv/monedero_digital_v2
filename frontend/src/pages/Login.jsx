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
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { account, connectWallet, isConnecting } = useWeb3();
  const { checkUserAuthentication, user, userRole, isLoading: authLoading } = useAuth();
  const API_BASE = API_CONFIG.BASE_URL;

  useEffect(() => {
    if (user && userRole && !authLoading) {
      setIsLoading(false);
      toast.success(`¡Bienvenido, ${userRole.charAt(0).toUpperCase() + userRole.slice(1)}!`, { id: 'login-check' });
      switch (userRole) {
        case 'padre':
          navigate('/padre/dashboard');
          break;
        case 'comercio':
          navigate('/comercio/dashboard');
          break;
        case 'hijo':
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
      await checkUserAuthentication(true);
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
            Accede con tu wallet MetaMask
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-6">
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
                {isLoading ? "Verificando..." : "Ingresar"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
