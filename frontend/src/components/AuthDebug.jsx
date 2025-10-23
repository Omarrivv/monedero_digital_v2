import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthDebug = () => {
  const { user, userRole, isLoading } = useAuth();
  const token = localStorage.getItem('authToken');

  const clearToken = () => {
    localStorage.removeItem('authToken');
    window.location.reload();
  };

  const setTestToken = () => {
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY1YTlhMGY4YzlhYzZiYTgyN2M1NzkiLCJyb2xlIjoicGFkcmUiLCJ3YWxsZXRBZGRyZXNzIjoiMHgwYjkxNDdkZDA4ZDY5YmIxMWU0ZDE3NjI0MzA4YjMzZWY5OWQ1M2M2IiwiaWF0IjoxNzYwOTQxNTMxLCJleHAiOjE3NjEwMjc5MzF9.yke-1r7sJQJt4CmoRpqP5aPffW6zVma4pCimzpqUKWk';
    localStorage.setItem('authToken', testToken);
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">🔧 Auth Debug</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Token:</strong> {token ? '✅ Existe' : '❌ No existe'}
        </div>
        
        <div>
          <strong>User:</strong> {user ? `✅ ${user.name}` : '❌ No user'}
        </div>
        
        <div>
          <strong>Role:</strong> {userRole || 'No role'}
        </div>
        
        <div>
          <strong>Loading:</strong> {isLoading ? 'Sí' : 'No'}
        </div>
        
        {token && (
          <div>
            <strong>Token válido:</strong> {
              (() => {
                try {
                  const payload = JSON.parse(atob(token.split('.')[1]));
                  return payload.exp * 1000 > Date.now() ? '✅ Sí' : '❌ Expirado';
                } catch {
                  return '❌ Inválido';
                }
              })()
            }
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-3">
        <button
          onClick={setTestToken}
          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Set Token
        </button>
        
        <button
          onClick={clearToken}
          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;