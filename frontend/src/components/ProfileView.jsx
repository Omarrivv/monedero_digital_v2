import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Users, 
  Wallet, 
  TrendingUp, 
  UserCheck, 
  Settings, 
  Camera, 
  Eye, 
  Edit 
} from 'lucide-react';


const ProfileView = ({ user, children, balance, onEditProfile }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header con gradiente */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white/20 border-4 border-white/30 shadow-2xl">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold mb-2">{user?.name || 'Usuario'}</h1>
                <div className="space-y-1">
                  <p className="text-blue-100 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {user?.email || 'Sin email'}
                  </p>
                  {user?.telefono && (
                    <p className="text-blue-100 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {user.telefono}
                    </p>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium capitalize">
                      {user?.role || 'Usuario'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user?.isActive ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
                    }`}>
                      {user?.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={onEditProfile}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 border border-white/20"
            >
              <Edit className="w-5 h-5" />
              <span>Editar Perfil</span>
            </button>
          </div>
          
          {/* Stats rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Hijos Registrados</p>
                  <p className="text-2xl font-bold">{children?.length || 0}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Balance Wallet</p>
                  <p className="text-2xl font-bold">{parseFloat(balance).toFixed(4)} ETH</p>
                </div>
                <Wallet className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Miembro desde</p>
                  <p className="text-lg font-bold">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Información personal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <UserCheck className="w-6 h-6 mr-3 text-blue-600" />
                Información Personal
              </h3>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo</label>
                    <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                      <p className="text-gray-900 font-medium">{user?.name || 'No disponible'}</p>
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido</label>
                    <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-green-500">
                      <p className="text-gray-900 font-medium">{user?.apellido || 'No especificado'}</p>
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-purple-500">
                      <p className="text-gray-900 font-medium break-all">{user?.email || 'No disponible'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                    <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-orange-500">
                      <p className="text-gray-900 font-medium">{user?.telefono || 'No especificado'}</p>
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rol</label>
                    <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-indigo-500">
                      <p className="text-gray-900 font-medium capitalize">{user?.role || 'No definido'}</p>
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ID de Usuario</label>
                    <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-pink-500">
                      <p className="text-xs text-gray-900 font-mono break-all">{user?._id || user?.id || 'No disponible'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información técnica */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Settings className="w-6 h-6 mr-3 text-purple-600" />
                Información Técnica
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Wallet Address</label>
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-4">
                  <p className="text-green-400 font-mono text-sm break-all">{user?.walletAddress || 'No conectada'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Último Login</label>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-blue-900 text-sm">
                      {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Nunca'}
                    </p>
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Última Actualización</label>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-green-900 text-sm">
                      {user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Imagen de perfil */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-blue-600" />
                Foto de Perfil
              </h3>
            </div>
            
            <div className="p-6 text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 mx-auto mb-4 shadow-lg">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
              
              {user?.profileImage && (
                <div className="text-xs text-gray-500">
                  <p className="mb-2 font-medium">URL de Cloudinary:</p>
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="break-all font-mono">{user.profileImage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información de hijos */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-600" />
                Hijos Registrados
              </h3>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-white">{user?.children?.length || 0}</span>
                </div>
                <p className="text-gray-600">Total de hijos</p>
              </div>
              
              {user?.children && user.children.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">IDs de los hijos:</p>
                  <div className="bg-gray-50 rounded-lg p-3 border">
                    {user.children.map((childId, index) => (
                      <div key={index} className="text-xs font-mono text-gray-600 break-all">
                        {index + 1}. {childId}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p className="text-sm">No hay hijos registrados</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadatos */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-purple-600" />
                Metadatos
              </h3>
            </div>
            
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Versión del documento</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                  v{user?.__v || 0}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Creado</span>
                <span className="text-xs text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Modificado</span>
                <span className="text-xs text-gray-900">
                  {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


    </motion.div>
  );
};

export default ProfileView;