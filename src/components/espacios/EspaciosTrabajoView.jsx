/**
 * EspaciosTrabajoView.jsx - Vista principal de espacios de trabajo
 *
 * Props:
 * - user: object
 * - tenantSlug: string
 * - onNavigate: function
 */
import { useState, useEffect } from 'react'
import { EspacioTrabajoModal } from './EspacioTrabajoModal'
import { CambiarEstadoEspacioModal } from './CambiarEstadoEspacioModal'
import { EspacioTrabajoDetalleModal } from './EspacioTrabajoDetalleModal'
import { HorariosEspacioPanel } from './HorariosEspacioPanel'
import espaciosTrabajoService from '../../services/espaciosTrabajoService'
import {
  canManageEspaciosTrabajo,
  canChangeEspacioTrabajoEstado,
  canChangeEspacioTrabajoActivo,
  canViewEspacioTrabajoHorarios,
} from '../../utils/roleHelper'

const TIPOS = [
  { value: 'TALLER', label: 'Taller' },
  { value: 'CHEQUEO', label: 'Chequeo' },
  { value: 'GARAJE', label: 'Garaje' },
  { value: 'LAVADO', label: 'Lavado' },
]

const ESTADOS = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'OCUPADO', label: 'Ocupado' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'TIEMPO_EXTENDIDO', label: 'Tiempo Extendido' },
]

export const EspaciosTrabajoView = ({ user, tenantSlug }) => {
  const [espacios, setEspacios] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Filtros
  const [filtros, setFiltros] = useState({
    search: '',
    tipo: '',
    estado: '',
    activo: '', // '', 'true', 'false'
    ordering: '-created_at',
  })

  // Modales
  const [isEspacioModalOpen, setIsEspacioModalOpen] = useState(false)
  const [isEstadoModalOpen, setIsEstadoModalOpen] = useState(false)
  const [isHorariosModalOpen, setIsHorariosModalOpen] = useState(false)
  const [isDetalleModalOpen, setIsDetalleModalOpen] = useState(false)

  // Selección
  const [selectedEspacio, setSelectedEspacio] = useState(null)
  const [selectedEspacioDetalle, setSelectedEspacioDetalle] = useState(null)
  const [horariosDetalle, setHorariosDetalle] = useState([])
  const [loadingDetalleHorarios, setLoadingDetalleHorarios] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const canManage = canManageEspaciosTrabajo(user)
  const canChangeEstado = canChangeEspacioTrabajoEstado(user)
  const canChangeActivo = canChangeEspacioTrabajoActivo(user)
  const canViewHorarios = canViewEspacioTrabajoHorarios(user)

  // Cargar espacios cuando cambian los filtros
  useEffect(() => {
    loadEspacios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros])

  const loadEspacios = async () => {
    try {
      setLoading(true)
      setError(null)
      const filterObj = {}
      if (filtros.search) filterObj.search = filtros.search
      if (filtros.tipo) filterObj.tipo = filtros.tipo
      if (filtros.estado) filterObj.estado = filtros.estado
      if (filtros.activo === 'true') filterObj.activo = 'true'
      if (filtros.activo === 'false') filterObj.activo = 'false'
      filterObj.ordering = filtros.ordering

      const data = await espaciosTrabajoService.listarEspacios(tenantSlug, filterObj)
      setEspacios(data.espacios || [])
    } catch (err) {
      console.error('Error al cargar espacios:', err)
      setError('No se pudieron cargar los espacios')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Modal de Espacio (crear/editar)
  const handleOpenEspacioModal = (espacio = null) => {
    setSelectedEspacio(espacio)
    setIsEspacioModalOpen(true)
  }

  const handleCloseEspacioModal = () => {
    setIsEspacioModalOpen(false)
    setSelectedEspacio(null)
  }

  const handleSaveEspacio = async (payload) => {
    try {
      setIsSaving(true)
      const isEditing = selectedEspacio !== null

      if (isEditing) {
        await espaciosTrabajoService.editarEspacio(
          tenantSlug,
          selectedEspacio.id,
          payload
        )
        setSuccess('Espacio actualizado correctamente')
      } else {
        await espaciosTrabajoService.crearEspacio(tenantSlug, payload)
        setSuccess('Espacio creado correctamente')
      }

      await loadEspacios()
      handleCloseEspacioModal()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error al guardar espacio:', err)
      setError('No se pudo guardar el espacio')
    } finally {
      setIsSaving(false)
    }
  }

  // Modal de Estado
  const handleOpenEstadoModal = (espacio) => {
    setSelectedEspacio(espacio)
    setIsEstadoModalOpen(true)
  }

  const handleCloseEstadoModal = () => {
    setIsEstadoModalOpen(false)
    setSelectedEspacio(null)
  }

  const handleSaveEstado = async (payload) => {
    try {
      setIsSaving(true)
      await espaciosTrabajoService.cambiarEstadoEspacio(tenantSlug, selectedEspacio.id, payload)
      setSuccess('Estado actualizado correctamente')
      await loadEspacios()
      handleCloseEstadoModal()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error al cambiar estado:', err)
      setError('No se pudo cambiar el estado')
    } finally {
      setIsSaving(false)
    }
  }

  // Modal de Detalle
  const handleOpenDetalleModal = async (espacio) => {
    try {
      setLoadingDetalleHorarios(true)
      setSelectedEspacioDetalle(espacio)
      // Cargar horarios del espacio
      const horariosData = await espaciosTrabajoService.listarHorariosEspacio(tenantSlug, espacio.id)
      setHorariosDetalle(horariosData.horarios || [])
      setIsDetalleModalOpen(true)
    } catch (err) {
      console.error('Error al cargar detalle:', err)
      setError('No se pudieron cargar los horarios del espacio')
    } finally {
      setLoadingDetalleHorarios(false)
    }
  }

  const handleCloseDetalleModal = () => {
    setIsDetalleModalOpen(false)
    setSelectedEspacioDetalle(null)
    setHorariosDetalle([])
  }

  // Cambiar Activo/Inactivo Espacio
  const handleChangeActivo = async (espacio) => {
    const nuevoActivo = !espacio.activo
    const actionText = nuevoActivo ? 'activar' : 'inactivar'
    
    if (!window.confirm(`¿Deseas ${actionText} este espacio?`)) {
      return
    }

    try {
      setIsSaving(true)
      await espaciosTrabajoService.cambiarActivoEspacio(tenantSlug, espacio.id, {
        activo: nuevoActivo,
        motivo: '', // Sin motivo por ahora, se puede agregar modal si es necesario
      })
      setSuccess(`Espacio ${actionText}do correctamente`)
      await loadEspacios()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error(`Error al ${actionText} espacio:`, err)
      setError(`No se pudo ${actionText} el espacio`)
    } finally {
      setIsSaving(false)
    }
  }

  // Modal de Horarios
  const handleOpenHorariosModal = (espacio) => {
    setSelectedEspacio(espacio)
    setIsHorariosModalOpen(true)
  }

  const handleCloseHorariosModal = () => {
    setIsHorariosModalOpen(false)
    setSelectedEspacio(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          🛠️ Espacios de Trabajo
        </h1>
        {canManage && (
          <button
            onClick={() => handleOpenEspacioModal(null)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg
              disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            + Registrar Espacio
          </button>
        )}
      </div>

      {/* Success */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={filtros.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
              bg-white dark:bg-slate-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />

          {/* Tipo */}
          <select
            value={filtros.tipo}
            onChange={(e) => handleFilterChange('tipo', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
              bg-white dark:bg-slate-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            {TIPOS.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>

          {/* Estado */}
          <select
            value={filtros.estado}
            onChange={(e) => handleFilterChange('estado', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
              bg-white dark:bg-slate-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((est) => (
              <option key={est.value} value={est.value}>
                {est.label}
              </option>
            ))}
          </select>

          {/* Activo */}
          <select
            value={filtros.activo}
            onChange={(e) => handleFilterChange('activo', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
              bg-white dark:bg-slate-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>

          {/* Ordenamiento */}
          <select
            value={filtros.ordering}
            onChange={(e) => handleFilterChange('ordering', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
              bg-white dark:bg-slate-700 text-gray-900 dark:text-white
              focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="-created_at">Más recientes</option>
            <option value="created_at">Más antiguos</option>
            <option value="nombre">Nombre (A-Z)</option>
            <option value="-nombre">Nombre (Z-A)</option>
            <option value="codigo">Código (A-Z)</option>
            <option value="-codigo">Código (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="text-gray-600 dark:text-gray-400">Cargando espacios...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && espacios.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No hay espacios registrados</p>
          {canManage && (
            <button
              onClick={() => handleOpenEspacioModal(null)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
            >
              Crear primer espacio
            </button>
          )}
        </div>
      )}

      {/* Tabla de Espacios */}
      {!loading && espacios.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-900 dark:text-white">
                    Activo
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                {espacios.map((espacio) => (
                  <tr
                    key={espacio.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {espacio.codigo}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {espacio.nombre}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {espacio.tipo_display}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          espacio.estado === 'DISPONIBLE'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : espacio.estado === 'OCUPADO'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}
                      >
                        {espacio.estado_display}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          espacio.activo
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {espacio.activo ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {/* Ver Detalle */}
                        <button
                          onClick={() => handleOpenDetalleModal(espacio)}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-xs"
                        >
                          Ver
                        </button>

                        {/* Editar */}
                        {canManage && (
                          <button
                            onClick={() => handleOpenEspacioModal(espacio)}
                            disabled={isSaving}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-xs disabled:opacity-50"
                          >
                            Editar
                          </button>
                        )}

                        {/* Cambiar Estado */}
                        {canChangeEstado && (
                          <button
                            onClick={() => handleOpenEstadoModal(espacio)}
                            disabled={isSaving}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs disabled:opacity-50"
                          >
                            Estado
                          </button>
                        )}

                        {/* Activar/Inactivar */}
                        {canChangeActivo && (
                          <button
                            onClick={() => handleChangeActivo(espacio)}
                            disabled={isSaving}
                            className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 text-xs disabled:opacity-50"
                          >
                            {espacio.activo ? 'Inactivar' : 'Activar'}
                          </button>
                        )}

                        {/* Ver Horarios - Disponible para todos con permiso de view */}
                        {canViewHorarios && (
                          <button
                            onClick={() => handleOpenHorariosModal(espacio)}
                            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-xs"
                          >
                            Horarios
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Espacio */}
      {isEspacioModalOpen && (
        <EspacioTrabajoModal
          key={`espacio-${selectedEspacio?.id || 'new'}`}
          isOpen={isEspacioModalOpen}
          onClose={handleCloseEspacioModal}
          onSave={handleSaveEspacio}
          espacio={selectedEspacio}
          isLoading={isSaving}
        />
      )}

      {/* Modal de Estado */}
      {isEstadoModalOpen && (
        <CambiarEstadoEspacioModal
          key={`estado-${selectedEspacio?.id}`}
          isOpen={isEstadoModalOpen}
          onClose={handleCloseEstadoModal}
          onSave={handleSaveEstado}
          espacio={selectedEspacio}
          isLoading={isSaving}
        />
      )}

      {/* Modal de Horarios */}
      {isHorariosModalOpen && selectedEspacio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-6xl h-[90vh] p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Horarios del Espacio
              </h2>
              <button
                onClick={handleCloseHorariosModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <HorariosEspacioPanel
              espacio={selectedEspacio}
              user={user}
              tenantSlug={tenantSlug}
            />
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      <EspacioTrabajoDetalleModal
        isOpen={isDetalleModalOpen}
        onClose={handleCloseDetalleModal}
        espacio={selectedEspacioDetalle}
        horarios={horariosDetalle}
        loading={loadingDetalleHorarios}
      />
    </div>
  )
}
