import apiClient from './apiClient'

const basePath = (tenantSlug) => `/api/${tenantSlug}/comunicacion-control/notificaciones/`

const notificacionesService = {
  async listar(tenantSlug, { soloNoLeidas = false } = {}) {
    const query = soloNoLeidas ? '?solo_no_leidas=true' : ''
    const response = await apiClient.get(`${basePath(tenantSlug)}${query}`)
    return response.data.results || response.data
  },

  async resumen(tenantSlug) {
    const response = await apiClient.get(`${basePath(tenantSlug)}resumen/`)
    return response.data
  },

  async marcarLeida(tenantSlug, notificacionId) {
    const response = await apiClient.post(`${basePath(tenantSlug)}${notificacionId}/marcar-leida/`, {})
    return response.data
  },

  async marcarTodasLeidas(tenantSlug) {
    const response = await apiClient.post(`${basePath(tenantSlug)}marcar-todas-leidas/`, {})
    return response.data
  },
}

export default notificacionesService
