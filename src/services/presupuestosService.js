import apiClient from './apiClient'

const presupuestosService = {
  listar: async (tenantSlug, filtros = {}) => {
    const params = new URLSearchParams()
    if (filtros.estado) params.append('estado', filtros.estado)
    if (filtros.cita) params.append('cita', filtros.cita)
    if (filtros.search) params.append('search', filtros.search)
    const qs = params.toString()
    const url = qs ? `/api/${tenantSlug}/presupuestos-cita/?${qs}` : `/api/${tenantSlug}/presupuestos-cita/`
    const response = await apiClient.get(url)
    return response.data
  },

  obtener: async (tenantSlug, id) => {
    const response = await apiClient.get(`/api/${tenantSlug}/presupuestos-cita/${id}/`)
    return response.data
  },

  crear: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/presupuestos-cita/`, payload)
    return response.data
  },

  editar: async (tenantSlug, id, payload) => {
    const response = await apiClient.patch(`/api/${tenantSlug}/presupuestos-cita/${id}/`, payload)
    return response.data
  },

  comunicar: async (tenantSlug, id) => {
    const response = await apiClient.post(`/api/${tenantSlug}/presupuestos-cita/${id}/comunicar/`, {})
    return response.data
  },

  aprobar: async (tenantSlug, id) => {
    const response = await apiClient.post(`/api/${tenantSlug}/presupuestos-cita/${id}/aprobar/`, {})
    return response.data
  },

  rechazar: async (tenantSlug, id, motivo = '') => {
    const response = await apiClient.post(`/api/${tenantSlug}/presupuestos-cita/${id}/rechazar/`, { motivo })
    return response.data
  },

  ajustar: async (tenantSlug, id) => {
    const response = await apiClient.post(`/api/${tenantSlug}/presupuestos-cita/${id}/ajustar/`, {})
    return response.data
  },

  cerrar: async (tenantSlug, id) => {
    const response = await apiClient.post(`/api/${tenantSlug}/presupuestos-cita/${id}/cerrar/`, {})
    return response.data
  },

  simularPago: async (tenantSlug, id, porcentaje) => {
    const response = await apiClient.post(`/api/${tenantSlug}/presupuestos-cita/${id}/simular-pago/`, { porcentaje })
    return response.data
  },

  marcarPagado: async (tenantSlug, id, monto) => {
    const response = await apiClient.post(`/api/${tenantSlug}/presupuestos-cita/${id}/marcar-pagado/`, { monto })
    return response.data
  },
}

export default presupuestosService
