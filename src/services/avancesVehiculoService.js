import apiClient from './apiClient'

const avancesVehiculoService = {
  listar: async (tenantSlug, params = {}) => {
    const search = new URLSearchParams()
    if (params.cita) search.append('cita', params.cita)
    const qs = search.toString()
    const url = qs ? `/api/${tenantSlug}/avances-vehiculo/?${qs}` : `/api/${tenantSlug}/avances-vehiculo/`
    const response = await apiClient.get(url)
    return response.data
  },

  crear: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/avances-vehiculo/`, payload)
    return response.data
  },
}

export default avancesVehiculoService
