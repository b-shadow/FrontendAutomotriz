import React, { useEffect, useState, useCallback } from 'react'
import { useTenant } from '../../hooks/useTenant'
import citasService from '../../services/citasService'
import espaciosTrabajoService from '../../services/espaciosTrabajoService'
import CitaModalCrear from '../../components/citas/CitaModalCrear'
import CitaModalEditar from '../../components/citas/CitaModalEditar'
import CitaModalReprogramar from '../../components/citas/CitaModalReprogramar'
import CitaDetalleModal from '../../components/citas/CitaDetalleModal'

const estadoColorMap = {
  PROGRAMADA: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  PENDIENTE_APROBACION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  EN_ESPERA_INGRESO: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  EN_PROCESO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  CANCELADA: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  FINALIZADA: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  NO_SHOW: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

const fmtDate = (iso) => new Date(iso).toLocaleString()
const todayISO = () => new Date().toISOString().slice(0, 10)

const GestionCitasView = () => {
  const { tenantSlug } = useTenant()

  const [agenda, setAgenda] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [espacios, setEspacios] = useState([])

  const [modals, setModals] = useState({ crear: false, editar: false, reprogramar: false, detalle: false })
  const [citaSeleccionada, setCitaSeleccionada] = useState(null)

  const [filters, setFilters] = useState({
    vista: 'dia',
    fecha: todayISO(),
    estado: '',
    search: '',
    espacio_id: '',
  })

  const cargarAgenda = useCallback(async () => {
    if (!tenantSlug) return
    try {
      setLoading(true)
      setError(null)
      const data = await citasService.obtenerAgenda(tenantSlug, filters)
      setAgenda(data)
    } catch (err) {
      console.error('Error cargando agenda:', err)
      setError(err.response?.data?.detail || 'Error cargando agenda de citas')
    } finally {
      setLoading(false)
    }
  }, [tenantSlug, filters])

  const cargarEspacios = useCallback(async () => {
    if (!tenantSlug) return
    try {
      const data = await espaciosTrabajoService.listarEspacios(tenantSlug, { page_size: 1000, ordering: 'nombre' })
      setEspacios(data.espacios || [])
    } catch (err) {
      console.error('Error cargando espacios:', err)
    }
  }, [tenantSlug])

  useEffect(() => {
    cargarEspacios()
  }, [cargarEspacios])

  useEffect(() => {
    cargarAgenda()
  }, [cargarAgenda])

  const cerrarModal = (modalName) => {
    setModals((prev) => ({ ...prev, [modalName]: false }))
    setCitaSeleccionada(null)
  }

  const abrirDetalle = async (citaId) => {
    try {
      const detalle = await citasService.obtenerCita(tenantSlug, citaId)
      setCitaSeleccionada(detalle)
      setModals((prev) => ({ ...prev, detalle: true }))
    } catch {
      setError('Error al cargar detalle de cita')
    }
  }

  const abrirEditar = (cita) => {
    setCitaSeleccionada(cita)
    setModals((prev) => ({ ...prev, editar: true }))
  }

  const abrirReprogramar = (cita) => {
    setCitaSeleccionada(cita)
    setModals((prev) => ({ ...prev, reprogramar: true }))
  }

  const handleCancelarCita = async (citaId) => {
    if (!window.confirm('¿Cancelar esta cita?')) return
    try {
      await citasService.cancelarCita(tenantSlug, citaId)
      setSuccess('Cita cancelada correctamente')
      cargarAgenda()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cancelar cita')
    }
  }

  const handleMarcarNoShow = async (cita) => {
    const ok = window.confirm('¿Marcar esta cita como inasistencia (no-show)?')
    if (!ok) return
    const observacion = window.prompt('Observación (opcional):', '') || ''
    try {
      await citasService.marcarNoShow(tenantSlug, cita.id, { observacion })
      setSuccess('Cita marcada como no-show')
      cargarAgenda()
      setTimeout(() => setSuccess(null), 2500)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Error al marcar no-show')
    }
  }

  const onMutacionExitosa = (msg, modal) => {
    setSuccess(msg)
    cerrarModal(modal)
    cargarAgenda()
    setTimeout(() => setSuccess(null), 2500)
  }

  const citas = agenda?.citas || []
  const capacidad = agenda?.capacidad_espacios || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Agenda de Citas</h1>
        <button
          onClick={() => setModals((p) => ({ ...p, crear: true }))}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
        >
          + Nueva Cita
        </button>
      </div>

      {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">{success}</div>}
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white dark:bg-carbon-900 p-4 rounded-lg shadow-sm border border-neutral-200/60 dark:border-white/[0.06] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={filters.vista}
            onChange={(e) => setFilters((p) => ({ ...p, vista: e.target.value }))}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
          >
            <option value="dia">Vista Día</option>
            <option value="semana">Vista Semana</option>
            <option value="lista">Vista Lista</option>
          </select>

          <input
            type="date"
            value={filters.fecha}
            onChange={(e) => setFilters((p) => ({ ...p, fecha: e.target.value }))}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
          />

          <select
            value={filters.estado}
            onChange={(e) => setFilters((p) => ({ ...p, estado: e.target.value }))}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
          >
            <option value="">Todos los estados</option>
            <option value="PROGRAMADA">Programada</option>
            <option value="EN_ESPERA_INGRESO">En espera ingreso</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="FINALIZADA">Finalizada</option>
            <option value="CANCELADA">Cancelada</option>
            <option value="NO_SHOW">No-show</option>
          </select>

          <select
            value={filters.espacio_id}
            onChange={(e) => setFilters((p) => ({ ...p, espacio_id: e.target.value }))}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
          >
            <option value="">Todos los espacios</option>
            {espacios.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Buscar cliente o placa"
            value={filters.search}
            onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-carbon-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {capacidad.map((c) => (
          <div key={c.espacio_id} className="bg-white dark:bg-carbon-900 p-4 rounded-lg border border-neutral-200/60 dark:border-white/[0.06]">
            <div className="flex justify-between">
              <h3 className="font-semibold">{c.espacio_nombre}</h3>
              {!c.planificable && <span className="text-xs text-red-600">No planificable</span>}
            </div>
            <p className="text-sm text-carbon-600 dark:text-neutral-400">{c.tipo}</p>
            <p className="text-sm mt-2">Capacidad: {c.capacidad_min} min</p>
            <p className="text-sm">Ocupación: {c.ocupacion_min} min ({c.ocupacion_pct}%)</p>
            <p className="text-sm">Disponible: {c.disponible_min} min</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-carbon-900 rounded-lg shadow border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Cargando agenda...</div>
        ) : citas.length === 0 ? (
          <div className="p-8 text-center text-carbon-500 dark:text-neutral-400">No hay citas en el rango seleccionado</div>
        ) : (
          <div className="divide-y divide-neutral-200/60 dark:divide-white/[0.06]">
            {citas.map((cita) => (
              <div key={cita.id} className="p-4 hover:bg-neutral-50 dark:hover:bg-carbon-800/50">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-semibold">{fmtDate(cita.inicio)} - {fmtDate(cita.fin)}</p>
                    <p className="text-sm">Cliente: {cita.cliente_nombre || 'N/A'} | Vehículo: {cita.vehiculo_placa || 'N/A'}</p>
                    <p className="text-sm">Asesor: {cita.asesor_nombre || 'N/A'}</p>
                    <p className="text-sm">Servicios: {cita.servicios.map((s) => s.nombre).join(', ') || 'Sin servicios'}</p>
                    <p className="text-sm">Espacios: {cita.segmentos.map((s) => s.espacio_nombre).join(' | ') || 'Sin espacios'}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColorMap[cita.estado] || 'bg-neutral-100 text-carbon-700'}`}>
                      {cita.estado_display}
                    </span>
                    <div className="space-x-2">
                      <button onClick={() => abrirDetalle(cita.id)} className="text-primary-600 text-sm">Ver</button>
                      {cita.estado === 'PROGRAMADA' && (
                        <>
                          <button onClick={() => abrirEditar(cita)} className="text-carbon-700 text-sm">Editar</button>
                          <button onClick={() => abrirReprogramar(cita)} className="text-orange-600 text-sm">Reprogramar</button>
                        </>
                      )}
                      {cita.estado !== 'CANCELADA' && cita.estado !== 'FINALIZADA' && (
                        <button onClick={() => handleCancelarCita(cita.id)} className="text-red-600 text-sm">Cancelar</button>
                      )}
                      {(cita.estado === 'PROGRAMADA' || cita.estado === 'EN_ESPERA_INGRESO') && (
                        <button onClick={() => handleMarcarNoShow(cita)} className="text-orange-700 text-sm">No-show</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modals.crear && (
        <CitaModalCrear onClose={() => cerrarModal('crear')} onSuccess={() => onMutacionExitosa('Cita creada correctamente', 'crear')} />
      )}
      {modals.editar && citaSeleccionada && (
        <CitaModalEditar cita={citaSeleccionada} onClose={() => cerrarModal('editar')} onSuccess={() => onMutacionExitosa('Cita actualizada correctamente', 'editar')} />
      )}
      {modals.reprogramar && citaSeleccionada && (
        <CitaModalReprogramar cita={citaSeleccionada} onClose={() => cerrarModal('reprogramar')} onSuccess={() => onMutacionExitosa('Cita reprogramada correctamente', 'reprogramar')} />
      )}
      {modals.detalle && citaSeleccionada && (
        <CitaDetalleModal cita={citaSeleccionada} onClose={() => cerrarModal('detalle')} />
      )}
    </div>
  )
}

export default GestionCitasView
