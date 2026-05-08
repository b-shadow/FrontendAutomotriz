import { useCallback, useEffect, useState } from 'react'
import { useTenant } from '../../hooks/useTenant'
import ordenesTrabajoService from '../../services/ordenesTrabajoService'

const estadoColors = {
  ABIERTA: 'bg-slate-100 text-slate-700',
  ASIGNADA: 'bg-amber-100 text-amber-700',
  EN_PROCESO: 'bg-blue-100 text-blue-700',
  PAUSADA: 'bg-orange-100 text-orange-700',
  FINALIZADA: 'bg-emerald-100 text-emerald-700',
  CERRADA: 'bg-neutral-200 text-neutral-700',
  CANCELADA: 'bg-red-100 text-red-700',
}

const GestionOrdenesTrabajoView = () => {
  const { tenantSlug } = useTenant()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [mecanicos, setMecanicos] = useState([])
  const [filters, setFilters] = useState({ estado: '', search: '' })
  const [modalMecanicos, setModalMecanicos] = useState({ open: false, orden: null, seleccion: [] })
  const [modalDetalle, setModalDetalle] = useState({ open: false, orden: null, detalleId: '', mecanicoId: '' })

  const cargar = useCallback(async () => {
    if (!tenantSlug) return
    try {
      setLoading(true)
      setError(null)
      const [res, mecs] = await Promise.all([
        ordenesTrabajoService.listar(tenantSlug, filters),
        ordenesTrabajoService.listarMecanicosDisponibles(tenantSlug),
      ])
      setItems(res.results || res || [])
      setMecanicos(mecs || [])
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error cargando ordenes de trabajo')
    } finally {
      setLoading(false)
    }
  }, [tenantSlug, filters])

  useEffect(() => {
    cargar()
  }, [cargar])

  const abrirAsignarMecanicos = (ot) => {
    const pre = (ot.mecanicos_asignados || []).map((m) => m.mecanico)
    setModalMecanicos({ open: true, orden: ot, seleccion: pre })
  }

  const toggleMecanico = (mecanicoId) => {
    setModalMecanicos((prev) => {
      const existe = prev.seleccion.includes(mecanicoId)
      return {
        ...prev,
        seleccion: existe ? prev.seleccion.filter((id) => id !== mecanicoId) : [...prev.seleccion, mecanicoId],
      }
    })
  }

  const asignarMecanicos = async () => {
    if (!modalMecanicos.orden) return
    try {
      const payload = modalMecanicos.seleccion.map((id, idx) => ({ mecanico_id: id, es_principal: idx === 0 }))
      await ordenesTrabajoService.asignarMecanicos(tenantSlug, modalMecanicos.orden.id, payload)
      setSuccess('Mecanicos asignados')
      setModalMecanicos({ open: false, orden: null, seleccion: [] })
      cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'Error asignando mecanicos')
    }
  }

  const iniciarOrden = async (ot) => {
    try {
      await ordenesTrabajoService.iniciar(tenantSlug, ot.id)
      setSuccess('Orden puesta en marcha')
      cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar la orden')
    }
  }

  const abrirAsignarDetalle = (ot) => {
    if (!ot.detalles?.length) return
    const d = ot.detalles[0]
    setModalDetalle({
      open: true,
      orden: ot,
      detalleId: d.id,
      mecanicoId: d.mecanico_asignado || '',
    })
  }

  const asignarDetalle = async () => {
    if (!modalDetalle.orden || !modalDetalle.detalleId) return
    try {
      await ordenesTrabajoService.asignarDetalles(tenantSlug, modalDetalle.orden.id, [
        { detalle_id: modalDetalle.detalleId, mecanico_id: modalDetalle.mecanicoId || null },
      ])
      setSuccess('Detalle actualizado')
      setModalDetalle({ open: false, orden: null, detalleId: '', mecanicoId: '' })
      cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo asignar detalle')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Gestionar Ordenes de Trabajo</h1>
      </div>

      {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white dark:bg-carbon-900 p-4 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] text-sm">
        Las ordenes se generan automaticamente al registrar la recepcion del vehiculo. Aqui solo se asignan mecanicos y se pone en marcha la orden.
      </div>

      <div className="bg-white dark:bg-carbon-900 p-4 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-3">
        <select
          value={filters.estado}
          onChange={(e) => setFilters((p) => ({ ...p, estado: e.target.value }))}
          className="px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
        >
          <option value="">Todos los estados</option>
          <option value="ABIERTA">Abierta</option>
          <option value="ASIGNADA">Asignada</option>
          <option value="EN_PROCESO">En proceso</option>
          <option value="PAUSADA">Pausada</option>
          <option value="FINALIZADA">Finalizada</option>
          <option value="CERRADA">Cerrada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
        <input
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
          placeholder="Buscar por numero OT, placa o cliente"
          className="px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
        />
      </div>

      <div className="bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-carbon-500 dark:text-neutral-400">Sin ordenes registradas</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-carbon-800">
              <tr>
                <th className="px-4 py-3 text-left">Numero OT</th>
                <th className="px-4 py-3 text-left">Cita</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Fecha apertura</th>
                <th className="px-4 py-3 text-left">Detalles</th>
                <th className="px-4 py-3 text-left">Mecanicos</th>
                <th className="px-4 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ot) => (
                <tr key={ot.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                  <td className="px-4 py-3 font-semibold">{ot.numero}</td>
                  <td className="px-4 py-3">{ot.cita}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${estadoColors[ot.estado] || 'bg-neutral-100 text-neutral-700'}`}>
                      {ot.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">{ot.fecha_apertura ? new Date(ot.fecha_apertura).toLocaleString() : '-'}</td>
                  <td className="px-4 py-3">{ot.detalles?.length || 0}</td>
                  <td className="px-4 py-3">
                    {(ot.mecanicos_asignados?.length || 0) === 0
                      ? 'Sin asignar'
                      : ot.mecanicos_asignados.map((m) => m.mecanico_nombres || m.mecanico).join(', ')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button onClick={() => abrirAsignarMecanicos(ot)} className="text-amber-700">Asignar mecanicos</button>
                      <button onClick={() => abrirAsignarDetalle(ot)} className="text-indigo-700">Asignar detalle</button>
                      <button onClick={() => iniciarOrden(ot)} className="text-emerald-700">Poner en marcha</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalMecanicos.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] p-5 space-y-4">
            <h3 className="text-lg font-semibold text-carbon-900 dark:text-white">Asignar mecanicos</h3>
            <p className="text-sm text-carbon-600 dark:text-neutral-400">Selecciona uno o mas. El primero seleccionado queda como principal.</p>
            <div className="max-h-72 overflow-auto space-y-2">
              {mecanicos.map((m) => (
                <label key={m.id} className="flex items-center gap-2 p-2 rounded border border-neutral-200/60 dark:border-white/[0.08]">
                  <input
                    type="checkbox"
                    checked={modalMecanicos.seleccion.includes(m.id)}
                    onChange={() => toggleMecanico(m.id)}
                  />
                  <span className="text-sm text-carbon-900 dark:text-white">{m.nombre}</span>
                  <span className="text-xs text-carbon-500 dark:text-neutral-400">{m.email}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setModalMecanicos({ open: false, orden: null, seleccion: [] })} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={asignarMecanicos} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {modalDetalle.open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] p-5 space-y-4">
            <h3 className="text-lg font-semibold text-carbon-900 dark:text-white">Asignar detalle (opcional)</h3>
            <select
              value={modalDetalle.detalleId}
              onChange={(e) => setModalDetalle((prev) => ({ ...prev, detalleId: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
            >
              {(modalDetalle.orden?.detalles || []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.servicio_nombre || 'Servicio'} - {d.estado}
                </option>
              ))}
            </select>
            <select
              value={modalDetalle.mecanicoId}
              onChange={(e) => setModalDetalle((prev) => ({ ...prev, mecanicoId: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
            >
              <option value="">Sin asignar</option>
              {mecanicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setModalDetalle({ open: false, orden: null, detalleId: '', mecanicoId: '' })} className="px-4 py-2 border rounded-lg">Cancelar</button>
              <button onClick={asignarDetalle} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionOrdenesTrabajoView
