const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

class PaymentService {
  // Procesar pago de hijo a comercio
  async procesarPagoComercio(pagoData) {
    try {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      // Crear transacción en BD
      const response = await fetch(`${API_URL}/transactions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: pagoData.comercioId,
          amount: pagoData.monto,
          type: 'payment',
          description: pagoData.descripcion,
          metadata: {
            productos: pagoData.productos,
            comercio: pagoData.comercioNombre
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al crear la transacción')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en procesarPagoComercio:', error)
      throw error
    }
  }

  // Confirmar transacción con hash de blockchain
  async confirmarTransaccion(transaccionId, hashTransaccion) {
    try {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`${API_URL}/transactions/confirm/${transaccionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactionHash: hashTransaccion,
          status: 'completed'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al confirmar transacción')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en confirmarTransaccion:', error)
      throw error
    }
  }

  // Cancelar transacción
  async cancelarTransaccion(transaccionId, motivo = 'Cancelada por el usuario') {
    try {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`${API_URL}/transactions/${transaccionId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: motivo,
          status: 'cancelled'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al cancelar transacción')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en cancelarTransaccion:', error)
      throw error
    }
  }

  // Obtener historial de transacciones
  async obtenerHistorialTransacciones(filtros = {}) {
    try {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const queryParams = new URLSearchParams()
      
      Object.keys(filtros).forEach(key => {
        if (filtros[key] !== undefined && filtros[key] !== '') {
          queryParams.append(key, filtros[key])
        }
      })

      const response = await fetch(`${API_URL}/transactions/my-transactions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al obtener historial de transacciones')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en obtenerHistorialTransacciones:', error)
      throw error
    }
  }

  // Obtener detalles de una transacción específica
  async obtenerDetallesTransaccion(transaccionId) {
    try {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`${API_URL}/transactions/${transaccionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Transacción no encontrada')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en obtenerDetallesTransaccion:', error)
      throw error
    }
  }

  // Simular transacción blockchain (para desarrollo)
  async simularTransaccionBlockchain(monto, destinatario) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generar hash de transacción simulado
        const hash = `0x${Math.random().toString(16).substr(2, 64)}`
        resolve({
          hash,
          blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
          gasUsed: Math.floor(Math.random() * 50000) + 21000,
          status: 1
        })
      }, 2000) // Simular 2 segundos de procesamiento
    })
  }

  // Validar saldo suficiente
  validarSaldoSuficiente(saldoDisponible, montoTransaccion) {
    return saldoDisponible >= montoTransaccion
  }

  // Calcular comisión de transacción
  calcularComision(monto, tipoTransaccion = 'pago_comercio') {
    const comisiones = {
      'pago_comercio': 0.02, // 2%
      'transferencia': 0.01, // 1%
      'retiro': 0.03 // 3%
    }

    const porcentajeComision = comisiones[tipoTransaccion] || 0.02
    return monto * porcentajeComision
  }

  // Formatear monto para mostrar
  formatearMonto(monto) {
    const montoSeguro = Number(monto) || 0
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(montoSeguro)
  }

  // Generar recibo de transacción
  generarRecibo(transaccion) {
    return {
      id: transaccion._id,
      fecha: new Date(transaccion.createdAt).toLocaleString('es-ES'),
      tipo: transaccion.type,
      monto: this.formatearMonto(transaccion.amount),
      destinatario: transaccion.recipient,
      descripcion: transaccion.description,
      hash: transaccion.transactionHash,
      estado: transaccion.status,
      productos: transaccion.metadata?.productos || []
    }
  }
}

export default new PaymentService()