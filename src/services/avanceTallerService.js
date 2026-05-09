import apiClient from './apiClient'

const avanceTallerService = {
  listarOrdenesActivas: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/taller-interno/`)
    return response.data
  },

  iniciarDetalle: async (tenantSlug, ordenId, detalleId) => {
    const response = await apiClient.post(`/api/${tenantSlug}/taller-interno/${ordenId}/iniciar-detalle/`, { detalle_id: detalleId })
    return response.data
  },

  pausarDetalle: async (tenantSlug, ordenId, detalleId, motivo) => {
    const response = await apiClient.post(`/api/${tenantSlug}/taller-interno/${ordenId}/pausar-detalle/`, { detalle_id: detalleId, motivo })
    return response.data
  },

  finalizarDetalle: async (tenantSlug, ordenId, detalleId, payload = {}) => {
    const response = await apiClient.post(`/api/${tenantSlug}/taller-interno/${ordenId}/finalizar-detalle/`, {
      detalle_id: detalleId,
      tiempo_real_min: payload.tiempo_real_min,
      observaciones_mecanico: payload.observaciones_mecanico,
    })
    return response.data
  },

  marcarInnecesario: async (tenantSlug, ordenId, detalleId, motivo) => {
    const response = await apiClient.post(`/api/${tenantSlug}/taller-interno/${ordenId}/marcar-innecesario/`, { detalle_id: detalleId, motivo })
    return response.data
  },

  finalizarOrden: async (tenantSlug, ordenId) => {
    const response = await apiClient.post(`/api/${tenantSlug}/taller-interno/${ordenId}/finalizar-orden/`, {})
    return response.data
  },
}

export default avanceTallerService
