/**
 * empresaService.js - Servicio para gestión de empresas
 * Incluye métodos para:
 * - Obtener datos de la empresa actual
 * - Actualizar datos de la empresa
 * - Obtener suscripción actual
 * - Obtener planes disponibles
 */
import apiClient from './apiClient'

const empresaService = {
  /**
   * Obtener datos de la empresa actual (del tenant autenticado)
   * GET /api/empresas/mi_empresa/
   */
  obtenerMiEmpresa: async () => {
    try {
      const response = await apiClient.get('/api/empresas/mi_empresa/')
      return response.data
    } catch (error) {
      console.error('Error al obtener empresa:', error)
      throw error
    }
  },

  /**
   * Actualizar datos de la empresa actual del usuario autenticado
   * PATCH /api/empresas/mi_empresa/
   */
  actualizarEmpresa: async (datos) => {
    try {
      const response = await apiClient.patch(
        '/api/empresas/mi_empresa/',
        datos
      )
      return response.data
    } catch (error) {
      console.error('Error al actualizar empresa:', error)
      throw error
    }
  },

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
   * Obtener lista de planes disponibles
   * GET /api/planes/
   */
  obtenerPlanes: async () => {
    try {
      const response = await apiClient.get('/api/planes/')
      return response.data
    } catch (error) {
      console.error('Error al obtener planes:', error)
      throw error
    }
  },
}

export default empresaService
