import { useCallback, useEffect, useMemo, useState } from 'react'
import { CreditCard, Plus, Trash2, X } from 'lucide-react'
import { useTenant } from '../../hooks/useTenant'
import inventarioService from '../../services/inventarioService'

const METODOS_PAGO = ['Efectivo', 'Tarjeta (Stripe)', 'QR']

const VentasMostradorView = () => {
  const { tenantSlug } = useTenant()
  const [items, setItems] = useState([])
  const [lineas, setLineas] = useState([])
  const [metodoPago, setMetodoPago] = useState('Efectivo')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loadingPago, setLoadingPago] = useState(false)

  const [showAgregarModal, setShowAgregarModal] = useState(false)
  const [agregarForm, setAgregarForm] = useState({ itemId: '', cantidad: 1 })

  const [showQRModal, setShowQRModal] = useState(false)
  const [qrPago, setQrPago] = useState(null)

  const cargar = useCallback(async () => {
    const data = await inventarioService.listarItems(tenantSlug)
    const rows = data.results || data || []
    setItems(rows.filter((i) => i.activo && Number(i.stock_actual) > 0))
  }, [tenantSlug])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const result = params.get('stripe_sale_result')
    const ventaId = params.get('venta_id')
    const pagoTallerId = params.get('pago_taller_id')
    const sessionId = params.get('session_id')
    if (!result || !ventaId || !pagoTallerId) return

    const limpiarUrl = () => {
      const url = new URL(window.location.href)
      url.searchParams.delete('stripe_sale_result')
      url.searchParams.delete('venta_id')
      url.searchParams.delete('pago_taller_id')
      url.searchParams.delete('session_id')
      window.history.replaceState({}, '', url.toString())
    }

    const procesar = async () => {
      try {
        if (result === 'success' && sessionId) {
          await inventarioService.confirmarPagoTarjetaVenta(tenantSlug, {
            venta_id: ventaId,
            pago_taller_id: pagoTallerId,
            session_id: sessionId,
          })
          setSuccess('Pago con tarjeta confirmado. Venta registrada y facturada.')
          setLineas([])
          await cargar()
        } else if (result === 'cancel') {
          setError('Pago con tarjeta cancelado por el usuario.')
        }
      } catch (err) {
        setError(err?.response?.data?.error || 'No se pudo confirmar el pago de tarjeta.')
      } finally {
        limpiarUrl()
      }
    }

    procesar()
  }, [tenantSlug, cargar])

  const actualizarLinea = (idx, key, val) => {
    setLineas((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: val } : l)))
  }

  const quitarLinea = (idx) => setLineas((p) => p.filter((_, i) => i !== idx))

  const detalleCalculado = useMemo(() => {
    return lineas.map((l) => {
      const item = items.find((i) => i.id === l.itemId)
      const qty = Number(l.cantidad || 0)
      const precio = Number(item?.precio_venta || 0)
      return { ...l, item, qty, precio, subtotal: qty * precio }
    })
  }, [lineas, items])

  const total = useMemo(() => detalleCalculado.reduce((a, d) => a + d.subtotal, 0), [detalleCalculado])

  const validar = () => {
    if (!detalleCalculado.length) return 'Agrega al menos un producto.'
    for (const d of detalleCalculado) {
      if (!d.item) return 'Hay lineas con producto invalido.'
      if (d.qty <= 0) return 'Cantidad invalida.'
      if (d.qty > Number(d.item.stock_actual || 0)) return `Stock insuficiente para ${d.item.nombre}.`
    }
    return null
  }

  const registrarVentaConPagoConfirmado = async (metodoConfirmado, pagoConfirmado = null) => {
    const detalles = detalleCalculado.map((d) => ({
      item_inventario_id: d.item.id,
      cantidad: d.qty,
      precio_unitario: d.precio,
    }))

    const venta = await inventarioService.crearVentaMostrador(tenantSlug, {
      cliente_nombre_libre: 'Cliente Mostrador',
      estado: 'BORRADOR',
      detalles,
    })
    await inventarioService.confirmarVentaMostrador(tenantSlug, venta.id)

    let pagoId = pagoConfirmado?.id
    if (!pagoId) {
      const pago = await inventarioService.crearPagoTaller(tenantSlug, {
        tipo_origen: 'VENTA',
        venta: venta.id,
        tipo_destino: 'VENTA',
        id_destino: String(venta.id),
        estado: 'PENDIENTE',
        monto_total: total,
        monto_real: total,
        monto_cobrado: total,
        metodo_pago: metodoConfirmado,
        moneda: 'BOB',
        descripcion: `Pago venta mostrador ${venta.id}`,
      })
      pagoId = pago.id
      await inventarioService.marcarPagoRecibido(tenantSlug, pagoId)
    }

    await inventarioService.crearFactura(tenantSlug, { pago_taller: pagoId })
    setSuccess('Venta registrada y facturada correctamente.')
    setLineas([])
    setQrPago(null)
    await cargar()
  }

  const agregarProducto = () => {
    const item = items.find((x) => x.id === agregarForm.itemId)
    const cantidad = Number(agregarForm.cantidad)
    if (!item) {
      setError('Selecciona un producto valido.')
      return
    }
    if (!cantidad || cantidad <= 0) {
      setError('Cantidad invalida.')
      return
    }
    if (cantidad > Number(item.stock_actual || 0)) {
      setError(`Stock insuficiente para ${item.nombre}.`)
      return
    }

    setLineas((prev) => {
      const idx = prev.findIndex((l) => l.itemId === item.id)
      if (idx >= 0) {
        const next = [...prev]
        const nuevaCantidad = Number(next[idx].cantidad) + cantidad
        if (nuevaCantidad > Number(item.stock_actual || 0)) {
          setError(`No puedes superar el stock de ${item.nombre}.`)
          return prev
        }
        next[idx] = { ...next[idx], cantidad: nuevaCantidad }
        return next
      }
      return [...prev, { itemId: item.id, cantidad }]
    })

    setShowAgregarModal(false)
    setAgregarForm({ itemId: items[0]?.id || '', cantidad: 1 })
  }

  const procesarVenta = async () => {
    const err = validar()
    if (err) return setError(err)
    setError(null)

    if (metodoPago === 'Efectivo') {
      try {
        setLoadingPago(true)
        await registrarVentaConPagoConfirmado('EFECTIVO')
      } catch (e) {
        setError(e?.response?.data?.error || 'No se pudo completar la venta en efectivo.')
      } finally {
        setLoadingPago(false)
      }
      return
    }

    if (metodoPago === 'Tarjeta (Stripe)') {
      try {
        setLoadingPago(true)
        const detalles = detalleCalculado.map((d) => ({
          item_inventario_id: d.item.id,
          cantidad: d.qty,
          precio_unitario: d.precio,
        }))
        const stripeData = await inventarioService.iniciarPagoTarjetaVenta(tenantSlug, {
          cliente_nombre_libre: 'Cliente Mostrador',
          detalles,
          descripcion: 'Pago tarjeta venta presencial',
        })
        if (stripeData?.checkoutUrl) {
          window.location.href = stripeData.checkoutUrl
          return
        }
        setError('No se pudo abrir el checkout de Stripe.')
      } catch (e) {
        setError(e?.response?.data?.error || 'No se pudo iniciar el pago con Stripe.')
      } finally {
        setLoadingPago(false)
      }
      return
    }

    if (metodoPago === 'QR') {
      try {
        setLoadingPago(true)
        const fechaExp = new Date(Date.now() + 30 * 60 * 1000).toISOString()
        const qr = await inventarioService.crearPagoQR(tenantSlug, {
          tipo_destino: 'VENTA',
          id_destino: `MOSTRADOR-${Date.now()}`,
          monto_real: Number(total.toFixed(2)),
          moneda: 'BOB',
          descripcion: 'Pago QR venta presencial',
          fecha_expiracion: fechaExp,
        })
        setQrPago(qr)
        setShowQRModal(true)
      } catch (e) {
        setError(e?.response?.data?.error || 'No se pudo generar el pago QR.')
      } finally {
        setLoadingPago(false)
      }
    }
  }

  const confirmarQRyRegistrar = async () => {
    if (!qrPago?.id) return
    try {
      setLoadingPago(true)
      await inventarioService.simularConfirmacionPagoQR(tenantSlug, qrPago.id)
      const estado = await inventarioService.consultarEstadoPagoQR(tenantSlug, qrPago.id)
      if (estado?.estado !== 'CONFIRMADO') {
        setError('El pago QR aun no esta confirmado.')
        return
      }
      await registrarVentaConPagoConfirmado('QR', qrPago)
      setShowQRModal(false)
    } catch (e) {
      setError(e?.response?.data?.error || 'No se pudo confirmar el pago QR.')
    } finally {
      setLoadingPago(false)
    }
  }

  useEffect(() => {
    if (!showAgregarModal) return
    setAgregarForm((prev) => ({
      itemId: prev.itemId || items[0]?.id || '',
      cantidad: prev.cantidad || 1,
    }))
  }, [showAgregarModal, items])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Venta Presencial</h1>
        <button onClick={() => setShowAgregarModal(true)} className="rounded-xl bg-gradient-to-r from-primary-600 to-burgundy-700 px-4 py-2 text-sm font-semibold text-white"><Plus size={16} className="mr-1 inline" />Agregar producto</button>
      </div>
      {success && <div className="rounded-lg bg-green-50 px-4 py-2 text-green-700">{success}</div>}
      {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-red-700">{error}</div>}

      <section className="rounded-2xl border border-neutral-200/60 bg-white p-4 dark:border-white/[0.06] dark:bg-carbon-900">
        <div className="overflow-x-auto rounded-xl border border-neutral-200/70 dark:border-white/[0.06]">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-carbon-800">
              <tr><th className="px-3 py-2 text-left">Producto</th><th className="px-3 py-2 text-left">Stock</th><th className="px-3 py-2 text-left">Precio unitario</th><th className="px-3 py-2 text-left">Cantidad</th><th className="px-3 py-2 text-left">Subtotal</th><th className="px-3 py-2 text-left">Accion</th></tr>
            </thead>
            <tbody>
              {detalleCalculado.map((d, idx) => (
                <tr key={idx} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <td className="px-3 py-2 font-medium">{d.item?.codigo} - {d.item?.nombre}</td>
                  <td className="px-3 py-2">{d.item?.stock_actual ?? '-'}</td>
                  <td className="px-3 py-2">$ {Number(d.precio || 0).toFixed(2)}</td>
                  <td className="px-3 py-2"><input type="number" min={1} max={d.item?.stock_actual || 1} value={d.qty} onChange={(e) => actualizarLinea(idx, 'cantidad', Number(e.target.value))} className="w-24 rounded border bg-white px-2 py-1 dark:bg-carbon-800" /></td>
                  <td className="px-3 py-2">$ {Number(d.subtotal || 0).toFixed(2)}</td>
                  <td className="px-3 py-2"><button onClick={() => quitarLinea(idx)} className="text-red-600"><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200/70 p-3 dark:border-white/[0.06]"><p className="text-xs uppercase text-carbon-500 dark:text-neutral-400">Total</p><p className="text-xl font-bold text-carbon-900 dark:text-white">$ {total.toFixed(2)}</p></div>
          <div className="rounded-xl border border-neutral-200/70 p-3 dark:border-white/[0.06]"><p className="text-xs uppercase text-carbon-500 dark:text-neutral-400">Pendiente</p><p className="text-xl font-bold text-carbon-900 dark:text-white">$ {total.toFixed(2)}</p><p className="text-xs text-carbon-500 dark:text-neutral-400">Pago total obligatorio.</p></div>
          <div className="rounded-xl border border-neutral-200/70 p-3 dark:border-white/[0.06]">
            <label className="text-xs uppercase text-carbon-500 dark:text-neutral-400">Metodo de pago</label>
            <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="mt-1 w-full rounded border bg-white px-2 py-2 dark:bg-carbon-800">
              {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button disabled={loadingPago} onClick={procesarVenta} className="rounded-xl bg-gradient-to-r from-primary-600 to-burgundy-700 px-5 py-2 font-semibold text-white disabled:opacity-60"><CreditCard size={16} className="mr-1 inline" />Registrar y pagar</button>
        </div>
      </section>

      {showAgregarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 dark:border-white/[0.08] dark:bg-carbon-900">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-bold">Agregar producto</h3><button onClick={() => setShowAgregarModal(false)}><X size={18} /></button></div>
            <div className="space-y-3">
              <select value={agregarForm.itemId} onChange={(e) => setAgregarForm((p) => ({ ...p, itemId: e.target.value }))} className="w-full rounded-lg border px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800">
                {items.map((i) => <option key={i.id} value={i.id}>{i.codigo} - {i.nombre} | stock: {i.stock_actual} | Bs {Number(i.precio_venta || 0).toFixed(2)}</option>)}
              </select>
              <input type="number" min={1} value={agregarForm.cantidad} onChange={(e) => setAgregarForm((p) => ({ ...p, cantidad: Number(e.target.value) }))} className="w-full rounded-lg border px-3 py-2 dark:border-white/[0.1] dark:bg-carbon-800" />
              <div className="flex justify-end gap-2"><button onClick={() => setShowAgregarModal(false)} className="rounded-lg border px-4 py-2">Cancelar</button><button onClick={agregarProducto} className="rounded-lg bg-gradient-to-r from-primary-600 to-burgundy-700 px-4 py-2 text-white">Agregar</button></div>
            </div>
          </div>
        </div>
      )}

      {showQRModal && qrPago && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 dark:border-white/[0.08] dark:bg-carbon-900">
            <div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-bold">Pago QR</h3><button onClick={() => setShowQRModal(false)}><X size={18} /></button></div>
            <p className="mb-3 text-sm text-carbon-600 dark:text-neutral-300">Escanea el QR o abre el enlace para completar el pago, luego confirma.</p>
            {qrPago.qr_imagen_url && <img src={qrPago.qr_imagen_url} alt="QR pago" className="mx-auto mb-3 max-h-64" />}
            {qrPago.url_pago && <a href={qrPago.url_pago} target="_blank" rel="noreferrer" className="mb-4 block truncate text-center text-sm text-primary-600 underline">{qrPago.url_pago}</a>}
            <div className="mt-4 flex justify-end gap-2"><button onClick={() => setShowQRModal(false)} className="rounded-lg border px-4 py-2">Cerrar</button><button disabled={loadingPago} onClick={confirmarQRyRegistrar} className="rounded-lg bg-gradient-to-r from-primary-600 to-burgundy-700 px-4 py-2 text-white">Ya pague, confirmar y registrar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VentasMostradorView
