/**
 * serviciosCatalogoService.js - Servicio para gestión del catálogo de servicios
 * Incluye métodos para:
 * - Listar servicios (con filtros)
 * - Crear servicio
 * - Obtener servicio por ID
 * - Editar servicio
 * - Cambiar estado de servicio
 */
import apiClient from './apiClient'

const serviciosCatalogoService = {
  /**
   * Listar servicios del catálogo del tenant actual
   * GET /api/{slug}/servicios/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {object} filtros - Filtros opcionales
   *   {search, activo, ordering, page}
   */
  listarServicios: async (tenantSlug, filtros = {}) => {
    try {
      const params = new URLSearchParams()
      
      if (filtros.search) params.append('search', filtros.search)
      if (typeof filtros.activo === 'boolean') params.append('activo', filtros.activo)
      if (filtros.ordering) params.append('ordering', filtros.ordering)
      if (filtros.page) params.append('page', filtros.page)

      const queryString = params.toString()
      const url = queryString
        ? `/api/${tenantSlug}/servicios/?${queryString}`
        : `/api/${tenantSlug}/servicios/`

      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error('Error al listar servicios:', error)
      throw error
    }
  },

  /**
   * Crear un nuevo servicio
   * POST /api/{slug}/servicios/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {object} servicioData - Datos del servicio
   *   {codigo, nombre, descripcion, tiempo_estandar_min, precio_base}
   */
  crearServicio: async (tenantSlug, servicioData) => {
    try {
      const response = await apiClient.post(
        `/api/${tenantSlug}/servicios/`,
        servicioData
      )
      return response.data
    } catch (error) {
      console.error('Error al crear servicio:', error)
      throw error
    }
  },

  /**
   * Obtener datos detallados de un servicio
   * GET /api/{slug}/servicios/{id}/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} servicioId - ID del servicio (UUID)
   */
  obtenerServicio: async (tenantSlug, servicioId) => {
    try {
      const response = await apiClient.get(
        `/api/${tenantSlug}/servicios/${servicioId}/`
      )
      return response.data
    } catch (error) {
      console.error('Error al obtener servicio:', error)
      throw error
    }
  },

  /**
   * Editar datos de un servicio
   * PATCH /api/{slug}/servicios/{id}/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} servicioId - ID del servicio
   * @param {object} servicioData - Datos a actualizar
   *   {codigo, nombre, descripcion, tiempo_estandar_min, precio_base}
   */
  editarServicio: async (tenantSlug, servicioId, servicioData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/servicios/${servicioId}/`,
        servicioData
      )
      return response.data
    } catch (error) {
      console.error('Error al editar servicio:', error)
      throw error
    }
  },

  /**
   * Cambiar estado de un servicio (activo/inactivo)
   * PATCH /api/{slug}/servicios/{id}/estado/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} servicioId - ID del servicio
   * @param {object} estadoData - {activo: boolean, motivo: "..."}
   */
  cambiarEstadoServicio: async (tenantSlug, servicioId, estadoData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/servicios/${servicioId}/estado/`,
        estadoData
      )
      return response.data
    } catch (error) {
      console.error('Error al cambiar estado de servicio:', error)
      throw error
    }
  },
}

export default serviciosCatalogoService
