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


const estadoColorMap = {
  PROGRAMADA: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  PENDIENTE_APROBACION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  CANCELADA: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  FINALIZADA: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  NO_SHOW: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

const estadoLabelMap = {
  PROGRAMADA: 'Programada',
  PENDIENTE_APROBACION: 'Pendiente Aprobación',
  CANCELADA: 'Cancelada',
  FINALIZADA: 'Finalizada',
  NO_SHOW: 'No Show',
}

const GestionCitasView = () => {
  const { tenantSlug } = useTenant()

  // Data state
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })

  // Modal state
  const [modals, setModals] = useState({
    crear: false,
    editar: false,
    reprogramar: false,
    detalle: false,
  })
  const [citaSeleccionada, setCitaSeleccionada] = useState(null)

  // Filters
  const [filters, setFilters] = useState({
    estado: '',
    fecha_desde: '',
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
          page: pageNum,
          page_size: pagination.pageSize,
        }
        if (filters.estado) params.estado = filters.estado
        if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde
        if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta

        const response = await citasService.obtenerCitas(tenantSlug, params)
        setCitas(response.data || response.results || [])
        setPagination((prev) => ({
          ...prev,
          page: pageNum,
          total: response.count || 0,
        }))
      } catch (err) {
        console.error('Error loading citas:', err)
        setError(err.response?.data?.detail || 'Error loading citas')
      } finally {
        setLoading(false)
      }
    },
    [tenantSlug, filters, pagination.pageSize]
  )

  useEffect(() => {
    cargarCitas(1)
  }, [cargarCitas, tenantSlug, filters])

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

  const handleCancelarCita = async (citaId) => {
    if (!window.confirm('¿Cancelar esta cita?')) return
    try {
      await citasService.cancelarCita(tenantSlug, citaId)
      setSuccess('Cita cancelada correctamente')
      cargarCitas(pagination.page)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cancelar cita')
    }
  }

  const numPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Citas</h1>
        <button
          onClick={abrirModalCrear}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
        >
          + Nueva Cita
        </button>
      </div>

      {/* Success/Error */}
      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg border border-green-200">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.estado}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, estado: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Todos</option>
              <option value="PROGRAMADA">Programada</option>
              <option value="PENDIENTE_APROBACION">Pendiente Aprobación</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="FINALIZADA">Finalizada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, fecha_desde: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, fecha_hasta: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : citas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hay citas para mostrar
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
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
              <tbody className="divide-y">
                {citas.map((cita) => {
                  const estadoInfo =
                    estadoLabelMap[cita.estado] || cita.estado
                  const colorClass =
                    estadoColorMap[cita.estado] ||
                    'bg-gray-100 text-gray-800'
                  const inicioDate = new Date(
                    cita.fecha_hora_inicio_programada
                  ).toLocaleString()

                  return (
                    <tr key={cita.id} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => abrirDetalle(cita)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          Ver
                        </button>
                        {cita.estado === 'PROGRAMADA' && (
                          <>
                            <button
                              onClick={() => abrirEditar(cita)}
                              className="text-gray-600 hover:text-gray-900 text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => abrirReprogramar(cita)}
                              className="text-orange-600 hover:text-orange-900 text-sm"
                            >
                              Reprogramar
                            </button>
                          </>
                        )}
                        {cita.estado !== 'CANCELADA' &&
                          cita.estado !== 'FINALIZADA' && (
                            <button
                              onClick={() => handleCancelarCita(cita.id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Cancelar
                            </button>
                          )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {numPages > 1 && (
              <div className="flex justify-center gap-2 p-4">
                <button
                  onClick={() => cargarCitas(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 rounded disabled:opacity-50"
                >
                  ← Anterior
                </button>
                <span className="px-3 py-1">
                  Página {pagination.page} de {numPages}
                </span>
                <button
                  onClick={() => cargarCitas(pagination.page + 1)}
                  disabled={pagination.page >= numPages}
                  className="px-3 py-1 rounded disabled:opacity-50"
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
    </div>
  )
}

export default GestionCitasView
