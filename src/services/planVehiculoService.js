/**
 * planVehiculoService.js - Servicio para gestión de planes de vehículos (CU22)
 *
 * Incluye métodos para:
 * - Listar planes de vehículos
 * - Crear plan
 * - Obtener plan por ID
 * - Editar plan
 * - Cambiar estado del plan
 * - Listar detalles del plan
 * - Agregar detalle al plan
 * - Editar detalle
 * - Cambiar estado del detalle
 */
import apiClient from './apiClient'

const planVehiculoService = {
  /**
   * Listar planes de vehículos del tenant actual
   * GET /api/{slug}/planes-vehiculo/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {object} filtros - Filtros opcionales
   *   {search, estado, vehiculo_id, ordering, page}
   */
  listarPlanesVehiculo: async (tenantSlug, filtros = {}) => {
    try {
      const params = new URLSearchParams()

      if (filtros.search) params.append('search', filtros.search)
      if (filtros.estado) params.append('estado', filtros.estado)
      if (filtros.vehiculo_id) params.append('vehiculo__id', filtros.vehiculo_id)
      if (filtros.ordering) params.append('ordering', filtros.ordering)
      if (filtros.page) params.append('page', filtros.page)

      const queryString = params.toString()
      const url = queryString
        ? `/api/${tenantSlug}/planes-vehiculo/?${queryString}`
        : `/api/${tenantSlug}/planes-vehiculo/`

      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error('Error al listar planes de vehículos:', error)
      throw error
    }
  },

  /**
   * Crear un nuevo plan de vehículo
   * POST /api/{slug}/planes-vehiculo/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {object} planData - Datos del plan
   *   {vehiculo_id, descripcion_general}
   */
  crearPlanVehiculo: async (tenantSlug, planData) => {
    try {
      const response = await apiClient.post(
        `/api/${tenantSlug}/planes-vehiculo/`,
        planData
      )
      return response.data
    } catch (error) {
      console.error('Error al crear plan de vehículo:', error)
      throw error
    }
  },

  /**
   * Obtener datos detallados de un plan
   * GET /api/{slug}/planes-vehiculo/{id}/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} planId - ID del plan (UUID)
   */
  obtenerPlanVehiculo: async (tenantSlug, planId) => {
    try {
      const response = await apiClient.get(
        `/api/${tenantSlug}/planes-vehiculo/${planId}/`
      )
      return response.data
    } catch (error) {
      console.error('Error al obtener plan de vehículo:', error)
      throw error
    }
  },

  /**
   * Editar datos de un plan (solo admin/asesor)
   * PATCH /api/{slug}/planes-vehiculo/{id}/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} planId - ID del plan
   * @param {object} planData - Datos a actualizar
   *   {descripcion_general}
   */
  editarPlanVehiculo: async (tenantSlug, planId, planData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/planes-vehiculo/${planId}/`,
        planData
      )
      return response.data
    } catch (error) {
      console.error('Error al editar plan de vehículo:', error)
      throw error
    }
  },

  /**
   * Cambiar estado de un plan
   * PATCH /api/{slug}/planes-vehiculo/{id}/estado/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} planId - ID del plan
   * @param {object} estadoData - Datos del cambio de estado
   *   {estado, motivo (opcional)}
   */
  cambiarEstadoPlanVehiculo: async (tenantSlug, planId, estadoData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/planes-vehiculo/${planId}/estado/`,
        estadoData
      )
      return response.data
    } catch (error) {
      console.error('Error al cambiar estado del plan:', error)
      throw error
    }
  },

  /**
   * Listar detalles de un plan
   * GET /api/{slug}/planes-vehiculo/{id}/detalles/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} planId - ID del plan
   */
  listarDetallesPlanVehiculo: async (tenantSlug, planId) => {
    try {
      const response = await apiClient.get(
        `/api/${tenantSlug}/planes-vehiculo/${planId}/detalles/`
      )
      return response.data
    } catch (error) {
      console.error('Error al listar detalles del plan:', error)
      throw error
    }
  },

  /**
   * Crear un detalle en el plan
   * POST /api/{slug}/planes-vehiculo/{id}/crear-detalle/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} planId - ID del plan
   * @param {object} detalleData - Datos del detalle
   *   {plan_servicio_id, servicio_catalogo_id, origen, prioridad, 
   *    tiempo_estandar_min, precio_referencial, observaciones}
   */
  crearDetallePlanVehiculo: async (tenantSlug, planId, detalleData) => {
    try {
      // NUEVO FLUJO (CU22 - Catálogo Obligatorio):
      // Backend detecta:
      // - origen: desde request.user.rol.nombre
      // - tiempo_estandar_min: desde servicio_catalogo
      // - precio_referencial: desde servicio_catalogo
      // Frontend solo envía:
      // - servicio_catalogo_id (obligatorio)
      // - prioridad (opcional)
      // - observaciones (opcional)
      const data = {
        ...detalleData,
        plan_servicio_id: planId,
      }
      const response = await apiClient.post(
        `/api/${tenantSlug}/planes-vehiculo/${planId}/crear-detalle/`,
        data
      )
      return response.data
    } catch (error) {
      console.error('Error al crear detalle del plan:', error)
      throw error
    }
  },

  /**
   * Editar un detalle del plan (solo admin/asesor)
   * PATCH /api/{slug}/planes-vehiculo/detalles/{detalle_id}/editar/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} detalleId - ID del detalle
   * @param {object} detalleData - Datos a actualizar
   *   NUEVO: {prioridad, observaciones} solamente
   *   Nota: origen, tiempo, precio y servicio se mantienen (no son editables del frontend)
   */
  editarDetallePlanVehiculo: async (tenantSlug, detalleId, detalleData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/planes-vehiculo/detalles/${detalleId}/editar/`,
        detalleData
      )
      return response.data
    } catch (error) {
      console.error('Error al editar detalle del plan:', error)
      throw error
    }
  },

  /**
   * Cambiar estado de un detalle del plan
   * PATCH /api/{slug}/planes-vehiculo/detalles/{detalle_id}/estado/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} detalleId - ID del detalle
   * @param {object} estadoData - Datos del cambio de estado
   *   {estado, motivo (opcional)}
   */
  cambiarEstadoDetallePlanVehiculo: async (tenantSlug, detalleId, estadoData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/planes-vehiculo/detalles/${detalleId}/estado/`,
        estadoData
      )
      return response.data
    } catch (error) {
      console.error('Error al cambiar estado del detalle:', error)
      throw error
    }
  },

  /**
   * Eliminar un detalle del plan de vehículo
   * DELETE /api/{slug}/planes-vehiculo/detalles/{detalle_id}/
   *
   * CU22 - Solo ADMIN y ASESOR DE SERVICIO pueden eliminar detalles.
   * No se pueden eliminar detalles en estado FINALIZADO o EN_PROCESO.
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} detalleId - ID del detalle a eliminar
   * @returns {Promise} - Respuesta del servidor
   */
  eliminarDetallePlanVehiculo: async (tenantSlug, detalleId) => {
    try {
      const response = await apiClient.delete(
        `/api/${tenantSlug}/planes-vehiculo/detalles/${detalleId}/`
      )
      return response.data
    } catch (error) {
      console.error('Error al eliminar detalle del plan:', error)
      throw error
    }
  },
}

export default planVehiculoService
