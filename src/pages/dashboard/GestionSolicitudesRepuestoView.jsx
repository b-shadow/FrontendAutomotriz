import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTenant } from '../../hooks/useTenant'
import inventarioService from '../../services/inventarioService'

const GestionSolicitudesRepuestoView = () => {
  const { tenantSlug } = useTenant()
  const [solicitudes, setSolicitudes] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [entregaOpenId, setEntregaOpenId] = useState(null)
  const [cantidadesEntrega, setCantidadesEntrega] = useState({})

  const cargar = useCallback(async () => {
    if (!tenantSlug) return
    try {
      setError(null)
      const data = await inventarioService.listarSolicitudes(tenantSlug)
      setSolicitudes(data.results || data || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Error cargando solicitudes')
    }
  }, [tenantSlug])

  useEffect(() => {
    cargar()
  }, [cargar])

  const estadoClass = (estado) => {
    if (estado === 'CREADA') return 'bg-slate-100 text-slate-700'
    if (estado === 'APROBADA_POR_ASESOR') return 'bg-emerald-100 text-emerald-700'
    if (estado === 'EN_REVISION_ALMACEN') return 'bg-amber-100 text-amber-700'
    if (estado === 'ENTREGADA') return 'bg-blue-100 text-blue-700'
    return 'bg-neutral-100 text-neutral-700'
  }

  const abrirEntrega = (s) => {
    const base = {}
    ;(s.detalles || []).forEach((d) => {
      base[d.id] = d.cantidad_solicitada
    })
    setCantidadesEntrega(base)
    setEntregaOpenId(s.id)
  }

  const detallesEntrega = useMemo(
    () => (solicitudes.find((x) => x.id === entregaOpenId)?.detalles || []),
    [solicitudes, entregaOpenId]
  )

  const aprobar = async (s) => {
    try {
      await inventarioService.aprobarSolicitud(tenantSlug, s.id, 'Aprobada por asesor')
      setSuccess('Solicitud aprobada')
      await cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo aprobar')
    }
  }

  const enProceso = async (s) => {
    try {
      await inventarioService.marcarEnProcesoAlmacen(tenantSlug, s.id, 'En preparación')
      setSuccess('Solicitud marcada en proceso')
      await cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo marcar en proceso')
    }
  }

  const entregar = async () => {
    try {
      const detalles = detallesEntrega.map((d) => ({
        detalle_id: d.id,
        cantidad_entregada: Number(cantidadesEntrega[d.id] || 0),
      }))
      await inventarioService.marcarEntregada(tenantSlug, entregaOpenId, detalles)
      setEntregaOpenId(null)
      setCantidadesEntrega({})
      setSuccess('Solicitud entregada')
      await cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo marcar entrega')
    }
  }

  const asignarProveedorEta = async (s) => {
    const proveedorId = window.prompt('ID del proveedor asignado')
    if (!proveedorId) return
    const eta = window.prompt('ETA estimado (ej. 2026-05-20 o 3 dias)', '') || ''
    const observaciones = window.prompt('Observaciones (opcional)', '') || ''
    try {
      await inventarioService.asignarProveedorEta(tenantSlug, s.id, {
        proveedor_id: proveedorId,
        eta,
        observaciones,
      })
      setSuccess('Proveedor y ETA asignados')
      await cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo asignar proveedor/ETA')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Solicitudes de Repuesto</h1>
      <p className="text-sm text-carbon-600 dark:text-neutral-400">Las solicitudes se crean desde Taller Interno (orden de trabajo).</p>
      {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white dark:bg-carbon-900 rounded-lg border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-carbon-800">
            <tr>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-left">Motivo</th>
              <th className="px-3 py-2 text-left">Detalles</th>
              <th className="px-3 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => (
              <tr key={s.id} className="border-t border-neutral-200/60 dark:border-white/[0.06]">
                <td className="px-3 py-2">{new Date(s.created_at).toLocaleString()}</td>
                <td className="px-3 py-2"><span className={`px-2 py-1 rounded text-xs ${estadoClass(s.estado)}`}>{s.estado}</span></td>
                <td className="px-3 py-2">{s.motivo || '-'}</td>
                <td className="px-3 py-2">{(s.detalles || []).length}</td>
                <td className="px-3 py-2 flex gap-2">
                  <button onClick={() => aprobar(s)} className="text-emerald-700">Aprobar</button>
                  <button onClick={() => enProceso(s)} className="text-amber-700">En proceso</button>
                  <button onClick={() => asignarProveedorEta(s)} className="text-sky-700">Asignar prov/ETA</button>
                  <button onClick={() => abrirEntrega(s)} className="text-indigo-700">Entregar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {entregaOpenId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 dark:border-white/[0.08] dark:bg-carbon-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-carbon-900 dark:text-white">Marcar entrega</h2>
              <button onClick={() => setEntregaOpenId(null)} className="px-2 py-1 rounded">X</button>
            </div>
            <div className="space-y-3">
              {detallesEntrega.map((d) => (
                <div key={d.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                  <div className="md:col-span-2 text-sm">{d.item_nombre} (solicitado: {d.cantidad_solicitada})</div>
                  <input
                    type="number"
                    min="0"
                    value={cantidadesEntrega[d.id] ?? d.cantidad_solicitada}
                    onChange={(e) => setCantidadesEntrega((p) => ({ ...p, [d.id]: e.target.value }))}
                    className="px-3 py-2 border rounded bg-white dark:bg-carbon-800"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEntregaOpenId(null)} className="px-4 py-2 border rounded">Cancelar</button>
              <button onClick={entregar} className="px-4 py-2 bg-indigo-700 text-white rounded">Confirmar entrega</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionSolicitudesRepuestoView
