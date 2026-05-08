import apiClient from './apiClient'

const inventarioService = {
  listarCategorias: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/categorias-inventario/`)
    return response.data
  },

  crearCategoria: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/categorias-inventario/`, payload)
    return response.data
  },

  listarItems: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/items-inventario/`)
    return response.data
  },

  crearItem: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/items-inventario/`, payload)
    return response.data
  },

  ajustarStock: async (tenantSlug, itemId, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/items-inventario/${itemId}/ajustar-stock/`, payload)
    return response.data
  },

  listarMovimientos: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/movimientos-inventario/`)
    return response.data
  },

  listarSolicitudes: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/solicitudes-repuesto/`)
    return response.data
  },

  crearSolicitud: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/solicitudes-repuesto/`, payload)
    return response.data
  },

  aprobarSolicitud: async (tenantSlug, solicitudId, observaciones_asesor = '') => {
    const response = await apiClient.post(`/api/${tenantSlug}/solicitudes-repuesto/${solicitudId}/aprobar/`, { observaciones_asesor })
    return response.data
  },

  marcarEnProcesoAlmacen: async (tenantSlug, solicitudId, observaciones_almacen = '') => {
    const response = await apiClient.post(`/api/${tenantSlug}/solicitudes-repuesto/${solicitudId}/en-proceso-almacen/`, { observaciones_almacen })
    return response.data
  },

  marcarEntregada: async (tenantSlug, solicitudId, detalles) => {
    const response = await apiClient.post(`/api/${tenantSlug}/solicitudes-repuesto/${solicitudId}/marcar-entregada/`, { detalles })
    return response.data
  },

  marcarRecibidaTaller: async (tenantSlug, solicitudId, detalles) => {
    const response = await apiClient.post(`/api/${tenantSlug}/solicitudes-repuesto/${solicitudId}/marcar-recibida-taller/`, { detalles })
    return response.data
  },
}

export default inventarioService
