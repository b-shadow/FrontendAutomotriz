/**
 * suscripcionService.js - Servicio para gestión de suscripciones y planes
 * Incluye métodos para:
 * - Obtener suscripción actual
 * - Cambiar plan (programar cambio)
 * - Crear Payment Intent para cambio o renovación
 * - Confirmar pago
 * - Cancelar cambio pendiente
 * - Obtener planes disponibles
 */
import apiClient from './apiClient'

const suscripcionService = {
  /**
   * Obtener suscripción actual de la empresa
   * GET /api/{slug}/suscripciones/actual/
   */
  obtenerSuscripcionActual: async (tenantSlug) => {
    try {
      const response = await apiClient.get(`/api/${tenantSlug}/suscripciones/actual/`)
      return response.data
    } catch (error) {
      console.error('Error al obtener suscripción:', error)
      throw error
    }
  },

  /**
   * Cambiar plan de suscripción (PROGRAMA el cambio, no lo aplica inmediatamente)
   * POST /api/{slug}/suscripciones/cambiar-plan/
   * 
   * @param {string} tenantSlug - Slug de la empresa
   * @param {Object} datos - { planId: "uuid" }
   */
  cambiarPlan: async (tenantSlug, datos) => {
    try {
      const response = await apiClient.post(
        `/api/${tenantSlug}/suscripciones/cambiar-plan/`,
        { planId: datos.planId }
      )
      return response.data
    } catch (error) {
      console.error('Error al cambiar plan:', error)
      const mensaje = error.response?.data?.error || error.response?.data?.detail || error.message
      const nuevoError = new Error(mensaje)
      nuevoError.response = error.response
      throw nuevoError
    }
  },

  /**
   * Obtener lista de planes disponibles
   * GET /api/planes/
   */
  obtenerPlanes: async () => {
    try {
      const response = await apiClient.get('/api/planes/')
      return response.data.results ?? response.data
    } catch (error) {
      console.error('Error al obtener planes:', error)
      throw error
    }
  },

  /**
   * Obtener detalles de un plan específico
   * GET /api/planes/{id}/
   */
  obtenerPlan: async (planId) => {
    try {
      const response = await apiClient.get(`/api/planes/${planId}/`)
      return response.data
    } catch (error) {
      console.error('Error al obtener plan:', error)
      throw error
    }
  },

  /**
   * Crear Payment Intent para cambio de plan o renovación
   * Backend calcula el monto desde plan.precio_centavos
   * 
   * POST /api/{slug}/suscripciones/crear_payment_intent/
   * 
   * @param {string} tenantSlug - Slug de la empresa
   * @param {Object} datos - { planId: "uuid", accion: "cambiar" | "renovar" }
   */
  crearPaymentIntent: async (tenantSlug, datos) => {
    try {
      const response = await apiClient.post(
        `/api/${tenantSlug}/suscripciones/crear_payment_intent/`,
        {
          planId: datos.planId,
          accion: datos.accion
        }
      )
      return response.data
    } catch (error) {
      console.error('Error al crear payment intent:', error)
      const mensaje = error.response?.data?.error || error.response?.data?.detail || error.message
      const nuevoError = new Error(mensaje)
      nuevoError.response = error.response
      throw nuevoError
    }
  },

  /**
   * Confirmar pago de cambio de plan o renovación
   * POST /api/{slug}/suscripciones/confirmar_pago/
   * 
   * @param {string} tenantSlug - Slug de la empresa
   * @param {Object} datos - { paymentIntentId: "pi_...", planId: "uuid", accion: "cambiar" | "renovar" }
   */
  confirmarPago: async (tenantSlug, datos) => {
    try {
      const response = await apiClient.post(
        `/api/${tenantSlug}/suscripciones/confirmar_pago/`,
        {
          paymentIntentId: datos.paymentIntentId,
          planId: datos.planId,
          accion: datos.accion
        }
      )
      return response.data
    } catch (error) {
      console.error('Error al confirmar pago:', error)
      const mensaje = error.response?.data?.error || error.response?.data?.detail || error.message
      const nuevoError = new Error(mensaje)
      nuevoError.response = error.response
      throw nuevoError
    }
  },

  /**
   * Cancelar un cambio de plan pendiente
   * POST /api/{slug}/suscripciones/cancelar-cambio/
   * 
   * @param {string} tenantSlug - Slug de la empresa
   */
  cancelarCambioPendiente: async (tenantSlug) => {
    try {
      const response = await apiClient.post(
        `/api/${tenantSlug}/suscripciones/cancelar-cambio/`,
        {}
      )
      return response.data
    } catch (error) {
      console.error('Error al cancelar cambio pendiente:', error)
      const mensaje = error.response?.data?.error || error.response?.data?.detail || error.message
      const nuevoError = new Error(mensaje)
      nuevoError.response = error.response
      throw nuevoError
    }
  },
}

export default suscripcionService
