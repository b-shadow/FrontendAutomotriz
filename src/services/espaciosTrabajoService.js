/**
 * espaciosTrabajoService.js - Servicio para gestión de espacios de trabajo (CU16)
 *
 * Incluye métodos para:
 * - Listar espacios de trabajo (con filtros)
 * - Crear espacio de trabajo
 * - Obtener espacio por ID
 * - Editar espacio de trabajo
 * - Cambiar estado de espacio
 * - Cambiar activo/inactivo de espacio
 * - Listar horarios de un espacio
 * - Crear horario de espacio
 * - Editar horario de espacio
 * - Cambiar activo/inactivo de horario
 */
import apiClient from './apiClient'

const espaciosTrabajoService = {
  /**
   * Listar espacios de trabajo del tenant actual
   * GET /api/{slug}/espacios/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {object} filtros - Filtros opcionales
   *   {search, tipo, estado, activo, ordering, page}
   */
  listarEspacios: async (tenantSlug, filtros = {}) => {
    try {
      // Construir query params
      const params = new URLSearchParams()
      
      if (filtros.search) params.append('search', filtros.search)
      if (filtros.tipo) params.append('tipo', filtros.tipo)
      if (filtros.estado) params.append('estado', filtros.estado)
      if (filtros.activo !== undefined && filtros.activo !== '') {
        params.append('activo', filtros.activo)
      }
      if (filtros.ordering) params.append('ordering', filtros.ordering)
      if (filtros.page) params.append('page', filtros.page)
      if (filtros.page_size) params.append('page_size', filtros.page_size)

      const queryString = params.toString()
      const url = queryString
        ? `/api/${tenantSlug}/espacios/?${queryString}`
        : `/api/${tenantSlug}/espacios/`

      const response = await apiClient.get(url)
      
      // Backend devuelve paginación: { count, next, previous, results }
      // Extraer results (array de espacios)
      const espaciosList = response.data?.results || response.data?.espacios || response.data || []
      const count = response.data?.count || espaciosList.length
      
      console.debug('[espaciosTrabajoService] Respuesta completa de API:', {
        url,
        statusCode: response.status,
        responseData: response.data,
      })
      
      console.debug('[espaciosTrabajoService] Espacios cargados:', {
        url,
        count,
        espaciosCount: espaciosList.length,
        responseStructure: Object.keys(response.data || {}),
      })
      
      return {
        espacios: espaciosList,
        count: count,
      }
    } catch (error) {
      console.error('❌ Error al listar espacios de trabajo:', error)
      throw error
    }
  },

  /**
   * Crear un nuevo espacio de trabajo
   * POST /api/{slug}/espacios/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {object} espacioData - Datos del espacio
   *   {codigo, nombre, tipo, observaciones}
   */
  crearEspacio: async (tenantSlug, espacioData) => {
    try {
      const response = await apiClient.post(
        `/api/${tenantSlug}/espacios/`,
        espacioData
      )
      return response.data
    } catch (error) {
      console.error('Error al crear espacio de trabajo:', error)
      throw error
    }
  },

  /**
   * Obtener datos detallados de un espacio de trabajo
   * GET /api/{slug}/espacios/{id}/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} espacioId - ID del espacio (UUID)
   */
  obtenerEspacio: async (tenantSlug, espacioId) => {
    try {
      const response = await apiClient.get(
        `/api/${tenantSlug}/espacios/${espacioId}/`
      )
      return response.data
    } catch (error) {
      console.error('Error al obtener espacio de trabajo:', error)
      throw error
    }
  },

  /**
   * Editar datos de un espacio de trabajo
   * PATCH /api/{slug}/espacios/{id}/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} espacioId - ID del espacio
   * @param {object} espacioData - Datos a actualizar
   *   {codigo, nombre, tipo, observaciones, activo}
   */
  editarEspacio: async (tenantSlug, espacioId, espacioData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/espacios/${espacioId}/`,
        espacioData
      )
      return response.data
    } catch (error) {
      console.error('Error al editar espacio de trabajo:', error)
      throw error
    }
  },

  /**
   * Cambiar estado de un espacio de trabajo
   * PATCH /api/{slug}/espacios/{id}/estado/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} espacioId - ID del espacio
   * @param {object} payload - {estado, motivo (opcional)}
   */
  cambiarEstadoEspacio: async (tenantSlug, espacioId, payload) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/espacios/${espacioId}/estado/`,
        payload
      )
      return response.data
    } catch (error) {
      console.error('Error al cambiar estado de espacio:', error)
      throw error
    }
  },

  /**
   * Cambiar activo/inactivo de un espacio de trabajo
   * PATCH /api/{slug}/espacios/{id}/activo/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} espacioId - ID del espacio
   * @param {object} payload - {activo, motivo (opcional)}
   */
  cambiarActivoEspacio: async (tenantSlug, espacioId, payload) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/espacios/${espacioId}/activo/`,
        payload
      )
      return response.data
    } catch (error) {
      console.error('Error al cambiar activo/inactivo de espacio:', error)
      throw error
    }
  },

  // HORARIOS

  /**
   * Listar horarios de un espacio de trabajo
   * GET /api/{slug}/espacios/{espacio_id}/horarios/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} espacioId - ID del espacio
   */
  listarHorariosEspacio: async (tenantSlug, espacioId) => {
    try {
      const response = await apiClient.get(
        `/api/${tenantSlug}/espacios/${espacioId}/horarios/`
      )
      return {
        horarios: response.data.results || response.data.horarios || response.data || [],
        count: response.data.count || (response.data.results ? response.data.results.length : 0),
      }
    } catch (error) {
      console.error('Error al listar horarios del espacio:', error)
      throw error
    }
  },

  /**
   * Crear un nuevo horario para un espacio
   * POST /api/{slug}/espacios/{espacio_id}/horarios/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} espacioId - ID del espacio
   * @param {object} horarioData - Datos del horario
   *   {dia_semana, hora_inicio, hora_fin}
   */
  crearHorarioEspacio: async (tenantSlug, espacioId, horarioData) => {
    try {
      const response = await apiClient.post(
        `/api/${tenantSlug}/espacios/${espacioId}/horarios/`,
        horarioData
      )
      return response.data
    } catch (error) {
      console.error('Error al crear horario de espacio:', error)
      throw error
    }
  },

  /**
   * Editar un horario de un espacio
   * PATCH /api/{slug}/espacios/{espacio_id}/editar_horario/?horario_id={horario_id}
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} espacioId - ID del espacio
   * @param {string} horarioId - ID del horario
   * @param {object} horarioData - Datos a actualizar
   *   {dia_semana, hora_inicio, hora_fin, activo}
   */
  editarHorarioEspacio: async (tenantSlug, espacioId, horarioId, horarioData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/espacios/${espacioId}/editar_horario/?horario_id=${horarioId}`,
        horarioData
      )
      return response.data
    } catch (error) {
      console.error('Error al editar horario de espacio:', error)
      throw error
    }
  },

  /**
   * Cambiar activo/inactivo de un horario
   * PATCH /api/{slug}/espacios/{espacio_id}/activo_horario/?horario_id={horario_id}
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} espacioId - ID del espacio
   * @param {string} horarioId - ID del horario
   * @param {object} payload - {activo, motivo (opcional)}
   */
  cambiarActivoHorarioEspacio: async (tenantSlug, espacioId, horarioId, payload) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/espacios/${espacioId}/activo_horario/?horario_id=${horarioId}`,
        payload
      )
      return response.data
    } catch (error) {
      console.error('Error al cambiar activo/inactivo de horario:', error)
      throw error
    }
  },

  /**
   * Eliminar un horario completamente
   * DELETE /api/{slug}/espacios/{espacio_id}/eliminar_horario/?horario_id={horario_id}
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} espacioId - ID del espacio
   * @param {string} horarioId - ID del horario
   */
  eliminarHorarioEspacio: async (tenantSlug, espacioId, horarioId) => {
    try {
      const response = await apiClient.delete(
        `/api/${tenantSlug}/espacios/${espacioId}/eliminar_horario/?horario_id=${horarioId}`
      )
      return response.data
    } catch (error) {
      console.error('Error al eliminar horario:', error)
      throw error
    }
  },
}

export default espaciosTrabajoService
