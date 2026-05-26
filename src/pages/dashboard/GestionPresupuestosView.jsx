import { useEffect, useState, useCallback } from 'react'
import presupuestosService from '../../services/presupuestosService'
import { useTenant } from '../../hooks/useTenant'

const estadoColors = {
  BORRADOR: 'bg-slate-100 text-slate-700',
  COMUNICADO: 'bg-amber-100 text-amber-700',
  APROBADO: 'bg-emerald-100 text-emerald-700',
  RECHAZADO: 'bg-red-100 text-red-700',
  AJUSTADO: 'bg-indigo-100 text-indigo-700',
  CERRADO: 'bg-neutral-200 text-neutral-700',
}

const GestionPresupuestosView = () => {
  const { tenantSlug, user } = useTenant()
  const esCliente = user?.rol === 'USUARIO'
  const puedeRegistrarPagoInterno = user?.rol === 'ADMIN' || user?.rol === 'ADMINISTRATIVO'
  const puedePagar = esCliente || puedeRegistrarPagoInterno
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [filters, setFilters] = useState({ estado: '', search: '' })
  const [ajusteModal, setAjusteModal] = useState({ open: false, presupuesto: null, descuento: '', observaciones: '' })
  const [pagoModal, setPagoModal] = useState({ open: false, presupuesto: null, monto: '', metodoPago: 'QR' })
  const [historialModal, setHistorialModal] = useState({ open: false, presupuesto: null })
  const [qrModal, setQrModal] = useState({ open: false, pagoId: null, data: null, estado: null })

  const cargar = useCallback(async () => {
    if (!tenantSlug) return
    try {
      setLoading(true)
      setError(null)
      const res = await presupuestosService.listar(tenantSlug, filters)
      setItems(res.results || res || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error cargando presupuestos')
    } finally {
      setLoading(false)
    }
  }, [tenantSlug, filters])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const result = params.get('stripe_result')
    const presupuestoId = params.get('presupuesto_id')
    const pagoTallerId = params.get('pago_taller_id')
    const sessionId = params.get('session_id')
    if (!result || !presupuestoId || !pagoTallerId) return

    const limpiarUrl = () => {
      const url = new URL(window.location.href)
      url.searchParams.delete('stripe_result')
      url.searchParams.delete('presupuesto_id')
      url.searchParams.delete('pago_taller_id')
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url.toString())
    }

    const procesar = async () => {
      try {
        if (result === 'success' && sessionId) {
          await presupuestosService.confirmarPagoTarjeta(tenantSlug, presupuestoId, pagoTallerId, sessionId)
          setSuccess('Pago con tarjeta confirmado correctamente')
          await cargar()
          setTimeout(() => setSuccess(null), 3000)
        } else if (result === 'cancel') {
          setError('Pago con tarjeta cancelado por el usuario.')
        }
      } catch (err) {
        setError(err.response?.data?.error || 'No se pudo confirmar el pago de tarjeta.')
      } finally {
        limpiarUrl()
      }
    }

    procesar()
  }, [tenantSlug, cargar])

  const transicionar = async (id, accion) => {
    try {
      if (accion === 'ajustar') {
        const p = items.find((x) => x.id === id)
        if (!p) return
        setAjusteModal({
          open: true,
          presupuesto: p,
          descuento: String(p.descuento || '0'),
          observaciones: p.observaciones || '',
        })
        return
      }
      if (accion === 'rechazar') {
        const motivo = window.prompt('Motivo de rechazo (opcional):', '') || ''
        await presupuestosService.rechazar(tenantSlug, id, motivo)
      } else {
        await presupuestosService[accion](tenantSlug, id)
      }
      setSuccess(`Presupuesto ${accion} ejecutado`)
      cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || `Error en acción ${accion}`)
    }
  }

  const ejecutarAjuste = async () => {
    const p = ajusteModal.presupuesto
    if (!p) return
    const subtotal = Number(p.subtotal || 0)
    const descuento = Number(ajusteModal.descuento || 0)

    if (Number.isNaN(descuento) || descuento < 0) {
      setError('El descuento debe ser un número mayor o igual a 0.')
      return
    }
    if (descuento > subtotal) {
      setError(`El descuento no puede exceder el subtotal (${subtotal}).`)
      return
    }

    try {
      await presupuestosService.editar(tenantSlug, p.id, {
        descuento: descuento.toFixed(2),
        observaciones: ajusteModal.observaciones || '',
      })
      await presupuestosService.ajustar(tenantSlug, p.id)
      setAjusteModal({ open: false, presupuesto: null, descuento: '', observaciones: '' })
      setSuccess('Presupuesto ajustado correctamente')
      cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo ajustar el presupuesto')
    }
  }

  const abrirPago = (presupuesto) => {
    setPagoModal({ open: true, presupuesto, monto: '', metodoPago: esCliente ? 'TARJETA' : 'QR' })
  }

  const ejecutarPago = async () => {
    if (!pagoModal.presupuesto) return
    if (!puedePagar) {
      setError('No tienes permisos para registrar pagos.')
      return
    }
    try {
      const monto = Number(pagoModal.monto)
      const pendiente = Number(pagoModal.presupuesto?.saldo_pendiente || 0)
      if (Number.isNaN(monto) || monto <= 0) {
        setError('Ingresa un monto valido mayor a 0.')
        return
      }
      if (monto > pendiente) {
        setError('El monto no puede exceder el saldo pendiente.')
        return
      }
      if (pagoModal.metodoPago === 'QR') {
        const qr = await presupuestosService.iniciarPagoQR(tenantSlug, pagoModal.presupuesto.id, {
          monto,
          descripcion: `Pago presupuesto ${pagoModal.presupuesto.id}`,
        })
        setQrModal({ open: true, pagoId: qr.pagoId, data: qr, estado: qr.estado || 'PENDIENTE' })
        setPagoModal({ open: false, presupuesto: null, monto: '', metodoPago: 'QR' })
        return
      }
      if (esCliente) {
        await presupuestosService.simularPago(tenantSlug, pagoModal.presupuesto.id, monto, pagoModal.metodoPago)
      } else {
        if (pagoModal.metodoPago === 'TARJETA') {
          const stripeData = await presupuestosService.iniciarPagoTarjeta(tenantSlug, pagoModal.presupuesto.id, {
            monto,
            descripcion: `Pago tarjeta presupuesto ${pagoModal.presupuesto.id}`,
          })
          if (stripeData?.checkoutUrl) {
            window.location.href = stripeData.checkoutUrl
            return
          }
          setError('No se pudo abrir el checkout de Stripe.')
          return
        }
        await presupuestosService.marcarPagado(tenantSlug, pagoModal.presupuesto.id, monto, pagoModal.metodoPago)
      }
      setSuccess('Pago registrado correctamente')
      setPagoModal({ open: false, presupuesto: null, monto: '', metodoPago: 'QR' })
      cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo registrar el pago')
    }
  }

  useEffect(() => {
    if (!qrModal.open || !qrModal.pagoId) return undefined
    const poll = async () => {
      try {
        const estado = await presupuestosService.estadoPagoQR(tenantSlug, qrModal.pagoId)
        const estadoActual = estado?.estado || 'PENDIENTE'
        setQrModal((prev) => ({ ...prev, estado: estadoActual }))
        if (estadoActual === 'CONFIRMADO') {
          setSuccess('Pago QR confirmado correctamente')
          await cargar()
          setTimeout(() => setSuccess(null), 2500)
        }
      } catch {
        // noop
      }
    }
    poll()
    const timer = setInterval(poll, 3000)
    return () => clearInterval(timer)
  }, [qrModal.open, qrModal.pagoId, tenantSlug, cargar])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Gestionar Presupuesto</h1>
      </div>

      {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white dark:bg-carbon-900 p-4 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-3">
        <select
          value={filters.estado}
          onChange={(e) => setFilters((p) => ({ ...p, estado: e.target.value }))}
          className="px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
        >
          <option value="">Todos los estados</option>
          <option value="BORRADOR">Borrador</option>
          <option value="COMUNICADO">Comunicado</option>
          <option value="APROBADO">Aprobado</option>
          <option value="RECHAZADO">Rechazado</option>
          <option value="AJUSTADO">Ajustado</option>
          <option value="CERRADO">Cerrado</option>
        </select>
        <input
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
          placeholder="Buscar por placa o cliente"
          className="px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
        />
      </div>

      <div className="bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-carbon-500 dark:text-neutral-400">Sin presupuestos</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-carbon-800">
              <tr>
                <th className="px-4 py-3 text-left">Cita</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Subtotal</th>
                <th className="px-4 py-3 text-left">Descuento</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Pagado</th>
                <th className="px-4 py-3 text-left">Pendiente</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <td className="px-4 py-3">{p.cita}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${estadoColors[p.estado] || 'bg-neutral-100 text-neutral-700'}`}>{p.estado}</span></td>
                  <td className="px-4 py-3">{p.subtotal}</td>
                  <td className="px-4 py-3">{p.descuento}</td>
                  <td className="px-4 py-3 font-semibold">{p.total}</td>
                  <td className="px-4 py-3">{p.pagos_recibidos}</td>
                  <td className="px-4 py-3">{p.saldo_pendiente}</td>
                  <td className="px-4 py-3 space-x-2">
                    {(p.estado === 'BORRADOR' || p.estado === 'AJUSTADO') && (
                      <button onClick={() => transicionar(p.id, 'comunicar')} className="text-amber-700">Comunicar</button>
                    )}
                    {(p.estado === 'COMUNICADO' || p.estado === 'AJUSTADO') && (
                      <button onClick={() => transicionar(p.id, 'aprobar')} className="text-emerald-700">Aprobar</button>
                    )}
                    {(p.estado === 'COMUNICADO' || p.estado === 'AJUSTADO') && (
                      <button onClick={() => transicionar(p.id, 'rechazar')} className="text-red-700">Rechazar</button>
                    )}
                    {(p.estado === 'COMUNICADO' || p.estado === 'RECHAZADO') && (
                      <button onClick={() => transicionar(p.id, 'ajustar')} className="text-indigo-700">Ajustar</button>
                    )}
                    {p.estado === 'APROBADO' && (
                      <button onClick={() => transicionar(p.id, 'cerrar')} className="text-neutral-700">Cerrar</button>
                    )}
                    {Number(p.saldo_pendiente || 0) > 0 && puedePagar && (
                      <button onClick={() => abrirPago(p)} className="text-blue-700">
                        {esCliente ? 'Pagar' : 'Marcar pago'}
                      </button>
                    )}
                    <button onClick={() => setHistorialModal({ open: true, presupuesto: p })} className="text-slate-700">Historial pagos</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {ajusteModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] p-5 space-y-4">
            <h3 className="text-lg font-semibold">Ajustar presupuesto</h3>
            <p className="text-sm">
              Subtotal: {ajusteModal.presupuesto?.subtotal} | Total actual: {ajusteModal.presupuesto?.total}
            </p>
            <input
              type="number"
              min="0"
              max={Number(ajusteModal.presupuesto?.subtotal || 0)}
              step="0.01"
              placeholder="Nuevo descuento"
              value={ajusteModal.descuento}
              onChange={(e) => setAjusteModal((m) => ({ ...m, descuento: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
            />
            <textarea
              rows={3}
              placeholder="Observaciones del ajuste (opcional)"
              value={ajusteModal.observaciones}
              onChange={(e) => setAjusteModal((m) => ({ ...m, observaciones: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setAjusteModal({ open: false, presupuesto: null, descuento: '', observaciones: '' })} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={ejecutarAjuste} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Guardar ajuste</button>
            </div>
          </div>
        </div>
      )}

      {pagoModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] p-5 space-y-4">
            <h3 className="text-lg font-semibold">Realizar pago</h3>
            <p className="text-sm">Total: {pagoModal.presupuesto?.total} | Pendiente: {pagoModal.presupuesto?.saldo_pendiente}</p>
            <input
              type="number"
              min="0.01"
              max={Number(pagoModal.presupuesto?.saldo_pendiente || 0)}
              step="0.01"
              placeholder="Monto a pagar"
              value={pagoModal.monto}
              onChange={(e) => setPagoModal((m) => ({ ...m, monto: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
            />
            <p className="text-xs text-carbon-500 dark:text-neutral-400">
              Monto maximo permitido: {pagoModal.presupuesto?.saldo_pendiente}
            </p>
            <select
              value={pagoModal.metodoPago}
              onChange={(e) => setPagoModal((m) => ({ ...m, metodoPago: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
            >
              {esCliente ? (
                <>
                  <option value="TARJETA">Tarjeta</option>
                  <option value="QR">QR</option>
                </>
              ) : (
                <>
                  <option value="QR">QR</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta (Stripe)</option>
                </>
              )}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPagoModal({ open: false, presupuesto: null, monto: '', metodoPago: 'QR' })} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={ejecutarPago} className="px-4 py-2 bg-primary-600 text-white rounded-lg">
                {pagoModal.metodoPago === 'QR' ? 'Generar QR' : (esCliente ? 'Simular pago' : 'Registrar pago')}
              </button>
            </div>
          </div>
        </div>
      )}

      {qrModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{qrModal.data?.simulado ? 'Pago QR Simulado' : 'Pago QR Libelula'}</h3>
              <button onClick={() => setQrModal({ open: false, pagoId: null, data: null, estado: null })} className="px-3 py-1 border rounded">Cerrar</button>
            </div>
            <p className="text-sm">Estado: <span className="font-semibold">{qrModal.estado || 'PENDIENTE'}</span></p>
            <p className="text-sm">Monto real: Bs {qrModal.data?.montoReal}</p>
            <p className="text-sm">Monto cobrado ({qrModal.data?.ambiente}): Bs {qrModal.data?.montoCobrado}</p>
            {qrModal.data?.simulado && (
              <p className="text-xs text-amber-600">Modo simulado: abre el enlace para confirmar o rechazar el pago.</p>
            )}
            <p className="text-xs text-carbon-500 dark:text-neutral-400">Vence: {qrModal.data?.fechaExpiracion ? new Date(qrModal.data.fechaExpiracion).toLocaleString() : '-'}</p>
            {qrModal.data?.qrImagenBase64 && (
              <img src={`data:image/png;base64,${qrModal.data.qrImagenBase64}`} alt="QR" className="mx-auto h-56 w-56 rounded border border-neutral-200/60 dark:border-white/[0.06]" />
            )}
            {!qrModal.data?.qrImagenBase64 && qrModal.data?.qrImagenUrl && (
              <img src={qrModal.data.qrImagenUrl} alt="QR" className="mx-auto h-56 w-56 rounded border border-neutral-200/60 dark:border-white/[0.06]" />
            )}
            {qrModal.data?.urlPago && (
              <a href={qrModal.data.urlPago} target="_blank" rel="noreferrer" className="text-blue-700 underline text-sm">Abrir enlace de pago</a>
            )}
          </div>
        </div>
      )}

      {historialModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Historial de pagos</h3>
              <button onClick={() => setHistorialModal({ open: false, presupuesto: null })} className="px-3 py-1 border rounded">Cerrar</button>
            </div>
            {!(historialModal.presupuesto?.pagos_historial || []).length ? (
              <div className="text-sm text-carbon-500 dark:text-neutral-400">Sin pagos registrados.</div>
            ) : (
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-carbon-800">
                    <tr>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-left">Monto</th>
                      <th className="px-3 py-2 text-left">Método</th>
                      <th className="px-3 py-2 text-left">Estado</th>
                      <th className="px-3 py-2 text-left">Registrado por</th>
                      <th className="px-3 py-2 text-left">Referencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(historialModal.presupuesto?.pagos_historial || []).map((h) => (
                      <tr key={h.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                        <td className="px-3 py-2">{h.recibido_at ? new Date(h.recibido_at).toLocaleString() : '-'}</td>
                        <td className="px-3 py-2">{h.monto}</td>
                        <td className="px-3 py-2">{h.metodo_pago}</td>
                        <td className="px-3 py-2">{h.estado}</td>
                        <td className="px-3 py-2">{h.registrado_por || '-'}</td>
                        <td className="px-3 py-2">{h.referencia || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionPresupuestosView
