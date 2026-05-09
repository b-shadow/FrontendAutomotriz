import { useCallback, useEffect, useMemo, useState } from 'react'
import { Car, Clock3, CalendarDays, CheckCircle2, Wrench } from 'lucide-react'
import { useTenant } from '../../hooks/useTenant'
import avancesVehiculoService from '../../services/avancesVehiculoService'
import citasService from '../../services/citasService'
import ordenesTrabajoService from '../../services/ordenesTrabajoService'

const getCitaLabel = (cita) => {
  const vehiculo = cita?.vehiculo_placa || cita?.vehiculo?.placa || 'Vehículo'
  const cliente = cita?.cliente_nombres || cita?.cliente_nombre || cita?.cliente || 'Cliente'
  return `${vehiculo} · ${cliente}`
}

const getVehiculoNombre = (cita) => {
  const marca = cita?.vehiculo_marca || cita?.vehiculo?.marca || 'Vehículo'
  const modelo = cita?.vehiculo_modelo || cita?.vehiculo?.modelo || ''
  return `${marca} ${modelo}`.trim()
}

const pct = (value) => {
  if (value === null || value === undefined || value === '') return 0
  const num = Number(value)
  if (Number.isNaN(num)) return 0
  return Math.max(0, Math.min(100, num))
}

const isFinalizado = (estado = '', porcentaje = 0) => {
  const upper = String(estado).toUpperCase()
  return upper.includes('FINAL') || porcentaje >= 100
}

const estadoCliente = (estado = '', porcentaje = 0) => {
  const upper = String(estado).toUpperCase()
  if (isFinalizado(estado, porcentaje)) return 'Finalizado'
  if (upper.includes('PAUS')) return 'Pausado'
  if (upper.includes('ESPERA')) return 'En espera'
  return 'En proceso'
}

const EstadoBadge = ({ label }) => {
  const dark = {
    Finalizado: 'bg-emerald-900/35 text-emerald-300 border-emerald-700/50',
    'En proceso': 'bg-blue-900/35 text-blue-300 border-blue-700/50',
    'En espera': 'bg-amber-900/35 text-amber-300 border-amber-700/50',
    Pausado: 'bg-orange-900/35 text-orange-300 border-orange-700/50',
  }
  const light = {
    Finalizado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'En proceso': 'bg-blue-100 text-blue-700 border-blue-200',
    'En espera': 'bg-amber-100 text-amber-700 border-amber-200',
    Pausado: 'bg-orange-100 text-orange-700 border-orange-200',
  }
  const key = label in dark ? label : 'En proceso'
  return (
    <span className={`inline-flex items-center rounded-lg border px-3 py-1 text-xs font-semibold ${light[key]} dark:${dark[key]}`}>
      {label}
    </span>
  )
}

const GestionAvanceVehiculoView = () => {
  const { tenantSlug } = useTenant()
  const [avances, setAvances] = useState([])
  const [citas, setCitas] = useState([])
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('en_taller')

  const cargar = useCallback(async () => {
    if (!tenantSlug) return
    try {
      setLoading(true)
      setError(null)
      const [adv, cts, ots] = await Promise.all([
        avancesVehiculoService.listar(tenantSlug),
        citasService.listarCitas(tenantSlug, { page_size: 300 }),
        ordenesTrabajoService.listar(tenantSlug, { page_size: 300 }),
      ])
      const avancesOrdenados = [...(adv || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setAvances(avancesOrdenados)
      setCitas(cts.results || cts.data || [])
      setOrdenes(ots.results || ots || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Error cargando avances')
    } finally {
      setLoading(false)
    }
  }, [tenantSlug])

  useEffect(() => {
    cargar()
  }, [cargar])

  const citasById = useMemo(() => {
    const map = {}
    ;(citas || []).forEach((c) => {
      map[c.id] = c
    })
    return map
  }, [citas])

  const latestByCita = useMemo(() => {
    const map = {}
    for (const a of avances) {
      if (!map[a.cita]) map[a.cita] = a
    }
    return Object.values(map)
  }, [avances])

  const ordenByCita = useMemo(() => {
    const map = {}
    for (const o of ordenes || []) {
      if (!map[o.cita]) map[o.cita] = o
    }
    return map
  }, [ordenes])

  const enTaller = useMemo(
    () => latestByCita.filter((a) => !isFinalizado(a.estado_nuevo, pct(a.porcentaje_avance))),
    [latestByCita]
  )

  const historial = useMemo(
    () => avances.filter((a) => isFinalizado(a.estado_nuevo, pct(a.porcentaje_avance))),
    [avances]
  )

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-r from-neutral-100 via-white to-neutral-100 p-6 dark:border-white/[0.06] dark:from-[#0f1117] dark:via-[#111722] dark:to-[#0d1016]">
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-72 rounded-full bg-red-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-10 h-32 w-64 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold tracking-tight text-carbon-900 dark:text-white">Avance de Vehículos (Cliente)</h1>
          <p className="mt-2 text-base text-carbon-600 dark:text-neutral-300">Consulta el estado y porcentaje de avance de los vehículos que se encuentran en taller.</p>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setTab('en_taller')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === 'en_taller'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                  : 'bg-neutral-200 text-carbon-700 hover:bg-neutral-300 dark:bg-white/[0.06] dark:text-neutral-300 dark:hover:bg-white/[0.1]'
              }`}
            >
              <Wrench size={16} /> En taller
            </button>
            <button
              onClick={() => setTab('historial')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === 'historial'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/30'
                  : 'bg-neutral-200 text-carbon-700 hover:bg-neutral-300 dark:bg-white/[0.06] dark:text-neutral-300 dark:hover:bg-white/[0.1]'
              }`}
            >
              <Clock3 size={16} /> Historial
            </button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-carbon-600 dark:border-white/[0.06] dark:bg-[#10141d] dark:text-neutral-300">Cargando...</div>
      ) : tab === 'en_taller' ? (
        <div className="space-y-3">
          {enTaller.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-carbon-500 dark:border-white/[0.06] dark:bg-[#10141d] dark:text-neutral-400">No hay vehículos en proceso.</div>
          ) : (
            enTaller.map((a) => {
              const c = citasById[a.cita]
              const orden = ordenByCita[a.cita]
              const progreso = pct(a.porcentaje_avance)
              const estado = estadoCliente(a.estado_nuevo, progreso)
              return (
                <article key={a.id} className="rounded-xl border border-neutral-200 bg-gradient-to-r from-white via-neutral-50 to-white p-5 dark:border-white/[0.06] dark:from-[#0f131c] dark:via-[#111722] dark:to-[#0f131c]">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
                    <div className="lg:col-span-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-carbon-700 dark:bg-white/[0.06] dark:text-neutral-200">
                        <Car size={22} />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-carbon-900 dark:text-white">{getVehiculoNombre(c)}</p>
                        <p className="text-xs text-carbon-500 dark:text-neutral-400">{getCitaLabel(c)}</p>
                        <p className="mt-1 text-sm text-carbon-700 dark:text-neutral-300">{a.mensaje || 'Sin mensaje'}</p>
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <p className="text-sm text-carbon-500 dark:text-neutral-400">Avance actual</p>
                      <p className="text-4xl font-extrabold leading-none text-red-500">{progreso}%</p>
                      <p className="mt-1"><EstadoBadge label={estado} /></p>
                    </div>

                    <div className="lg:col-span-4">
                      <div className="h-4 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-white/[0.08]">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500" style={{ width: `${progreso}%` }} />
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-carbon-500 dark:text-neutral-400">
                        <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                      </div>
                    </div>

                    <div className="lg:col-span-2 rounded-xl bg-neutral-100 p-3 dark:bg-white/[0.04]">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-carbon-600 dark:text-neutral-300"><CalendarDays size={14} /> Fecha de ingreso</p>
                      <p className="mt-1 text-sm text-carbon-900 dark:text-white">{c?.fecha_hora_inicio_programada ? new Date(c.fecha_hora_inicio_programada).toLocaleString() : '-'}</p>
                    </div>
                  </div>
                  {!!orden?.detalles?.length && (
                    <div className="mt-4 border-t border-neutral-200 dark:border-white/[0.08] pt-3">
                      <p className="text-sm font-semibold text-carbon-800 dark:text-neutral-200 mb-2">Detalle de trabajos</p>
                      <div className="space-y-2">
                        {orden.detalles.map((d) => {
                          const st = String(d.estado || '').toUpperCase()
                          const noSeHara = st === 'INNECESARIO'
                          const motivo = noSeHara
                            ? (d.observaciones_mecanico || '').split('[INNECESARIO]').pop()?.trim() || 'Sin motivo'
                            : null
                          return (
                            <div key={d.id} className="text-sm rounded border border-neutral-200/70 dark:border-white/[0.08] px-3 py-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-carbon-900 dark:text-white">{d.servicio_nombre || 'Servicio'}</span>
                                <span className="text-xs px-2 py-1 rounded bg-neutral-100 text-neutral-700 dark:bg-white/[0.08] dark:text-neutral-300">{d.estado}</span>
                              </div>
                              {noSeHara && <p className="text-xs mt-1 text-amber-700 dark:text-amber-300">Motivo: {motivo}</p>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-carbon-900 dark:text-white">
            <CheckCircle2 size={18} className="text-red-500" />
            <h2 className="text-2xl font-bold">Historial de avances</h2>
          </div>
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-white/[0.06] dark:bg-[#0f131c]">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 text-carbon-700 dark:bg-white/[0.05] dark:text-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Vehículo</th>
                  <th className="px-4 py-3 text-left">Estado final</th>
                  <th className="px-4 py-3 text-left">Mensaje</th>
                  <th className="px-4 py-3 text-left">% Final</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((a) => {
                  const c = citasById[a.cita]
                  const progreso = pct(a.porcentaje_avance)
                  return (
                    <tr key={a.id} className="border-t border-neutral-200 text-carbon-700 dark:border-white/[0.06] dark:text-neutral-200">
                      <td className="px-4 py-3">{new Date(a.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">{getVehiculoNombre(c)} <span className="text-carbon-500 dark:text-neutral-400">· {c?.vehiculo_placa || '-'}</span></td>
                      <td className="px-4 py-3"><EstadoBadge label="Finalizado" /></td>
                      <td className="px-4 py-3">{a.mensaje || '-'}</td>
                      <td className="px-4 py-3 text-lg font-bold text-red-500">{progreso}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

export default GestionAvanceVehiculoView
