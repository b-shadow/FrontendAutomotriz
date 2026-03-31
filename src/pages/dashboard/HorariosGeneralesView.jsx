/**
 * HorariosGeneralesView.jsx - Vista centralizada de Horarios
 * Permite gestor de horarios de todos los espacios de un taller desde una sola pantalla
 *
 * Props:
 * - user: object con datos del usuario loguead
 * - tenantSlug: string con el tenant actual
 */
import { useState, useEffect } from 'react'
import { HorarioEspacioModal } from '../../components/espacios/HorarioEspacioModal'
import espaciosTrabajoService from '../../services/espaciosTrabajoService'
import { canManageHorariosEspacio } from '../../utils/roleHelper'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const HorariosGeneralesView = ({ user, tenantSlug }) => {
  // Estados principales
  const [espacios, setEspacios] = useState([])
  const [horarios, setHorarios] = useState([])
  const [loadingEspacios, setLoadingEspacios] = useState(false)
  const [loadingHorarios, setLoadingHorarios] = useState(false)
  const [error, setError] = useState(null)

  // Estados para el modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedHorario, setSelectedHorario] = useState(null)
  const [selectedEspacioId, setSelectedEspacioId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const canManage = canManageHorariosEspacio(user)

  // Cargar espacios al montarse
  useEffect(() => {
    loadEspacios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cargar horarios cuando cambia el espacio seleccionado
  useEffect(() => {
    if (selectedEspacioId) {
      loadHorarios()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEspacioId])

  const loadEspacios = async () => {
    try {
      setLoadingEspacios(true)
      setError(null)
      const data = await espaciosTrabajoService.listarEspacios(tenantSlug, {
        search: '',
        ordering: 'nombre',
      })
      
      const espaciosList = data.espacios || []
      setEspacios(espaciosList)

      // Seleccionar el primer espacio por defecto
      if (espaciosList.length > 0 && !selectedEspacioId) {
        setSelectedEspacioId(espaciosList[0].id)
      }
    } catch (err) {
      console.error('Error al cargar espacios:', err)
      setError('No se pudieron cargar los espacios de trabajo')
    } finally {
      setLoadingEspacios(false)
    }
  }

  const loadHorarios = async () => {
    if (!selectedEspacioId) return

    try {
      setLoadingHorarios(true)
      setError(null)
      const data = await espaciosTrabajoService.listarHorariosEspacio(
        tenantSlug,
        selectedEspacioId
      )
      setHorarios(data.horarios || [])
    } catch (err) {
      console.error('Error al cargar horarios:', err)
      setError('No se pudieron cargar los horarios')
    } finally {
      setLoadingHorarios(false)
    }
  }

  const handleOpenModal = (horario = null) => {
    setSelectedHorario(horario)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedHorario(null)
  }

  const handleSaveHorario = async (payload) => {
    try {
      setIsSaving(true)
      const isEditing = selectedHorario !== null

      if (isEditing) {
        await espaciosTrabajoService.editarHorarioEspacio(
          tenantSlug,
          selectedEspacioId,
          selectedHorario.id,
          payload
        )
      } else {
        await espaciosTrabajoService.crearHorarioEspacio(
          tenantSlug,
          selectedEspacioId,
          payload
        )
      }

      await loadHorarios()
      handleCloseModal()
    } catch (err) {
      console.error('Error al guardar horario:', err)
      setError('No se pudo guardar el horario')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActivo = async (horario) => {
    try {
      setIsSaving(true)
      await espaciosTrabajoService.cambiarActivoHorarioEspacio(
        tenantSlug,
        selectedEspacioId,
        horario.id,
        { activo: !horario.activo }
      )
      await loadHorarios()
    } catch (err) {
      console.error('Error al cambiar estado del horario:', err)
      setError('No se pudo cambiar el estado del horario')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteHorario = async (horario) => {
    if (!window.confirm(`¿Eliminar horario ${DIAS_SEMANA[horario.dia_semana]} ${horario.hora_inicio} - ${horario.hora_fin}?`)) {
      return
    }

    try {
      setIsSaving(true)
      await espaciosTrabajoService.eliminarHorarioEspacio(
        tenantSlug,
        selectedEspacioId,
        horario.id
      )
      await loadHorarios()
    } catch (err) {
      console.error('Error al eliminar horario:', err)
      setError('No se pudo eliminar el horario')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedEspacio = espacios.find((e) => e.id === selectedEspacioId)

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Horarios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona los horarios de los espacios de trabajo
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Selector de Espacio */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Seleccionar Espacio de Trabajo
        </label>
        
        {loadingEspacios ? (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400">Cargando espacios...</p>
          </div>
        ) : espacios.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400">
              No hay espacios de trabajo disponibles
            </p>
          </div>
        ) : (
          <select
            value={selectedEspacioId || ''}
            onChange={(e) => setSelectedEspacioId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg
              bg-white dark:bg-slate-700 text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {espacios.map((espacio) => (
              <option key={espacio.id} value={espacio.id}>
                {espacio.nombre} {espacio.codigo ? `(${espacio.codigo})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tabla de Horarios */}
      {selectedEspacioId && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
          {/* Header de la tabla */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Horarios de {selectedEspacio?.nombre}
            </h2>
            {canManage && (
              <button
                onClick={() => handleOpenModal(null)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={isSaving || loadingHorarios}
              >
                + Agregar Horario
              </button>
            )}
          </div>

          {/* Contenido de la tabla */}
          {loadingHorarios ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-600 dark:text-gray-400">Cargando horarios...</p>
            </div>
          ) : horarios.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No hay horarios registrados para este espacio
              </p>
              {canManage && (
                <button
                  onClick={() => handleOpenModal(null)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
                >
                  Crear primer horario
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                      Día
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                      Hora Inicio
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-900 dark:text-white">
                      Hora Fin
                    </th>
                    <th className="px-6 py-3 text-center font-medium text-gray-900 dark:text-white">
                      Estado
                    </th>
                    {canManage && (
                      <th className="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                  {horarios.map((horario) => (
                    <tr
                      key={horario.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-3 text-gray-900 dark:text-white">
                        <span className="font-medium">
                          {DIAS_SEMANA[horario.dia_semana]}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-900 dark:text-white">
                        {horario.hora_inicio}
                      </td>
                      <td className="px-6 py-3 text-gray-900 dark:text-white">
                        {horario.hora_fin}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            horario.activo
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {horario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-6 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenModal(horario)}
                              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300
                                transition-colors"
                              title="Editar"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleActivo(horario)}
                              className={`transition-colors ${
                                horario.activo
                                  ? 'text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300'
                                  : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                              }`}
                              title={horario.activo ? 'Desactivar' : 'Activar'}
                            >
                              {horario.activo ? 'Desactivar' : 'Activar'}
                            </button>
                            <button
                              onClick={() => handleDeleteHorario(horario)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                                transition-colors"
                              title="Eliminar"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal para crear/editar horario */}
      {isModalOpen && selectedEspacioId && (
        <HorarioEspacioModal
          isOpen={isModalOpen}
          horario={selectedHorario}
          onClose={handleCloseModal}
          onSave={handleSaveHorario}
          isLoading={isSaving}
        />
      )}
    </div>
  )
}
