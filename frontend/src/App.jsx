import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Web3Provider } from './context/Web3Context'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'

import Home from './pages/Home'
import Login from './pages/Login'
import PadreRegister from './pages/PadreRegister'
import PadreDashboard from './pages/PadreDashboard'
import HijoDashboard from './pages/HijoDashboard'
import ComercioDashboard from './pages/ComercioDashboard'
import ComercioRegister from './pages/ComercioRegister'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Web3Provider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register/padre" element={<PadreRegister />} />
                <Route path="/register/comercio" element={<ComercioRegister />} />
                
                {/* Rutas protegidas */}
                <Route path="/padre/dashboard" element={
                  <ProtectedRoute role="padre">
                    <PadreDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/hijo/dashboard" element={
                  <ProtectedRoute role="hijo">
                    <HijoDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/comercio/dashboard" element={
                  <ProtectedRoute role="comercio">
                    <ComercioDashboard />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
            

          </div>
        </Router>
      </AuthProvider>
    </Web3Provider>
  )
}

export default App