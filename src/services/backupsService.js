import apiClient from './apiClient'

const backupsService = {
  listar: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/comunicacion-control/backups/`)
    return response.data
  },

  crearManual: async (tenantSlug, payload = { alcance: 'TENANT_COMPLETO' }) => {
    const response = await apiClient.post(`/api/${tenantSlug}/comunicacion-control/backups/crear-manual/`, payload)
    return response.data
  },

  obtenerProgramacion: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/comunicacion-control/backups/programacion/`)
    return response.data
  },

  guardarProgramacion: async (tenantSlug, payload) => {
    const response = await apiClient.put(`/api/${tenantSlug}/comunicacion-control/backups/programacion/`, payload)
    return response.data
  },

  ejecutarPendientes: async (tenantSlug) => {
    const response = await apiClient.post(`/api/${tenantSlug}/comunicacion-control/backups/ejecutar-pendientes/`, {})
    return response.data
  },

  descargar: async (tenantSlug, backupId) => {
    const response = await apiClient.get(
      `/api/${tenantSlug}/comunicacion-control/backups/${backupId}/descargar/`,
      { responseType: 'blob' }
    )
    return response.data
  },

  visualizar: async (tenantSlug, backupId) => {
    const response = await apiClient.get(`/api/${tenantSlug}/comunicacion-control/backups/${backupId}/visualizar/`)
    return response.data
  },

  restaurar: async (tenantSlug, backupId, payload = { confirmacion: 'RESTAURAR' }) => {
    const response = await apiClient.post(`/api/${tenantSlug}/comunicacion-control/backups/${backupId}/restaurar/`, payload)
    return response.data
  },
}

export default backupsService
