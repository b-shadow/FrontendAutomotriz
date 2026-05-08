import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTenant } from '../../hooks/useTenant'
import avanceTallerService from '../../services/avanceTallerService'
import inventarioService from '../../services/inventarioService'

const initDetalleForm = () => ({
  motivoPausa: '',
  motivoInnecesario: '',
  tiempoRealMin: '',
  observacionesMecanico: '',
})

const nuevaLineaRepuesto = () => ({ itemInventarioId: '', cantidadSolicitada: 1, observacion: '' })

const GestionTallerInternoView = () => {
  const { tenantSlug, user } = useTenant()
  const rol = user?.rol || ''
  const puedeSolicitarRepuestos = rol === 'ADMIN' || rol === 'ASESOR DE SERVICIO'

  const [ordenes, setOrdenes] = useState([])
  const [itemsInventario, setItemsInventario] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [detalleForm, setDetalleForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [modalSolicitud, setModalSolicitud] = useState({ open: false, orden: null, motivo: '', lineas: [nuevaLineaRepuesto()] })

  const cargar = useCallback(async () => {
    if (!tenantSlug) return
    try {
      setLoading(true)
      setError(null)
      const [ordenesData, itemsData, solicitudesData] = await Promise.all([
        avanceTallerService.listarOrdenesActivas(tenantSlug),
        inventarioService.listarItems(tenantSlug),
        inventarioService.listarSolicitudes(tenantSlug),
      ])
      const ordenesList = ordenesData.results || ordenesData || []
      const itemsList = itemsData.results || itemsData || []
      const solicitudesList = solicitudesData.results || solicitudesData || []
      setOrdenes(ordenesList)
      setItemsInventario(itemsList)
      setSolicitudes(solicitudesList)

      setDetalleForm((prev) => {
        const next = { ...prev }
        ordenesList.forEach((ot) => {
          ;(ot.detalles || []).forEach((d) => {
            if (!next[d.id]) next[d.id] = initDetalleForm()
          })
        })
        return next
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Error cargando taller interno')
    } finally {
      setLoading(false)
    }
  }, [tenantSlug])

  useEffect(() => {
    cargar()
  }, [cargar])

  const setFormValue = (detalleId, key, value) => {
    setDetalleForm((prev) => ({
      ...prev,
      [detalleId]: { ...initDetalleForm(), ...(prev[detalleId] || {}), [key]: value },
    }))
  }

  const getForm = (detalleId) => ({ ...initDetalleForm(), ...(detalleForm[detalleId] || {}) })

  const ejecutar = async (fn, okMessage = 'Accion aplicada') => {
    try {
      setError(null)
      await fn()
      setSuccess(okMessage)
      await cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo completar la accion')
    }
  }

  const inventarioOptions = useMemo(
    () => itemsInventario.filter((i) => i.activo).map((i) => ({ id: i.id, label: `${i.codigo} - ${i.nombre} (stock ${i.stock_actual})` })),
    [itemsInventario]
  )

  const abrirSolicitud = (orden) => {
    setModalSolicitud({ open: true, orden, motivo: '', lineas: [nuevaLineaRepuesto()] })
  }

  const actualizarLinea = (idx, key, value) => {
    setModalSolicitud((prev) => {
      const lineas = [...prev.lineas]
      lineas[idx] = { ...lineas[idx], [key]: value }
      return { ...prev, lineas }
    })
  }

  const agregarLinea = () => setModalSolicitud((prev) => ({ ...prev, lineas: [...prev.lineas, nuevaLineaRepuesto()] }))
  const quitarLinea = (idx) => setModalSolicitud((prev) => ({ ...prev, lineas: prev.lineas.filter((_, i) => i !== idx) }))

  const crearSolicitudRepuestos = async () => {
    if (!modalSolicitud.orden) return
    const detalles = modalSolicitud.lineas
      .filter((l) => l.itemInventarioId && Number(l.cantidadSolicitada || 0) > 0)
      .map((l) => ({
        item_inventario_id: l.itemInventarioId,
        cantidad_solicitada: Number(l.cantidadSolicitada),
        observacion: l.observacion || '',
      }))

    if (!detalles.length) {
      setError('Debes agregar al menos un repuesto válido.')
      return
    }

    await ejecutar(
      () => inventarioService.crearSolicitud(tenantSlug, {
        cita_id: modalSolicitud.orden.cita,
        orden_global_id: modalSolicitud.orden.id,
        motivo: modalSolicitud.motivo || `Solicitud para OT ${modalSolicitud.orden.numero}`,
        detalles,
      }),
      'Solicitud de repuestos creada'
    )
    setModalSolicitud({ open: false, orden: null, motivo: '', lineas: [nuevaLineaRepuesto()] })
  }

  const solicitudesPorOrden = useMemo(() => {
    const map = {}
    for (const s of solicitudes) {
      if (!s.orden_global) continue
      if (!map[s.orden_global]) map[s.orden_global] = []
      map[s.orden_global].push(s)
    }
    return map
  }, [solicitudes])

  const marcarDetalleRecibido = async (solicitudId, detalle) => {
    await ejecutar(
      () => inventarioService.marcarRecibidaTaller(tenantSlug, solicitudId, [
        { detalle_id: detalle.id, cantidad_recibida: detalle.cantidad_entregada || 0 },
      ]),
      'Repuesto marcado como recibido en taller'
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Gestion Interna de Taller</h1>
      {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Cargando...</div>
        ) : ordenes.length === 0 ? (
          <div className="p-8 text-center text-carbon-500 dark:text-neutral-400">No hay ordenes activas</div>
        ) : (
          <div className="divide-y divide-neutral-200/60 dark:divide-white/[0.06]">
            {ordenes.map((ot) => {
              const solicitudesOt = solicitudesPorOrden[ot.id] || []
              const detallesSolicitud = solicitudesOt.flatMap((s) => (s.detalles || []).map((d) => ({ ...d, solicitudId: s.id, solicitudEstado: s.estado })))
              const pendientesRecibir = detallesSolicitud.filter((d) => (d.cantidad_entregada || 0) > (d.cantidad_recibida_taller || 0))
              const recibidos = detallesSolicitud.filter((d) => (d.cantidad_recibida_taller || 0) > 0)

              return (
                <div key={ot.id} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{ot.numero} - {ot.estado}</p>
                      <p className="text-sm text-carbon-600 dark:text-neutral-400">Cita: {ot.cita}</p>
                    </div>
                    <div className="flex gap-2">
                      {puedeSolicitarRepuestos && (
                        <button onClick={() => abrirSolicitud(ot)} className="text-sm px-3 py-1 rounded bg-rose-700 text-white">Solicitar repuestos</button>
                      )}
                      <button
                        onClick={() => ejecutar(() => avanceTallerService.finalizarOrden(tenantSlug, ot.id), 'Orden finalizada')}
                        className="text-sm px-3 py-1 rounded bg-emerald-600 text-white"
                      >
                        Finalizar orden
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(ot.detalles || []).map((d) => {
                      const form = getForm(d.id)
                      return (
                        <div key={d.id} className="border border-neutral-200/60 dark:border-white/[0.06] rounded p-3 text-sm space-y-3">
                          <p className="font-medium">{d.servicio_nombre || 'Servicio'} - {d.estado}</p>
                          <p className="text-carbon-600 dark:text-neutral-400">Mecanico: {d.mecanico_nombres || 'Sin asignar'}</p>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input value={form.tiempoRealMin} onChange={(e) => setFormValue(d.id, 'tiempoRealMin', e.target.value)} type="number" min="0" placeholder="Tiempo real (min)" className="px-2 py-1 border rounded bg-white dark:bg-carbon-800" />
                            <input value={form.motivoPausa} onChange={(e) => setFormValue(d.id, 'motivoPausa', e.target.value)} placeholder="Motivo pausa" className="px-2 py-1 border rounded bg-white dark:bg-carbon-800" />
                            <input value={form.motivoInnecesario} onChange={(e) => setFormValue(d.id, 'motivoInnecesario', e.target.value)} placeholder="Motivo innecesario" className="px-2 py-1 border rounded bg-white dark:bg-carbon-800" />
                            <input value={form.observacionesMecanico} onChange={(e) => setFormValue(d.id, 'observacionesMecanico', e.target.value)} placeholder="Observaciones mecanico" className="px-2 py-1 border rounded bg-white dark:bg-carbon-800" />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => ejecutar(() => avanceTallerService.iniciarDetalle(tenantSlug, ot.id, d.id), 'Detalle iniciado')} className="text-xs px-2 py-1 bg-blue-600 text-white rounded">Iniciar</button>
                            <button onClick={() => ejecutar(() => avanceTallerService.pausarDetalle(tenantSlug, ot.id, d.id, form.motivoPausa), 'Detalle pausado')} className="text-xs px-2 py-1 bg-amber-600 text-white rounded">Pausar</button>
                            <button onClick={() => ejecutar(() => avanceTallerService.marcarInnecesario(tenantSlug, ot.id, d.id, form.motivoInnecesario), 'Detalle marcado como innecesario')} className="text-xs px-2 py-1 bg-neutral-700 text-white rounded">Innecesario</button>
                            <button
                              onClick={() => ejecutar(() => avanceTallerService.finalizarDetalle(tenantSlug, ot.id, d.id, {
                                tiempo_real_min: form.tiempoRealMin === '' ? null : Number(form.tiempoRealMin),
                                observaciones_mecanico: form.observacionesMecanico,
                              }), 'Detalle finalizado')}
                              className="text-xs px-2 py-1 bg-emerald-700 text-white rounded"
                            >
                              Finalizar detalle
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-neutral-200/60 dark:border-white/[0.06] rounded p-3">
                      <h3 className="font-semibold mb-2">Repuestos solicitados (pendientes de recibir)</h3>
                      {pendientesRecibir.length === 0 ? (
                        <p className="text-sm text-carbon-500 dark:text-neutral-400">Sin pendientes.</p>
                      ) : (
                        <div className="space-y-2">
                          {pendientesRecibir.map((d) => (
                            <div key={d.id} className="text-sm flex items-center justify-between border rounded px-2 py-1 border-neutral-200/60 dark:border-white/[0.08]">
                              <div>
                                <p className="font-medium">{d.item_nombre}</p>
                                <p className="text-xs text-carbon-600 dark:text-neutral-400">Entregado: {d.cantidad_entregada} | Recibido: {d.cantidad_recibida_taller || 0}</p>
                              </div>
                              <button
                                onClick={() => marcarDetalleRecibido(d.solicitudId, d)}
                                className="text-xs px-2 py-1 bg-blue-700 text-white rounded"
                              >
                                Marcar recibido
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border border-neutral-200/60 dark:border-white/[0.06] rounded p-3">
                      <h3 className="font-semibold mb-2">Repuestos recibidos</h3>
                      {recibidos.length === 0 ? (
                        <p className="text-sm text-carbon-500 dark:text-neutral-400">Sin repuestos recibidos.</p>
                      ) : (
                        <div className="space-y-2">
                          {recibidos.map((d) => (
                            <div key={d.id} className="text-sm border rounded px-2 py-1 border-neutral-200/60 dark:border-white/[0.08]">
                              <p className="font-medium">{d.item_nombre}</p>
                              <p className="text-xs text-carbon-600 dark:text-neutral-400">Cantidad recibida: {d.cantidad_recibida_taller}</p>
                              <p className="text-xs text-carbon-600 dark:text-neutral-400">Hora recepcion: {d.recibido_taller_at ? new Date(d.recibido_taller_at).toLocaleString() : '-'}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalSolicitud.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] p-5 space-y-4">
            <h3 className="text-lg font-semibold">Nueva solicitud de repuestos</h3>
            <input
              value={modalSolicitud.motivo}
              onChange={(e) => setModalSolicitud((prev) => ({ ...prev, motivo: e.target.value }))}
              placeholder="Motivo general"
              className="w-full px-3 py-2 border rounded bg-white dark:bg-carbon-800"
            />
            <div className="space-y-2 max-h-80 overflow-auto">
              {modalSolicitud.lineas.map((linea, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                  <select value={linea.itemInventarioId} onChange={(e) => actualizarLinea(idx, 'itemInventarioId', e.target.value)} className="md:col-span-6 px-2 py-1 border rounded bg-white dark:bg-carbon-800">
                    <option value="">Seleccionar item</option>
                    {inventarioOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                  </select>
                  <input type="number" min="1" value={linea.cantidadSolicitada} onChange={(e) => actualizarLinea(idx, 'cantidadSolicitada', e.target.value)} className="md:col-span-2 px-2 py-1 border rounded bg-white dark:bg-carbon-800" />
                  <input value={linea.observacion} onChange={(e) => actualizarLinea(idx, 'observacion', e.target.value)} placeholder="Observacion" className="md:col-span-3 px-2 py-1 border rounded bg-white dark:bg-carbon-800" />
                  <button onClick={() => quitarLinea(idx)} className="md:col-span-1 text-xs px-2 py-1 border rounded">Quitar</button>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={agregarLinea} className="px-3 py-2 border rounded">Agregar repuesto</button>
              <div className="flex gap-2">
                <button onClick={() => setModalSolicitud({ open: false, orden: null, motivo: '', lineas: [nuevaLineaRepuesto()] })} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button onClick={crearSolicitudRepuestos} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Crear solicitud</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionTallerInternoView
