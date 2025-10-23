import React, { useState } from 'react';
import { Code, Eye, EyeOff } from 'lucide-react';

const UserDataDebug = ({ user }) => {
  const [showRawData, setShowRawData] = useState(false);

  if (!user) return null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <Code className="w-5 h-5" />
          Datos RAW de la BD
        </h4>
        <button
          onClick={() => setShowRawData(!showRawData)}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {showRawData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showRawData ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      {showRawData && (
        <div className="space-y-4">
          {/* Datos principales */}
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Datos del Usuario:</h5>
            <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono overflow-x-auto">
              <div className="space-y-1">
                <div><span className="text-blue-600">_id:</span> <span className="text-green-600">"{user._id || user.id}"</span></div>
                <div><span className="text-blue-600">name:</span> <span className="text-green-600">"{user.name}"</span></div>
                <div><span className="text-blue-600">email:</span> <span className="text-green-600">"{user.email}"</span></div>
                <div><span className="text-blue-600">role:</span> <span className="text-green-600">"{user.role}"</span></div>
                <div><span className="text-blue-600">walletAddress:</span> <span className="text-green-600">"{user.walletAddress}"</span></div>
                <div><span className="text-blue-600">profileImage:</span> <span className="text-green-600">"{user.profileImage}"</span></div>
                <div><span className="text-blue-600">isActive:</span> <span className="text-orange-600">{user.isActive ? 'true' : 'false'}</span></div>
                <div><span className="text-blue-600">lastLogin:</span> <span className="text-purple-600">{user.lastLogin || 'null'}</span></div>
                {user.apellido && <div><span className="text-blue-600">apellido:</span> <span className="text-green-600">"{user.apellido}"</span></div>}
                {user.telefono && <div><span className="text-blue-600">telefono:</span> <span className="text-green-600">"{user.telefono}"</span></div>}
              </div>
            </div>
          </div>

          {/* Arrays */}
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Arrays:</h5>
            <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono">
              <div><span className="text-blue-600">children:</span> <span className="text-orange-600">Array ({user.children?.length || 0})</span></div>
              {user.children && user.children.length > 0 && (
                <div className="ml-4 text-gray-600">
                  {user.children.map((childId, index) => (
                    <div key={index}>- "{childId}"</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Fechas */}
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Timestamps:</h5>
            <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono space-y-1">
              <div><span className="text-blue-600">createdAt:</span> <span className="text-purple-600">"{user.createdAt}"</span></div>
              <div><span className="text-blue-600">updatedAt:</span> <span className="text-purple-600">"{user.updatedAt}"</span></div>
              <div><span className="text-blue-600">__v:</span> <span className="text-orange-600">{user.__v}</span></div>
            </div>
          </div>

          {/* Campos adicionales si existen */}
          {Object.keys(user).filter(key => 
            !['_id', 'id', 'name', 'email', 'role', 'walletAddress', 'profileImage', 'isActive', 'lastLogin', 'children', 'createdAt', 'updatedAt', '__v', 'apellido', 'telefono'].includes(key)
          ).length > 0 && (
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Otros campos:</h5>
              <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono space-y-1">
                {Object.entries(user).filter(([key]) => 
                  !['_id', 'id', 'name', 'email', 'role', 'walletAddress', 'profileImage', 'isActive', 'lastLogin', 'children', 'createdAt', 'updatedAt', '__v', 'apellido', 'telefono'].includes(key)
                ).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-blue-600">{key}:</span> 
                    <span className={`ml-2 ${typeof value === 'string' ? 'text-green-600' : typeof value === 'number' ? 'text-orange-600' : typeof value === 'boolean' ? 'text-orange-600' : 'text-gray-600'}`}>
                      {typeof value === 'string' ? `"${value}"` : 
                       typeof value === 'object' ? JSON.stringify(value) : 
                       String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* JSON completo */}
          <div>
            <h5 className="font-medium text-gray-700 mb-2">JSON Completo:</h5>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
              <pre>{JSON.stringify(user, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDataDebug;