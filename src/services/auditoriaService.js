/**
 * auditoriaService.js - Servicio para consultar eventos de auditoría
 * Métodos disponibles:
 * - listarEventos: Listar eventos con filtros y paginación
 * - obtenerResumen: Obtener resumen de eventos
 * - obtenerDetalle: Obtener detalle de un evento específico
 */
import apiClient from './apiClient'

const auditoriaService = {
  /**
   * Listar eventos de auditoría con filtros y paginación
   * GET /api/{slug}/auditoria/
   *
   * @param {string} tenantSlug - Slug de la empresa
   * @param {object} filtros - Filtros opcionales
   *   {
   *     page: número de página (defecto: 1)
   *     page_size: items por página (defecto: 20)
   *     search: búsqueda libre en descripción, acción, usuario
   *     accion: filtrar por acción específica
   *     entidad_tipo: filtrar por tipo de entidad
   *     usuario: filtrar por ID de usuario
   *     created_at__gte: fecha desde (ISO format)
   *     created_at__lte: fecha hasta (ISO format)
   *     ordering: ordenamiento (-created_at por defecto)
   *   }
   */
  listarEventos: async (tenantSlug, filtros = {}) => {
    try {
      // Construir query params, ignorando vacíos
      const params = new URLSearchParams()

      // Paginación
      if (filtros.page) params.append('page', filtros.page)
      if (filtros.page_size) params.append('page_size', filtros.page_size)

      // Búsqueda y filtros
      if (filtros.search?.trim()) params.append('search', filtros.search.trim())
      if (filtros.accion?.trim()) params.append('accion', filtros.accion.trim())
      if (filtros.entidad_tipo?.trim()) params.append('entidad_tipo', filtros.entidad_tipo.trim())
      if (filtros.usuario?.trim()) params.append('usuario', filtros.usuario.trim())

      // Rango de fechas
      if (filtros.created_at__gte?.trim()) params.append('created_at__gte', filtros.created_at__gte.trim())
      if (filtros.created_at__lte?.trim()) params.append('created_at__lte', filtros.created_at__lte.trim())

      // Ordenamiento
      if (filtros.ordering?.trim()) {
        params.append('ordering', filtros.ordering.trim())
      } else {
        params.append('ordering', '-created_at') // Por defecto descendente
      }

      const queryString = params.toString()
      const url = queryString ? `/api/${tenantSlug}/auditoria/?${queryString}` : `/api/${tenantSlug}/auditoria/`

      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error('Error al listar eventos de auditoría:', error)
      throw error
    }
  },

  /**
   * Obtener resumen de eventos de auditoría
   * GET /api/{slug}/auditoria/resumen/
   *
   * @param {string} tenantSlug - Slug de la empresa
   * @returns {object} Resumen con estadísticas
   */
  obtenerResumen: async (tenantSlug) => {
    try {
      const response = await apiClient.get(`/api/${tenantSlug}/auditoria/resumen/`)
      return response.data
    } catch (error) {
      console.error('Error al obtener resumen de auditoría:', error)
      throw error
    }
  },

  /**
   * Obtener detalle de un evento específico
   * GET /api/{slug}/auditoria/{id}/
   *
   * @param {string} tenantSlug - Slug de la empresa
   * @param {string} eventoId - ID del evento
   * @returns {object} Detalle del evento
   */
  obtenerDetalle: async (tenantSlug, eventoId) => {
    try {
      const response = await apiClient.get(`/api/${tenantSlug}/auditoria/${eventoId}/`)
      return response.data
    } catch (error) {
      console.error(`Error al obtener detalle del evento ${eventoId}:`, error)
      throw error
    }
  },
}

export default auditoriaService
