/**
 * vehiculosService.js - Servicio para gestión de vehículos en dashboard tenant
 * Incluye métodos para:
 * - Listar vehículos (con filtros)
 * - Crear vehículo
 * - Obtener vehículo por ID
 * - Editar vehículo
 * - Cambiar estado de vehículo
 */
import apiClient from './apiClient'

const vehiculosService = {
  /**
   * Listar vehículos del tenant actual
   * GET /api/{slug}/vehiculos/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {object} filtros - Filtros opcionales
   *   {search, placa, marca, modelo, estado, propietario, ordering, page}
   */
  listarVehiculos: async (tenantSlug, filtros = {}) => {
    try {
      // Construir query params
      const params = new URLSearchParams()
      
      if (filtros.search) params.append('search', filtros.search)
      if (filtros.placa) params.append('placa', filtros.placa)
      if (filtros.marca) params.append('marca', filtros.marca)
      if (filtros.modelo) params.append('modelo', filtros.modelo)
      if (filtros.estado) params.append('estado', filtros.estado)
      if (filtros.propietario) params.append('propietario', filtros.propietario)
      if (filtros.ordering) params.append('ordering', filtros.ordering)
      if (filtros.page) params.append('page', filtros.page)

      const queryString = params.toString()
      const url = queryString
        ? `/api/${tenantSlug}/vehiculos/?${queryString}`
        : `/api/${tenantSlug}/vehiculos/`

      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error('Error al listar vehículos:', error)
      throw error
    }
  },

  /**
   * Crear un nuevo vehículo
   * POST /api/{slug}/vehiculos/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {object} vehiculoData - Datos del vehículo
   *   {placa, marca, modelo, anio, color, kilometraje_actual, vin_chasis, motor, observaciones, propietario_id (opcional)}
   */
  crearVehiculo: async (tenantSlug, vehiculoData) => {
    try {
      const response = await apiClient.post(
        `/api/${tenantSlug}/vehiculos/`,
        vehiculoData
      )
      return response.data
    } catch (error) {
      console.error('Error al crear vehículo:', error)
      throw error
    }
  },

  /**
   * Obtener datos detallados de un vehículo
   * GET /api/{slug}/vehiculos/{id}/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} vehiculoId - ID del vehículo (UUID)
   */
  obtenerVehiculo: async (tenantSlug, vehiculoId) => {
    try {
      const response = await apiClient.get(
        `/api/${tenantSlug}/vehiculos/${vehiculoId}/`
      )
      return response.data
    } catch (error) {
      console.error('Error al obtener vehículo:', error)
      throw error
    }
  },

  /**
   * Editar datos de un vehículo (solo asesor/admin)
   * PATCH /api/{slug}/vehiculos/{id}/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} vehiculoId - ID del vehículo
   * @param {object} vehiculoData - Datos a actualizar
   *   {marca, modelo, anio, color, kilometraje_actual, vin_chasis, motor, observaciones, propietario_id}
   */
  editarVehiculo: async (tenantSlug, vehiculoId, vehiculoData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/vehiculos/${vehiculoId}/`,
        vehiculoData
      )
      return response.data
    } catch (error) {
      console.error('Error al editar vehículo:', error)
      throw error
    }
  },

  /**
   * Cambiar estado de un vehículo (ACTIVO ↔ INACTIVO)
   * PATCH /api/{slug}/vehiculos/{id}/estado/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} vehiculoId - ID del vehículo
   * @param {object} estadoData - {estado: "ACTIVO"|"INACTIVO", motivo: "..."}
   */
  cambiarEstadoVehiculo: async (tenantSlug, vehiculoId, estadoData) => {
    try {
      const response = await apiClient.patch(
        `/api/${tenantSlug}/vehiculos/${vehiculoId}/estado/`,
        estadoData
      )
      return response.data
    } catch (error) {
      console.error('Error al cambiar estado de vehículo:', error)
      throw error
    }
  },
}

export default vehiculosService
