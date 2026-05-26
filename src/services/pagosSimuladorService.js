import { publicApiClient } from './apiClient'

const pagosSimuladorService = {
  obtenerEstado: async (codigoPago, token) => {
    const response = await publicApiClient.get(`/api/pagos/simulador/${codigoPago}/${token}/`)
    return response.data
  },

  confirmar: async (codigoPago, token) => {
    const response = await publicApiClient.post(`/api/pagos/simulador/${codigoPago}/${token}/`, { accion: 'confirmar' })
    return response.data
  },

  rechazar: async (codigoPago, token) => {
    const response = await publicApiClient.post(`/api/pagos/simulador/${codigoPago}/${token}/`, { accion: 'rechazar' })
    return response.data
  },
}

export default pagosSimuladorService

