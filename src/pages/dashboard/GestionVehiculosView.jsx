import { useState, useEffect } from 'react'
import vehiculosService from '../../services/vehiculosService'
import usuariosService from '../../services/usuariosService'
import { canCreateVehiculos, canChangeVehiculoStatus, canSelectPropietarioVehiculo } from '../../utils/roleHelper'
import VehiculoModal from '../../components/vehiculos/VehiculoModal'

const GestionVehiculosView = ({ user, tenantSlug }) => {
  // Estados para lista
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalEntries, setTotalEntries] = useState(0)

  // Filtros y paginación
  const [filtros, setFiltros] = useState({
    search: '',
    ordering: '-created_at',
    page: 1,
  })

  // Modal de crear/editar
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [vehiculoEnEdicion, setVehiculoEnEdicion] = useState(null)
  const [isSubmittingModal, setIsSubmittingModal] = useState(false)

  // Modal de cambiar estado
  const [isEstadoModalOpen, setIsEstadoModalOpen] = useState(false)
  const [vehiculoParaEstado, setVehiculoParaEstado] = useState(null)
  const [motivoEstado, setMotivoEstado] = useState('')
  const [isSubmittingEstado, setIsSubmittingEstado] = useState(false)

  // Mensajes
  const [successMessage, setSuccessMessage] = useState(null)

  // Usuarios para selector de propietario
  const [usuarios, setUsuarios] = useState([])

  // Función para cargar vehículos - se pasa los filtros como parámetro
  const cargarVehiculos = async (page = 1, filtrosActuales = filtros) => {
    setLoading(true)
    setError(null)
    try {
      const response = await vehiculosService.listarVehiculos(tenantSlug, {
        ...filtrosActuales,
        page,
      })
      setVehiculos(response.data || response.results || [])
      setTotalEntries(response.count || response.data?.length || 0)
      setFiltros((prev) => ({ ...prev, page }))
    } catch (err) {
      setError(err.message || 'Error al cargar vehículos')
      setVehiculos([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar vehículos al montar o cuando cambia tenantSlug
  useEffect(() => {
    cargarVehiculos(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug])

  // Manejar cambio de filtros - búsqueda en tiempo real
  const handleFilterChange = async (e) => {
    const { name, value } = e.target
    const nuevosFiltros = {
      ...filtros,
      [name]: value,
      page: 1, // Volver a página 1 al cambiar filtros
    }
    setFiltros(nuevosFiltros)
    // Buscar automáticamente
    await cargarVehiculos(1, nuevosFiltros)
  }

  // Cargar usuarios para selector de propietario
  const cargarUsuarios = async () => {
    try {
      const response = await usuariosService.listarUsuarios(tenantSlug, { page_size: 100 })
      setUsuarios(response.data || response.results || [])
    } catch (err) {
      console.error('Error cargando usuarios:', err)
      setUsuarios([])
    }
  }

  // Abrir modal de crear
  const handleOpenCreateModal = () => {
    setVehiculoEnEdicion(null)
    setIsModalOpen(true)
    // Cargar usuarios solo si puede seleccionar propietario (ADMIN/ASESOR)
    if (canSelectPropietarioVehiculo(user)) {
      cargarUsuarios()
    }
  }

  // Abrir modal de editar
  const handleOpenEditModal = (vehiculo) => {
    setVehiculoEnEdicion(vehiculo)
    setIsModalOpen(true)
  }

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setVehiculoEnEdicion(null)
  }

  // Guardar vehículo (crear o editar)
  const handleGuardarVehiculo = async (formData) => {
    setIsSubmittingModal(true)
    try {
      if (vehiculoEnEdicion) {
        // Editar
        await vehiculosService.editarVehiculo(tenantSlug, vehiculoEnEdicion.id, formData)
        setSuccessMessage('✅ Vehículo actualizado correctamente')
      } else {
        // Crear
        await vehiculosService.crearVehiculo(tenantSlug, formData)
        setSuccessMessage('✅ Vehículo registrado correctamente')
      }
      handleCloseModal()
      cargarVehiculos(filtros.page)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error al guardar vehículo')
    } finally {
      setIsSubmittingModal(false)
    }
  }

  // Abrir modal para cambiar estado
  const handleOpenEstadoModal = (vehiculo) => {
    setVehiculoParaEstado(vehiculo)
    setMotivoEstado('')
    setIsEstadoModalOpen(true)
  }

  // Cerrar modal de estado
  const handleCloseEstadoModal = () => {
    setIsEstadoModalOpen(false)
    setVehiculoParaEstado(null)
    setMotivoEstado('')
  }

  // Cambiar estado
  const handleCambiarEstado = async () => {
    if (!vehiculoParaEstado) return

    setIsSubmittingEstado(true)
    try {
      const nuevoEstado = vehiculoParaEstado.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
      await vehiculosService.cambiarEstadoVehiculo(tenantSlug, vehiculoParaEstado.id, {
        estado: nuevoEstado,
        motivo: motivoEstado,
      })
      setSuccessMessage(`✅ Vehículo marcado como ${nuevoEstado}`)
      handleCloseEstadoModal()
      cargarVehiculos(filtros.page)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error al cambiar estado')
    } finally {
      setIsSubmittingEstado(false)
    }
  }

  const canRegisterVehiculos = canCreateVehiculos(user)
  const canSelectPropietario = canSelectPropietarioVehiculo(user)
  const canChangeStatus = canChangeVehiculoStatus(user)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🚗 Gestionar Vehículos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {totalEntries} vehículo{totalEntries !== 1 ? 's' : ''}
          </p>
        </div>
        {canRegisterVehiculos && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 self-start md:self-auto"
          >
            <span>+</span>
            Registrar Vehículo
          </button>
        )}
      </div>

      {/* Mensajes */}
      {successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* Filtros Simplificados */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-4">
        <div className="flex gap-4 items-end">
          {/* Búsqueda */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Búsqueda
            </label>
            <input
              type="text"
              name="search"
              value={filtros.search}
              onChange={handleFilterChange}
              placeholder="Placa, marca, modelo, propietario..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Ordenamiento */}
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ordenar por
            </label>
            <select
              name="ordering"
              value={filtros.ordering}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="-fecha_registro">Más recientes primero</option>
              <option value="fecha_registro">Más antiguos primero</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de vehículos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 dark:border-slate-600 border-t-primary-500 rounded-full animate-spin mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando vehículos...</p>
          </div>
        </div>
      ) : vehiculos.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-3">🚗</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay vehículos registrados
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filtros.search ? 'Intenta cambiar la búsqueda' : 'Comienza registrando el primer vehículo'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Placa</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Marca</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Modelo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Propietario</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Color</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehiculos.map((vehiculo, idx) => (
                <tr
                  key={vehiculo.id}
                  className={`border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                    idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-800/50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900 dark:text-white">{vehiculo.placa}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{vehiculo.marca}</td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{vehiculo.modelo}</td>
                  <td className="px-6 py-4">
                    {vehiculo.propietario ? (
                      <span className="text-gray-700 dark:text-gray-300">
                        {typeof vehiculo.propietario === 'object'
                          ? `${vehiculo.propietario.nombres || ''} ${vehiculo.propietario.apellidos || ''}`
                          : vehiculo.propietario}
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 italic">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{vehiculo.color || '-'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        vehiculo.estado === 'ACTIVO'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {vehiculo.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {canSelectPropietario && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(vehiculo)}
                            className="py-1 px-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded text-xs font-medium transition-colors"
                          >
                            ✏️ Editar
                          </button>
                          {canChangeStatus && (
                            <button
                              onClick={() => handleOpenEstadoModal(vehiculo)}
                              className={`py-1 px-3 rounded text-xs font-medium transition-colors ${
                                vehiculo.estado === 'ACTIVO'
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                              }`}
                            >
                              {vehiculo.estado === 'ACTIVO' ? '⏸️ Desactivar' : '▶️ Activar'}
                            </button>
                          )}
                        </>
                      )}
                      {!canSelectPropietario && <span className="text-gray-500 text-xs">Solo lectura</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de crear/editar */}
      <VehiculoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleGuardarVehiculo}
        vehiculo={vehiculoEnEdicion}
        isLoading={isSubmittingModal}
        usuarios={usuarios}
        canSelectPropietario={canSelectPropietario && !vehiculoEnEdicion}
        currentUser={user}
      />

      {/* Modal de cambiar estado */}
      {isEstadoModalOpen && vehiculoParaEstado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-sm w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {vehiculoParaEstado.estado === 'ACTIVO' ? '⏸️' : '▶️'} Cambiar Estado
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                ¿Deseas cambiar el estado del vehículo{' '}
                <strong className="text-gray-900 dark:text-white">{vehiculoParaEstado.placa}</strong> a{' '}
                <strong className="text-gray-900 dark:text-white">
                  {vehiculoParaEstado.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'}
                </strong>
                ?
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Motivo (opcional)
                </label>
                <textarea
                  value={motivoEstado}
                  onChange={(e) => setMotivoEstado(e.target.value)}
                  placeholder="Describe el motivo del cambio..."
                  maxLength="500"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={handleCloseEstadoModal}
                disabled={isSubmittingEstado}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCambiarEstado}
                disabled={isSubmittingEstado}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingEstado && (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                Confirmar Cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionVehiculosView
