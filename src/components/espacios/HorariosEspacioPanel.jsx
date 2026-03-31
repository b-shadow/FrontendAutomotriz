/**
 * HorariosEspacioPanel.jsx - Panel para ver y gestionar horarios de un espacio
 *
 * Props:
 * - espacio: object (id, nombre)
 * - user: object
 * - tenantSlug: string
 */
import { useState, useEffect } from 'react'
import { HorarioEspacioModal } from './HorarioEspacioModal'
import HorarioGrid from './HorarioGrid'
import espaciosTrabajoService from '../../services/espaciosTrabajoService'
import { canManageHorariosEspacio } from '../../utils/roleHelper'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const HorariosEspacioPanel = ({ espacio, user, tenantSlug }) => {
  const [horarios, setHorarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedHorario, setSelectedHorario] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const canManage = canManageHorariosEspacio(user)

  // Cargar horarios
  useEffect(() => {
    loadHorarios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espacio.id])

  const loadHorarios = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await espaciosTrabajoService.listarHorariosEspacio(tenantSlug, espacio.id)
      setHorarios(data.horarios || [])
    } catch (err) {
      console.error('Error al cargar horarios:', err)
      setError('No se pudieron cargar los horarios')
    } finally {
      setLoading(false)
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
          espacio.id,
          selectedHorario.id,
          payload
        )
      } else {
        await espaciosTrabajoService.crearHorarioEspacio(tenantSlug, espacio.id, payload)
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

  const handleDeleteHorario = async (horarioId) => {
    try {
      setIsSaving(true)
      await espaciosTrabajoService.eliminarHorarioEspacio(tenantSlug, espacio.id, horarioId)
      await loadHorarios()
      handleCloseModal()
    } catch (err) {
      console.error('Error al eliminar horario:', err)
      setError('No se pudo eliminar el horario')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 w-full h-full max-w-none">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Horarios - {espacio.nombre}
        </h3>
        {canManage && (
          <button
            onClick={() => handleOpenModal(null)}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-base font-medium
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={isSaving}
          >
            + Agregar Horario
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="text-gray-600 dark:text-gray-400">Cargando horarios...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && horarios.length === 0 && (
        <div className="text-center py-8 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">No hay horarios registrados</p>
          {canManage && (
            <button
              onClick={() => handleOpenModal(null)}
              className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
            >
              Crear primer horario
            </button>
          )}
        </div>
      )}

      {/* Horarios Grid - Vista Completa */}
      {!loading && horarios.length > 0 && (
        <HorarioGrid horarios={horarios} startHour={null} endHour={null} slotMinutes={60} />
      )}

      {/* Modal */}
      {isModalOpen && (
        <HorarioEspacioModal
          key={`horario-${selectedHorario?.id || 'new'}`}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveHorario}
          onDelete={handleDeleteHorario}
          horario={selectedHorario}
          isLoading={isSaving}
        />
      )}
    </div>
  )
}
