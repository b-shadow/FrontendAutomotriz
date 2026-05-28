import apiClient from './apiClient'

const inventarioService = {
  listarCategorias: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/categorias-inventario/`)
    return response.data
  },

  crearCategoria: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/categorias-inventario/`, payload)
    return response.data
  },

  listarItems: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/items-inventario/`)
    return response.data
  },

  crearItem: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/items-inventario/`, payload)
    return response.data
  },

  ajustarStock: async (tenantSlug, itemId, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/items-inventario/${itemId}/ajustar-stock/`, payload)
    return response.data
  },

  listarMovimientos: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/movimientos-inventario/`)
    return response.data
  },

  listarSolicitudes: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/solicitudes-repuesto/`)
    return response.data
  },

  crearSolicitud: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/solicitudes-repuesto/`, payload)
    return response.data
  },

  aprobarSolicitud: async (tenantSlug, solicitudId, observaciones_asesor = '') => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/solicitudes-repuesto/${solicitudId}/aprobar/`, { observaciones_asesor })
    return response.data
  },

  marcarEnProcesoAlmacen: async (tenantSlug, solicitudId, observaciones_almacen = '') => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/solicitudes-repuesto/${solicitudId}/en-proceso-almacen/`, { observaciones_almacen })
    return response.data
  },

  marcarEntregada: async (tenantSlug, solicitudId, detalles) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/solicitudes-repuesto/${solicitudId}/marcar-entregada/`, { detalles })
    return response.data
  },

  marcarRecibidaTaller: async (tenantSlug, solicitudId, detalles) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/solicitudes-repuesto/${solicitudId}/marcar-recibida-taller/`, { detalles })
    return response.data
  },

  asignarProveedorEta: async (tenantSlug, solicitudId, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/solicitudes-repuesto/${solicitudId}/asignar-proveedor-eta/`, payload)
    return response.data
  },

  listarProveedores: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/proveedores/`)
    return response.data
  },

  crearProveedor: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/proveedores/`, payload)
    return response.data
  },

  listarCompras: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/compras/`)
    return response.data
  },

  crearCompra: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/compras/`, payload)
    return response.data
  },

  marcarCompraRecibida: async (tenantSlug, compraId) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/compras/${compraId}/marcar-recibida/`)
    return response.data
  },

  listarVentasMostrador: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/ventas-mostrador/`)
    return response.data
  },

  crearVentaMostrador: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/ventas-mostrador/`, payload)
    return response.data
  },

  confirmarVentaMostrador: async (tenantSlug, ventaId) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/ventas-mostrador/${ventaId}/confirmar/`)
    return response.data
  },

  iniciarPagoTarjetaVenta: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/ventas-mostrador/iniciar-pago-tarjeta/`, payload)
    return response.data
  },

  confirmarPagoTarjetaVenta: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/ventas-mostrador/confirmar-pago-tarjeta/`, payload)
    return response.data
  },

  listarPagosTaller: async (tenantSlug, params = {}) => {
    const qs = new URLSearchParams(params).toString()
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/pagos-taller/${qs ? `?${qs}` : ''}`)
    return response.data
  },

  crearPagoTaller: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/pagos-taller/`, payload)
    return response.data
  },

  crearPagoQR: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/pagos-taller/crear-qr/`, payload)
    return response.data
  },

  consultarEstadoPagoQR: async (tenantSlug, pagoId) => {
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/pagos-taller/${pagoId}/estado-qr/`)
    return response.data
  },

  simularConfirmacionPagoQR: async (tenantSlug, pagoId, payload = { accion: 'confirmar' }) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/pagos-taller/${pagoId}/simular-confirmacion/`, payload)
    return response.data
  },

  marcarPagoRecibido: async (tenantSlug, pagoId) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/pagos-taller/${pagoId}/marcar-recibido/`)
    return response.data
  },

  listarFacturas: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/facturas/`)
    return response.data
  },

  crearFactura: async (tenantSlug, payload) => {
    const response = await apiClient.post(`/api/${tenantSlug}/gestion-administrativa/facturas/`, payload)
    return response.data
  },

  listarCajas: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/cajas/`)
    return response.data
  },

  miCaja: async (tenantSlug) => {
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/cajas/mi-caja/`)
    return response.data
  },

  listarMovimientosCaja: async (tenantSlug, params = {}) => {
    const qs = new URLSearchParams(params).toString()
    const response = await apiClient.get(`/api/${tenantSlug}/gestion-administrativa/movimientos-caja/${qs ? `?${qs}` : ''}`)
    return response.data
  },
}

export default inventarioService
