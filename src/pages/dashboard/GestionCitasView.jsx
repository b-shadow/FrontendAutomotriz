/**
 * GestionCitasView - NEW: List + CRUD for Citas
 */
import React, { useEffect, useState, useCallback } from 'react'
import { useTenant } from '../../hooks/useTenant'
import citasService from '../../services/citasService'
import CitaModalCrear from '../../components/citas/CitaModalCrear'
import CitaModalEditar from '../../components/citas/CitaModalEditar'
import CitaModalReprogramar from '../../components/citas/CitaModalReprogramar'
import CitaDetalleModal from '../../components/citas/CitaDetalleModal'
import { useGhostAutomation } from '../../hooks/useGhostAutomation'
import GhostIndicator from '../../components/GhostIndicator'
import { Sparkles } from 'lucide-react'


const estadoColorMap = {
  PROGRAMADA: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', PENDIENTE_APROBACION : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  CANCELADA: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', FINALIZADA : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  NO_SHOW: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

const estadoLabelMap = {
  PROGRAMADA: 'Programada', PENDIENTE_APROBACION : 'Pendiente Aprobación',
  CANCELADA: 'Cancelada', FINALIZADA : 'Finalizada',
  NO_SHOW: 'No Show',
}

const GestionCitasView = ({ user, tenantSlug: propTenantSlug, onNavigate, aiPrefill, onSuccess }) => {
  const { tenantSlug: contextTenantSlug } = useTenant()
  const tenantSlug = propTenantSlug || contextTenantSlug

  // Data state
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })
  const { isSimulating, setIsSimulating, simulateTyping, simulateClick, simulateDelay } = useGhostAutomation()

  // Modal state
  const [modals, setModals] = useState({
    crear: false, editar : false,
    reprogramar: false, detalle : false,
    confirmarNoShow: false,
  })
  const [citaSeleccionada, setCitaSeleccionada] = useState(null)

  // Filters
  const [filters, setFilters] = useState({
    estado: '', fecha_desde : '',
    fecha_hasta: '',
  })

  // Load citas
  const cargarCitas = useCallback(
    async (pageNum = 1) => {
      if (!tenantSlug) return
      try {
        setLoading(true)
        setError(null)

        const params = {
          page: pageNum, page_size : pagination.pageSize,
        }
        if (filters.estado) params.estado = filters.estado
        if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde
        if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta

        const response = await citasService.obtenerCitas(tenantSlug, params)
        const data = response
        const listaCitas = Array.isArray(data) ? data : (data.data || data.results || [])
        const total = data.count || (Array.isArray(data) ? data.length : (data.data?.length || 0))

        setCitas(listaCitas)
        setPagination((prev) => ({
          ...prev,
          page: pageNum,
          total: total,
        }))
      } catch (err) {
        console.error('Error loading citas:', err)
        setError(err.response.data.detail || 'Error loading citas')
      } finally {
        setLoading(false)
      }
    },
    [tenantSlug, filters, pagination.pageSize]
  )

  useEffect(() => {
    cargarCitas(1)
  }, [cargarCitas, tenantSlug, filters])

  // EFECTO: Simulación de IA (Ghost User)
  useEffect(() => {
    if (!aiPrefill) return;

    const processPrefill = async () => {
      if (aiPrefill.type === 'FILTRAR_CITAS') {
        setIsSimulating(true);
        await simulateDelay(600);

        if (aiPrefill.estado) {
          setFilters(prev => ({ ...prev, estado: aiPrefill.estado }));
          await simulateDelay(600);
        }

        if (aiPrefill.fecha_desde) {
          await simulateTyping(setFilters, 'fecha_desde', aiPrefill.fecha_desde, 50);
        }
        if (aiPrefill.fecha_hasta) {
          await simulateTyping(setFilters, 'fecha_hasta', aiPrefill.fecha_hasta, 50);
        }

        setIsSimulating(false);
      } else if (aiPrefill.type === 'CREAR_CITA') {
        setIsSimulating(true);
        await simulateDelay(800);
        abrirModalCrear();
        setIsSimulating(false);
      }
    };

    processPrefill();
  }, [aiPrefill?._ts]);

  // Modal handlers
  const abrirModalCrear = () => {
    setCitaSeleccionada(null)
    setModals((prev) => ({ ...prev, crear: true }))
  }

  const cerrarModal = (modalName) => {
    setModals((prev) => ({ ...prev, [modalName]: false }))
    setCitaSeleccionada(null)
  }

  const abrirDetalle = async (cita) => {
    try {
      // Obtener detalle completo de la cita (con vehiculo, cliente, segmentos, etc)
      const detalleCompleto = await citasService.obtenerCita(tenantSlug, cita.id)
      setCitaSeleccionada(detalleCompleto)
      setModals((prev) => ({ ...prev, detalle: true }))
    } catch (err) {
      console.error('Error cargando detalle de cita:', err)
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

  // Success handlers
  const handleCrearExito = () => {
    setSuccess('Cita creada correctamente')
    cerrarModal('crear')
    cargarCitas(1)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleEditarExito = () => {
    setSuccess('Cita actualizada correctamente')
    cerrarModal('editar')
    cargarCitas(pagination.page)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleReprogramarExito = () => {
    setSuccess('Cita reprogramada correctamente')
    cerrarModal('reprogramar')
    cargarCitas(pagination.page)
    setTimeout(() => setSuccess(null), 3000)
  }

  const abrirConfirmacionNoShow = (cita) => {
    setCitaSeleccionada(cita)
    setModals((prev) => ({ ...prev, confirmarNoShow: true }))
  }

  const cerrarConfirmacionNoShow = () => {
    setModals((prev) => ({ ...prev, confirmarNoShow: false }))
    setCitaSeleccionada(null)
  }

  const handleMarcarNoShow = async () => {
    if (!citaSeleccionada?.id) return
    try {
      await citasService.marcarNoShow(tenantSlug, citaSeleccionada.id)
      setSuccess('Cita marcada como No Show')
      cerrarConfirmacionNoShow()
      cargarCitas(pagination.page)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Error al marcar No Show')
    }
  }

  const numPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <div className="space-y-6">
      {/* INDICADOR DE SIMULACIÓN IA */}
      <GhostIndicator isSimulating={isSimulating} message="IA filtrando citas..." />
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-carbon-900 dark:text-white">Gestión de Citas</h1>
        <button
          onClick={abrirModalCrear}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition shadow-md shadow-primary-900/20"
        >
          + Nueva Cita
        </button>
      </div>

      {/* Success/Error */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg border border-green-200 dark:border-green-800/30">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800/30">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-carbon-900 p-4 rounded-lg shadow-sm border border-neutral-200/60 dark:border-white/[0.06] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-1">
              Estado
            </label>
            <select
              value={filters.estado}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, estado: e.target.value }))
              }
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.06] bg-white dark:bg-carbon-800 text-carbon-900 dark:text-white rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos</option>
              <option value="PROGRAMADA">Programada</option>
              <option value="PENDIENTE_APROBACION">Pendiente Aprobación</option>
              <option value="EN_ESPERA_INGRESO">En espera de ingreso</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="NO_SHOW">No Show</option>
              <option value="FINALIZADA">Finalizada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, fecha_desde: e.target.value }))
              }
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.06] bg-white dark:bg-carbon-800 text-carbon-900 dark:text-white rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, fecha_hasta: e.target.value }))
              }
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.06] bg-white dark:bg-carbon-800 text-carbon-900 dark:text-white rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-carbon-900 rounded-lg shadow border border-neutral-200/60 dark:border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-carbon-500 dark:text-neutral-400">Cargando...</div>
          ) : citas.length === 0 ? (
          <div className="p-8 text-center text-carbon-500 dark:text-neutral-400">
            No hay citas para mostrar
          </div>
              ) : (
          <>
            <table className="w-full text-carbon-900 dark:text-white">
              <thead className="bg-neutral-50 dark:bg-carbon-800 border-b dark:border-white/[0.06]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Inicio
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60 dark:divide-white/[0.06]">
                {citas.map((cita) => {
                  const estadoInfo =
                    estadoLabelMap[cita.estado] || cita.estado
                  const colorClass =
                    estadoColorMap[cita.estado] ||
                    'bg-neutral-100 text-carbon-800 dark:bg-carbon-800 dark:text-neutral-300'
                  const inicioDate = new Date(
                    cita.fecha_hora_inicio_programada
                  ).toLocaleString()

                  return (
                    <tr key={cita.id} className="hover:bg-neutral-50 dark:hover:bg-carbon-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm">{inicioDate}</td>
                      <td className="px-6 py-4 text-sm">
                        {cita.cliente_nombres || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {cita.vehiculo_placa || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                          {estadoInfo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button
                          onClick={() => abrirDetalle(cita)}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                        >
                          Ver
                        </button>
                        {cita.estado === 'PROGRAMADA' && (
                          <>
                            <button
                              onClick={() => abrirEditar(cita)}
                              className="text-carbon-600 hover:text-carbon-900 dark:text-neutral-400 dark:hover:text-white text-sm font-medium"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => abrirReprogramar(cita)}
                              className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 text-sm font-medium"
                            >
                              Reprogramar
                            </button>
                          </>
                        )}
                        {(cita.estado === 'PROGRAMADA' || cita.estado === 'EN_ESPERA_INGRESO') && (
                            <button
                              onClick={() => abrirConfirmacionNoShow(cita)}
                              className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 text-sm font-medium"
                            >
                              No Show
                            </button>
                          )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {numPages > 1 && (
              <div className="flex justify-center gap-2 p-4 bg-white dark:bg-carbon-900 border-t border-neutral-200/60 dark:border-white/[0.06]">
                <button
                  onClick={() => cargarCitas(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 rounded bg-neutral-100 text-carbon-700 hover:bg-neutral-200 dark:bg-carbon-800 dark:text-neutral-300 dark:hover:bg-carbon-700 disabled:opacity-50 transition"
                >
                  ← Anterior
                </button>
                <span className="px-3 py-1 text-carbon-600 dark:text-neutral-400 font-medium">
                  Página {pagination.page} de {numPages}
                </span>
                <button
                  onClick={() => cargarCitas(pagination.page + 1)}
                  disabled={pagination.page >= numPages}
                  className="px-3 py-1 rounded bg-neutral-100 text-carbon-700 hover:bg-neutral-200 dark:bg-carbon-800 dark:text-neutral-300 dark:hover:bg-carbon-700 disabled:opacity-50 transition"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {modals.crear && (
        <CitaModalCrear
          onClose={() => cerrarModal('crear')}
          onSuccess={handleCrearExito}
          aiPrefill={aiPrefill}
        />
      )}
      {modals.editar && citaSeleccionada && (
        <CitaModalEditar
          cita={citaSeleccionada}
          onClose={() => cerrarModal('editar')}
          onSuccess={handleEditarExito}
        />
      )}
      {modals.reprogramar && citaSeleccionada && (
        <CitaModalReprogramar
          cita={citaSeleccionada}
          onClose={() => cerrarModal('reprogramar')}
          onSuccess={handleReprogramarExito}
        />
      )}
      {modals.detalle && citaSeleccionada && (
        <CitaDetalleModal
          cita={citaSeleccionada}
          onClose={() => cerrarModal('detalle')}
        />
      )}

      {modals.confirmarNoShow && citaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-carbon-900">
            <h2 className="text-xl font-bold text-carbon-900 dark:text-white mb-2 tracking-tight">
              Confirmar No Show
            </h2>
            <p className="text-carbon-600 dark:text-neutral-400 mb-6 text-sm">
              ¿Marcar la cita de <strong>{citaSeleccionada.cliente_nombres || 'cliente'}</strong> ({citaSeleccionada.vehiculo_placa || 'sin placa'}) como No Show?
            </p>

            <div className="flex gap-3">
              <button
                onClick={cerrarConfirmacionNoShow}
                className="flex-1 rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-3 font-semibold text-carbon-900 transition hover:bg-neutral-200 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-neutral-100 dark:hover:bg-white/[0.08]"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarcarNoShow}
                className="flex-1 rounded-xl bg-gradient-to-r from-orange-600 to-red-700 px-4 py-3 font-semibold text-white shadow-lg shadow-orange-900/20 transition hover:brightness-110"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionCitasView
