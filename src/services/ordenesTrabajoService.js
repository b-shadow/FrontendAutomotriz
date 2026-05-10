import apiClient from './apiClient'

const buildQuery = (params = {}) => {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, value)
    }
  })
  return qs.toString()
}

const ordenesTrabajoService = {
  listar: async (tenantSlug, params = {}) => {
    const qs = buildQuery(params)
    const url = qs ? `/api/${tenantSlug}/atencion-tecnica/ordenes-trabajo/?${qs}` : `/api/${tenantSlug}/atencion-tecnica/ordenes-trabajo/`
    const response = await apiClient.get(url)
    return response.data
  },

  crear: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/ordenes-trabajo/`, payload)
    return response.data
  },

  asignarMecanicos: async (tenantSlug, id, mecanicos) => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/ordenes-trabajo/${id}/asignar-mecanicos/`, { mecanicos })
    return response.data
  },

  asignarDetalles: async (tenantSlug, id, detalles) => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/ordenes-trabajo/${id}/asignar-detalles/`, { detalles })
    return response.data
  },

  iniciar: async (tenantSlug, id) => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/ordenes-trabajo/${id}/iniciar/`, {})
    return response.data
  },

  listarMecanicosDisponibles: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/atencion-tecnica/ordenes-trabajo/mecanicos-disponibles/`)
    return response.data
  },
}

export default ordenesTrabajoService
