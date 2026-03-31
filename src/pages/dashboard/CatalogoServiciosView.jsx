import { useState, useEffect } from 'react'
import serviciosCatalogoService from '../../services/serviciosCatalogoService'
import { canCreateServiciosCatalogo, canEditServiciosCatalogo, canChangeServicioCatalogoStatus } from '../../utils/roleHelper'
import ServicioCatalogoModal from '../../components/servicios/ServicioCatalogoModal'

const CatalogoServiciosView = ({ user, tenantSlug }) => {
  // Estados para lista
  const [servicios, setServicios] = useState([])
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
  const [servicioEnEdicion, setServicioEnEdicion] = useState(null)
  const [isSubmittingModal, setIsSubmittingModal] = useState(false)
  // Modal de cambiar estado
  const [isEstadoModalOpen, setIsEstadoModalOpen] = useState(false)
  const [servicioParaEstado, setServicioParaEstado] = useState(null)
  const [motivoEstado, setMotivoEstado] = useState('')
  const [isSubmittingEstado, setIsSubmittingEstado] = useState(false)
  // Mensajes
  const [successMessage, setSuccessMessage] = useState(null)
  // Función para cargar servicios
  const cargarServicios = async (page = 1, filtrosActuales = filtros) => {
    setLoading(true)
    setError(null)
    try {
      const response = await serviciosCatalogoService.listarServicios(tenantSlug, {
        ...filtrosActuales,
        page,
      })
      setServicios(response.data || response.results || [])
      setTotalEntries(response.count || response.data?.length || 0)
      setFiltros((prev) => ({ ...prev, page }))
    } catch (err) {
      setError(err.message || 'Error al cargar servicios')
      setServicios([])
    } finally {
      setLoading(false)
    }
  }
  // Cargar servicios al montar o cuando cambia tenantSlug
  useEffect(() => {
    cargarServicios(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug])
  // Manejar cambio de filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
      page: 1,
    }))
  }
  // Aplicar filtros
  const handleApplyFilters = () => {
    cargarServicios(1)
  }
  // Limpiar filtros
  const handleClearFilters = () => {
    setFiltros({
      search: '',
      ordering: '-created_at',
      page: 1,
    })
    cargarServicios(1)
  }
  // Abrir modal de crear
  const handleOpenCreateModal = () => {
    setServicioEnEdicion(null)
    setIsModalOpen(true)
  }
  // Abrir modal de editar
  const handleOpenEditModal = (servicio) => {
    setServicioEnEdicion(servicio)
    setIsModalOpen(true)
  }
  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setServicioEnEdicion(null)
  }
  // Guardar servicio (crear o editar)
  const handleGuardarServicio = async (formData) => {
    setIsSubmittingModal(true)
    try {
      if (servicioEnEdicion) {
        // Editar
        await serviciosCatalogoService.editarServicio(tenantSlug, servicioEnEdicion.id, formData)
        setSuccessMessage('✅ Servicio actualizado correctamente')
      } else {
        // Crear
        await serviciosCatalogoService.crearServicio(tenantSlug, formData)
        setSuccessMessage('✅ Servicio registrado correctamente')
      }
      handleCloseModal()
      cargarServicios(filtros.page)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error al guardar servicio')
    } finally {
      setIsSubmittingModal(false)
    }
  }
  // Abrir modal para cambiar estado
  const handleOpenEstadoModal = (servicio) => {
    setServicioParaEstado(servicio)
    setMotivoEstado('')
    setIsEstadoModalOpen(true)
  }
  // Cerrar modal de estado
  const handleCloseEstadoModal = () => {
    setIsEstadoModalOpen(false)
    setServicioParaEstado(null)
    setMotivoEstado('')
  }
  // Cambiar estado
  const handleCambiarEstado = async () => {
    if (!servicioParaEstado) return
    setIsSubmittingEstado(true)
    try {
      const nuevoEstado = !servicioParaEstado.activo
      await serviciosCatalogoService.cambiarEstadoServicio(tenantSlug, servicioParaEstado.id, {
        activo: nuevoEstado,
        motivo: motivoEstado,
      })
      setSuccessMessage(`✅ Servicio marcado como ${nuevoEstado ? 'ACTIVO' : 'INACTIVO'}`)
      handleCloseEstadoModal()
      cargarServicios(filtros.page)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(err.message || 'Error al cambiar estado')
    } finally {
      setIsSubmittingEstado(false)
    }
  }
  const canCreate = canCreateServiciosCatalogo(user)
  const canEdit = canEditServiciosCatalogo(user)
  const canChangeStatus = canChangeServicioCatalogoStatus(user)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🛠️ Catálogo de Servicios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {totalEntries} servicio{totalEntries !== 1 ? 's' : ''}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 self-start md:self-auto"
          >
            <span>+</span>
            Agregar Servicio
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
              onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
              placeholder="Nombre, descripción..."
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
              <option value="-created_at">Más recientes primero</option>
              <option value="created_at">Más antiguos primero</option>
              <option value="nombre">Nombre (A-Z)</option>
              <option value="-nombre">Nombre (Z-A)</option>
              <option value="codigo">Código (A-Z)</option>
              <option value="-codigo">Código (Z-A)</option>
              <option value="precio_base">Menor precio primero</option>
              <option value="-precio_base">Mayor precio primero</option>
            </select>
          </div>
          {/* Botones de acción */}
          <div className="flex gap-2">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              Limpiar
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>
      {/* Tabla de servicios */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-gray-300 dark:border-slate-600 border-t-primary-500 rounded-full animate-spin mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando servicios...</p>
          </div>
        </div>
      ) : servicios.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-3">🛠️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay servicios registrados
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filtros.search ? 'Intenta cambiar la búsqueda' : 'Comienza agregando el primer servicio'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Código</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Nombre</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Descripción</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Tiempo (min)</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Precio (Bs.)</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Estado</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((servicio, idx) => (
                <tr
                  key={servicio.id}
                  className={`border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                    idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-800/50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-900 dark:text-white">{servicio.codigo}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900 dark:text-white">{servicio.nombre}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm">
                    {servicio.descripcion || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                    {servicio.tiempo_estandar_min} min
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      Bs. {servicio.precio_base ? parseFloat(servicio.precio_base).toFixed(2) : '0.00'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        servicio.activo
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {servicio.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(servicio)}
                            className="py-1 px-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded text-xs font-medium transition-colors"
                          >
                            ✏️ Editar
                          </button>
                          {canChangeStatus && (
                            <button
                              onClick={() => handleOpenEstadoModal(servicio)}
                              className={`py-1 px-3 rounded text-xs font-medium transition-colors ${
                                servicio.activo
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                              }`}
                            >
                              {servicio.activo ? '⏸️ Desactivar' : '▶️ Activar'}
                            </button>
                          )}
                        </>
                      )}
                      {!canEdit && <span className="text-gray-500 text-xs">Solo lectura</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal de crear/editar */}
      <ServicioCatalogoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleGuardarServicio}
        servicio={servicioEnEdicion}
        isLoading={isSubmittingModal}
        currentUser={user}
      />
      {/* Modal de cambiar estado */}
      {isEstadoModalOpen && servicioParaEstado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-sm w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {servicioParaEstado.activo ? '⏸️' : '▶️'} Cambiar Estado
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                ¿Deseas cambiar el estado del servicio{' '}
                <strong className="text-gray-900 dark:text-white">{servicioParaEstado.nombre}</strong> a{' '}
                <strong className="text-gray-900 dark:text-white">
                  {servicioParaEstado.activo ? 'INACTIVO' : 'ACTIVO'}
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
export default CatalogoServiciosView
