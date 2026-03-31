/**
 * usuariosService.js - Servicio para gestión de usuarios en dashboard tenant
 * Incluye métodos para:
 * - Listar usuarios
 * - Crear usuario
 * - Obtener usuario
 * - Editar usuario
 * - Cambiar rol de usuario
 * - Cambiar contraseña
 * - Activar/desactivar usuario
 * - Obtener roles disponibles
 */
import apiClient from './apiClient'

const usuariosService = {
  /**
   * Listar todos los usuarios de la empresa actual
   * GET /api/{slug}/usuarios/
   * @param {string} tenantSlug - Slug de la empresa
   * @param {object} filtros - Filtros opcionales (ej: { page_size: 100, ordering: '-created_at' })
   */
  listarUsuarios: async (tenantSlug, filtros = {}) => {
    try {
      const params = new URLSearchParams()
      
      // Agregar filtros como query params si se proporcionan
      if (filtros.page_size) params.append('page_size', filtros.page_size)
      if (filtros.page) params.append('page', filtros.page)
      if (filtros.search) params.append('search', filtros.search)
      if (filtros.ordering) params.append('ordering', filtros.ordering)
      
      const queryString = params.toString()
      const url = queryString 
        ? `/api/${tenantSlug}/usuarios/?${queryString}`
        : `/api/${tenantSlug}/usuarios/`
      
      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error('Error al listar usuarios:', error)
      throw error
    }
  },

  /**
   * Crear un nuevo usuario en la empresa
   * POST /api/{slug}/usuarios/
   *
   * @param {string} tenantSlug - Slug de la empresa
   * @param {object} userData - Datos del usuario
   *   {nombres, apellidos, email, password, telefono (opcional)}
   */
  crearUsuario: async (tenantSlug, userData) => {
    try {
      const response = await apiClient.post(
        `/api/${tenantSlug}/usuarios/`,
        userData
      )
      return response.data
    } catch (error) {
      console.error('Error al crear usuario:', error)
      throw error
    }
  },

  /**
   * Obtener datos detallados de un usuario
   * GET /api/{slug}/usuarios/{id}/
   */
  obtenerUsuario: async (tenantSlug, usuarioId) => {
    try {
      const response = await apiClient.get(
        `/api/${tenantSlug}/usuarios/${usuarioId}/`
      )
      return response.data
    } catch (error) {
      console.error('Error al obtener usuario:', error)
      throw error
    }
  },

  /**
   * Editar datos básicos del usuario (nombres, apellidos, teléfono, email)
   * PATCH /api/{slug}/usuarios/{id}/
   *
   * @param {string} tenantSlug - Slug de la empresa
   * @param {string} usuarioId - ID del usuario
   * @param {object} userData - Datos a actualizar
   *   {nombres (opt), apellidos (opt), email (opt), telefono (opt)}
   */
  editarUsuario: async (tenantSlug, usuarioId, userData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/usuarios/${usuarioId}/`,
        userData
      )
      return response.data
    } catch (error) {
      console.error('Error al editar usuario:', error)
      throw error
    }
  },

  /**
   * Cambiar la contraseña del usuario autenticado
   * PATCH /api/{slug}/usuarios/cambiar-contrasena/
   *
   * @param {string} tenantSlug - Slug de la empresa
   * @param {object} passwordData - {
   *   contraseña_actual: "actual",
   *   contraseña_nueva: "nueva",
   *   contraseña_confirmacion: "nueva"
   * }
   */
  cambiarContrasena: async (tenantSlug, passwordData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/usuarios/cambiar-contrasena/`,
        passwordData
      )
      return response.data
    } catch (error) {
      console.error('Error al cambiar contraseña:', error)
      throw error
    }
  },

  /**
   * Cambiar el rol de un usuario
   * PATCH /api/{slug}/usuarios/{id}/cambiar-rol/
   *
   * @param {string} tenantSlug - Slug de la empresa
   * @param {string} usuarioId - ID del usuario
   * @param {object} roleData - {rol_id: "uuid"}
   */
  cambiarRol: async (tenantSlug, usuarioId, roleData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/usuarios/${usuarioId}/cambiar-rol/`,
        roleData
      )
      return response.data
    } catch (error) {
      console.error('Error al cambiar rol:', error)
      throw error
    }
  },

  /**
   * Desactivar un usuario
   * PATCH /api/{slug}/usuarios/{id}/desactivar/
   */
  desactivarUsuario: async (tenantSlug, usuarioId) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/usuarios/${usuarioId}/desactivar/`,
        {}
      )
      return response.data
    } catch (error) {
      console.error('Error al desactivar usuario:', error)
      throw error
    }
  },

  /**
   * Activar un usuario
   * PATCH /api/{slug}/usuarios/{id}/activar/
   */
  activarUsuario: async (tenantSlug, usuarioId) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/usuarios/${usuarioId}/activar/`,
        {}
      )
      return response.data
    } catch (error) {
      console.error('Error al activar usuario:', error)
      throw error
    }
  },

  /**
   * Listar todos los roles disponibles
   * GET /api/{slug}/usuarios/obtener-roles/
   */
  listarRoles: async (tenantSlug) => {
    try {
      const response = await apiClient.get(
        `/api/${tenantSlug}/usuarios/obtener-roles/`
      )
      return response.data
    } catch (error) {
      console.error('Error al listar roles:', error)
      throw error
    }
  },

  /**
   * Obtener preferencias de notificación del usuario autenticado
   * GET /api/{slug}/usuarios/preferencias-notificacion/
   *
   * @param {string} tenantSlug - Slug de la empresa
   * @returns { preferencias: { noti_email: bool, noti_push: bool } }
   */
  obtenerPreferenciasNotificacion: async (tenantSlug) => {
    try {
      const response = await apiClient.get(
        `/api/${tenantSlug}/usuarios/preferencias-notificacion/`
      )
      return response.data
    } catch (error) {
      console.error('Error al obtener preferencias de notificación:', error)
      throw error
    }
  },

  /**
   * Actualizar preferencias de notificación del usuario autenticado
   * PATCH /api/{slug}/usuarios/preferencias-notificacion/
   *
   * @param {string} tenantSlug - Slug de la empresa
   * @param {object} preferenciasData - {noti_email (opt), noti_push (opt)}
   * @returns { mensaje, preferencias: { noti_email: bool, noti_push: bool } }
   */
  actualizarPreferenciasNotificacion: async (tenantSlug, preferenciasData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/usuarios/preferencias-notificacion/`,
        preferenciasData
      )
      return response.data
    } catch (error) {
      console.error('Error al actualizar preferencias de notificación:', error)
      throw error
    }
  },
}

export default usuariosService
