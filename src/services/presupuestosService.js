import apiClient from './apiClient'

const presupuestosService = {
  listar: async (tenantSlug, filtros = {}) => {
    const params = new URLSearchParams()
    if (filtros.estado) params.append('estado', filtros.estado)
    if (filtros.cita) params.append('cita', filtros.cita)
    if (filtros.search) params.append('search', filtros.search)
    const qs = params.toString()
    const url = qs ? `/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/?${qs}` : `/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/`
    const response = await apiClient.get(url)
    return response.data
  },

  obtener: async (tenantSlug, id) => {
    const response = await apiClient.get(`/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/${id}/`)
    return response.data
  },

  crear: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/`, payload)
    return response.data
  },

  editar: async (tenantSlug, id, payload) => {
    const response = await apiClient.patch(`/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/${id}/`, payload)
    return response.data
  },

  comunicar: async (tenantSlug, id) => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/${id}/comunicar/`, {})
    return response.data
  },

  aprobar: async (tenantSlug, id) => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/${id}/aprobar/`, {})
    return response.data
  },

  rechazar: async (tenantSlug, id, motivo = '') => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/${id}/rechazar/`, { motivo })
    return response.data
  },

  ajustar: async (tenantSlug, id) => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/${id}/ajustar/`, {})
    return response.data
  },

  cerrar: async (tenantSlug, id) => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/${id}/cerrar/`, {})
    return response.data
  },

  simularPago: async (tenantSlug, id, monto, metodoPago = 'TARJETA') => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/${id}/simular-pago/`, { monto, metodo_pago: metodoPago })
    return response.data
  },

  iniciarPagoQR: async (tenantSlug, id, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/${id}/iniciar-pago-qr/`, payload)
    return response.data
  },

  iniciarPagoTarjeta: async (tenantSlug, id, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/${id}/iniciar-pago-tarjeta/`, payload)
    return response.data
  },

  confirmarPagoTarjeta: async (tenantSlug, id, pagoTallerId, sessionId) => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/${id}/confirmar-pago-tarjeta/`, {
      pago_taller_id: pagoTallerId,
      session_id: sessionId,
    })
    return response.data
  },

  estadoPagoQR: async (tenantSlug, pagoId) => {
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/pagos-taller/${pagoId}/estado-qr/`)
    return response.data
  },

  marcarPagado: async (tenantSlug, id, monto, metodoPago = 'QR') => {
    const response = await apiClient.post(`/api/${tenantSlug}/atencion-tecnica/presupuestos-cita/${id}/marcar-pagado/`, { monto, metodo_pago: metodoPago })
    return response.data
  },
}

export default presupuestosService
