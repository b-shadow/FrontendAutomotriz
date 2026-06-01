import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Download,
  CalendarDays,
  FileText,
  MoreVertical,
} from 'lucide-react'
import { useTenant } from '../../hooks/useTenant'
import inventarioService from '../../services/inventarioService'

const ESTADOS = [
  'TODOS',
  'CREADA',
  'APROBADA_POR_ASESOR',
  'EN_REVISION_ALMACEN',
  'PARCIALMENTE_DISPONIBLE',
  'ENTREGADA',
  'CERRADA',
]

const GestionSolicitudesRepuestoView = () => {
  const { tenantSlug } = useTenant()
  const [solicitudes, setSolicitudes] = useState([])
  const [itemsInventario, setItemsInventario] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [entregaOpenId, setEntregaOpenId] = useState(null)
  const [cantidadesEntrega, setCantidadesEntrega] = useState({})
  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS')
  const [rango, setRango] = useState('TODOS')
  const [nuevaSolicitudOpen, setNuevaSolicitudOpen] = useState(false)
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    cita_id: '',
    orden_global_id: '',
    motivo: '',
    item_inventario_id: '',
    cantidad_solicitada: 1,
    observacion: '',
  })

  const cargar = useCallback(async () => {
    if (!tenantSlug) return
    try {
      setError(null)
      const [data, items] = await Promise.all([
        inventarioService.listarSolicitudes(tenantSlug),
        inventarioService.listarItems(tenantSlug),
      ])
      setSolicitudes(data.results || data || [])
      setItemsInventario(items.results || items || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Error cargando solicitudes')
    }
  }, [tenantSlug])

  useEffect(() => {
    cargar()
  }, [cargar])

  const estadoClass = (estado) => {
    if (estado === 'CREADA') return 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200'
    if (estado === 'APROBADA_POR_ASESOR') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
    if (estado === 'EN_REVISION_ALMACEN') return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
    if (estado === 'PARCIALMENTE_DISPONIBLE') return 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200'
    if (estado === 'ENTREGADA') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
    if (estado === 'CERRADA') return 'bg-neutral-200 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-200'
    return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-500/20 dark:text-neutral-200'
  }

  const filtrarPorRango = (fecha) => {
    if (rango === 'TODOS') return true
    const d = new Date(fecha)
    const now = new Date()
    if (rango === 'HOY') return d.toDateString() === now.toDateString()
    if (rango === 'SEMANA') {
      const diff = (now - d) / (1000 * 60 * 60 * 24)
      return diff <= 7
    }
    if (rango === 'MES') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    return true
  }

  const solicitudesFiltradas = useMemo(() => {
    return (solicitudes || []).filter((s) => {
      const byEstado = estadoFiltro === 'TODOS' ? true : s.estado === estadoFiltro
      const q = search.trim().toLowerCase()
      const bySearch = !q
        ? true
        : `${s.estado || ''} ${s.motivo || ''} ${(s.detalles || []).length}`.toLowerCase().includes(q)
      const byRango = filtrarPorRango(s.created_at)
      return byEstado && bySearch && byRango
    })
  }, [solicitudes, search, estadoFiltro, rango])

  const stats = useMemo(() => {
    const total = solicitudesFiltradas.length
    const enProceso = solicitudesFiltradas.filter((s) => ['APROBADA_POR_ASESOR', 'EN_REVISION_ALMACEN', 'PARCIALMENTE_DISPONIBLE'].includes(s.estado)).length
    const entregadas = solicitudesFiltradas.filter((s) => s.estado === 'ENTREGADA').length
    const pendientes = solicitudesFiltradas.filter((s) => ['CREADA'].includes(s.estado)).length
    return { total, enProceso, entregadas, pendientes }
  }, [solicitudesFiltradas])

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
      await inventarioService.asignarProveedorEta(tenantSlug, s.id, { proveedor_id: proveedorId, eta, observaciones })
      setSuccess('Proveedor y ETA asignados')
      await cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo asignar proveedor/ETA')
    }
  }

  const exportarCsv = () => {
    const headers = ['fecha', 'estado', 'motivo', 'detalles']
    const rows = solicitudesFiltradas.map((s) => [
      new Date(s.created_at).toLocaleString(),
      s.estado,
      (s.motivo || '').replaceAll(',', ' '),
      (s.detalles || []).length,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'solicitudes_repuesto.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const abrirNuevaSolicitud = () => {
    setNuevaSolicitudOpen(true)
    setNuevaSolicitud({
      cita_id: '',
      orden_global_id: '',
      motivo: '',
      item_inventario_id: '',
      cantidad_solicitada: 1,
      observacion: '',
    })
  }

  const crearNuevaSolicitud = async () => {
    if (!nuevaSolicitud.cita_id || !nuevaSolicitud.item_inventario_id || Number(nuevaSolicitud.cantidad_solicitada || 0) <= 0) {
      setError('Completa cita_id, item y cantidad para crear la solicitud.')
      return
    }
    try {
      await inventarioService.crearSolicitud(tenantSlug, {
        cita_id: nuevaSolicitud.cita_id,
        orden_global_id: nuevaSolicitud.orden_global_id || null,
        motivo: nuevaSolicitud.motivo || 'Solicitud de repuesto',
        detalles: [
          {
            item_inventario_id: nuevaSolicitud.item_inventario_id,
            cantidad_solicitada: Number(nuevaSolicitud.cantidad_solicitada),
            observacion: nuevaSolicitud.observacion || '',
          },
        ],
      })
      setNuevaSolicitudOpen(false)
      setSuccess('Solicitud creada correctamente')
      setError(null)
      await cargar()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la solicitud')
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-5 dark:border-white/[0.06] dark:bg-carbon-950/30">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-carbon-900 dark:text-white">Solicitudes de Repuesto</h1>
          <p className="mt-1 text-lg text-carbon-600 dark:text-neutral-300">Las solicitudes se crean desde Taller Interno (orden de trabajo).</p>
        </div>
        <button onClick={abrirNuevaSolicitud} className="rounded-xl bg-primary-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-primary-700">+ Nueva solicitud</button>
      </div>

      {success && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">{success}</div>}
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-red-700 dark:bg-red-500/15 dark:text-red-200">{error}</div>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total solicitudes" value={stats.total} subtitle="Este mes" iconWrap="bg-red-100 text-red-500 dark:bg-red-500/20 dark:text-red-300" />
        <StatCard icon={Clock3} label="En proceso" value={stats.enProceso} subtitle={`${stats.total ? ((stats.enProceso / stats.total) * 100).toFixed(1) : '0'}% del total`} iconWrap="bg-blue-100 text-blue-500 dark:bg-blue-500/20 dark:text-blue-300" />
        <StatCard icon={CheckCircle2} label="Entregadas" value={stats.entregadas} subtitle={`${stats.total ? ((stats.entregadas / stats.total) * 100).toFixed(1) : '0'}% del total`} iconWrap="bg-emerald-100 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-300" />
        <StatCard icon={AlertCircle} label="Pendientes" value={stats.pendientes} subtitle={`${stats.total ? ((stats.pendientes / stats.total) * 100).toFixed(1) : '0'}% del total`} iconWrap="bg-amber-100 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300" />
      </div>

      <section className="rounded-2xl border border-neutral-200/80 bg-white p-4 dark:border-white/[0.08] dark:bg-carbon-900">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
          <div className="relative xl:col-span-5">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-carbon-400 dark:text-neutral-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por motivo o estado..."
              className="w-full rounded-xl border border-neutral-300 bg-white py-2 pl-10 pr-3 text-sm text-carbon-900 dark:border-white/[0.12] dark:bg-carbon-800 dark:text-neutral-100"
            />
          </div>
          <div className="relative xl:col-span-3">
            <CalendarDays size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-carbon-400 dark:text-neutral-500" />
            <select
              value={rango}
              onChange={(e) => setRango(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white py-2 pl-10 pr-3 text-sm text-carbon-900 dark:border-white/[0.12] dark:bg-carbon-800 dark:text-neutral-100"
            >
              <option value="TODOS">Rango de fechas</option>
              <option value="HOY">Hoy</option>
              <option value="SEMANA">Últimos 7 días</option>
              <option value="MES">Este mes</option>
            </select>
          </div>
          <div className="relative xl:col-span-3">
            <Filter size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-carbon-400 dark:text-neutral-500" />
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white py-2 pl-10 pr-3 text-sm text-carbon-900 dark:border-white/[0.12] dark:bg-carbon-800 dark:text-neutral-100"
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{e === 'TODOS' ? 'Todos los estados' : e}</option>
              ))}
            </select>
          </div>
          <div className="xl:col-span-1">
            <button onClick={exportarCsv} className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-carbon-800 hover:bg-neutral-50 dark:border-white/[0.12] dark:bg-carbon-800 dark:text-neutral-100 dark:hover:bg-carbon-700">
              <Download size={17} />
              Exportar
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white dark:border-white/[0.08] dark:bg-carbon-900">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-carbon-800">
            <tr>
              <th className="px-5 py-3 text-left text-base font-semibold text-carbon-900 dark:text-white">Fecha</th>
              <th className="px-5 py-3 text-left text-base font-semibold text-carbon-900 dark:text-white">Estado</th>
              <th className="px-5 py-3 text-left text-base font-semibold text-carbon-900 dark:text-white">Motivo</th>
              <th className="px-5 py-3 text-left text-base font-semibold text-carbon-900 dark:text-white">Detalles</th>
              <th className="px-5 py-3 text-left text-base font-semibold text-carbon-900 dark:text-white">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudesFiltradas.map((s) => (
              <tr key={s.id} className="border-t border-neutral-200/70 dark:border-white/[0.06]">
                <td className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <CalendarDays size={16} className="mt-1 text-red-500" />
                    <div>
                      <p className="text-lg font-semibold text-carbon-900 dark:text-white">{new Date(s.created_at).toLocaleDateString()}</p>
                      <p className="text-sm text-carbon-500 dark:text-neutral-400">{new Date(s.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${estadoClass(s.estado)}`}>
                    <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                    {s.estado}
                  </span>
                </td>
                <td className="px-5 py-4 text-base text-carbon-900 dark:text-white">{s.motivo || '-'}</td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-2.5 py-1.5 text-sm font-semibold text-red-600 dark:bg-red-500/15 dark:text-red-300">
                    <FileText size={16} />
                    {(s.detalles || []).length}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => aprobar(s)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25">Aprobar</button>
                    <button onClick={() => enProceso(s)} className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25">En proceso</button>
                    <button onClick={() => asignarProveedorEta(s)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/25">Asignar prov/ETA</button>
                    <button onClick={() => abrirEntrega(s)} className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25">Entregar</button>
                    <button className="rounded-lg p-2 text-carbon-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-carbon-800">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {solicitudesFiltradas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-base text-carbon-500 dark:text-neutral-400">
                  No hay solicitudes con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 text-base text-carbon-600 dark:border-white/[0.08] dark:text-neutral-300">
          <span>Mostrando 1 a {solicitudesFiltradas.length} de {solicitudesFiltradas.length} solicitudes</span>
          <span className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white">1</span>
        </div>
      </section>

      {entregaOpenId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 dark:border-white/[0.08] dark:bg-carbon-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-carbon-900 dark:text-white">Marcar entrega</h2>
              <button onClick={() => setEntregaOpenId(null)} className="rounded px-2 py-1 text-carbon-700 dark:text-neutral-300">X</button>
            </div>
            <div className="space-y-3">
              {detallesEntrega.map((d) => (
                <div key={d.id} className="grid grid-cols-1 items-center gap-2 md:grid-cols-3">
                  <div className="text-sm text-carbon-800 dark:text-neutral-200 md:col-span-2">
                    {d.item_nombre} (solicitado: {d.cantidad_solicitada})
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={cantidadesEntrega[d.id] ?? d.cantidad_solicitada}
                    onChange={(e) => setCantidadesEntrega((p) => ({ ...p, [d.id]: e.target.value }))}
                    className="rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEntregaOpenId(null)} className="rounded border border-neutral-300 px-4 py-2 dark:border-white/[0.10]">Cancelar</button>
              <button onClick={entregar} className="rounded bg-indigo-700 px-4 py-2 text-white">Confirmar entrega</button>
            </div>
          </div>
        </div>
      )}

      {nuevaSolicitudOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-6 dark:border-white/[0.08] dark:bg-carbon-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-carbon-900 dark:text-white">Nueva solicitud de repuesto</h2>
              <button onClick={() => setNuevaSolicitudOpen(false)} className="rounded px-2 py-1 text-carbon-700 dark:text-neutral-300">X</button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={nuevaSolicitud.cita_id}
                onChange={(e) => setNuevaSolicitud((p) => ({ ...p, cita_id: e.target.value }))}
                placeholder="cita_id (requerido)"
                className="rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100"
              />
              <input
                value={nuevaSolicitud.orden_global_id}
                onChange={(e) => setNuevaSolicitud((p) => ({ ...p, orden_global_id: e.target.value }))}
                placeholder="orden_global_id (opcional)"
                className="rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100"
              />
              <input
                value={nuevaSolicitud.motivo}
                onChange={(e) => setNuevaSolicitud((p) => ({ ...p, motivo: e.target.value }))}
                placeholder="Motivo de solicitud"
                className="rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100 md:col-span-2"
              />
              <select
                value={nuevaSolicitud.item_inventario_id}
                onChange={(e) => setNuevaSolicitud((p) => ({ ...p, item_inventario_id: e.target.value }))}
                className="rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100"
              >
                <option value="">Selecciona item inventario</option>
                {itemsInventario.filter((i) => i.activo).map((i) => (
                  <option key={i.id} value={i.id}>{`${i.codigo} - ${i.nombre} (stock ${i.stock_actual})`}</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={nuevaSolicitud.cantidad_solicitada}
                onChange={(e) => setNuevaSolicitud((p) => ({ ...p, cantidad_solicitada: e.target.value }))}
                placeholder="Cantidad solicitada"
                className="rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100"
              />
              <input
                value={nuevaSolicitud.observacion}
                onChange={(e) => setNuevaSolicitud((p) => ({ ...p, observacion: e.target.value }))}
                placeholder="Observación (opcional)"
                className="rounded border border-neutral-300 bg-white px-3 py-2 text-carbon-900 dark:border-white/[0.10] dark:bg-carbon-800 dark:text-neutral-100 md:col-span-2"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setNuevaSolicitudOpen(false)} className="rounded border border-neutral-300 px-4 py-2 dark:border-white/[0.10]">Cancelar</button>
              <button onClick={crearNuevaSolicitud} className="rounded bg-primary-600 px-4 py-2 text-white">Crear solicitud</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, subtitle, iconWrap }) => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-white/[0.08] dark:bg-carbon-900">
    <div className="flex items-center gap-4">
      <div className={`rounded-full p-3 ${iconWrap}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-carbon-700 dark:text-neutral-200">{label}</p>
        <p className="text-4xl font-black text-carbon-900 dark:text-white">{value}</p>
        <p className="text-sm text-carbon-500 dark:text-neutral-400">{subtitle}</p>
      </div>
    </div>
  </div>
)

export default GestionSolicitudesRepuestoView
