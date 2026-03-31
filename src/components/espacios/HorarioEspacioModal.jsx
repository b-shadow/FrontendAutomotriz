/**
 * HorarioEspacioModal.jsx - Modal para crear/editar horarios de espacio
 *
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - onSave: function(payload)
 * - horario: object (null para crear, object para editar)
 * - isLoading: boolean
 */
import { useState } from 'react'

const DIAS_SEMANA = [
  { value: '0', label: 'Lunes' },
  { value: '1', label: 'Martes' },
  { value: '2', label: 'Miércoles' },
  { value: '3', label: 'Jueves' },
  { value: '4', label: 'Viernes' },
  { value: '5', label: 'Sábado' },
  { value: '6', label: 'Domingo' },
]

export const HorarioEspacioModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  horario = null,
  isLoading = false,
}) => {
  const getInitialFormData = () => {
    if (isOpen && horario) {
      return {
        dia_semana: String(horario.dia_semana),
        hora_inicio: horario.hora_inicio || '',
        hora_fin: horario.hora_fin || '',
        activo: horario.activo !== false,
      }
    }
    return {
      dia_semana: '',
      hora_inicio: '',
      hora_fin: '',
      activo: true,
    }
  }

  const [formData, setFormData] = useState(getInitialFormData())
  const [errors, setErrors] = useState({})
  const [isDeleting, setIsDeleting] = useState(false)

  const validateForm = () => {
    const newErrors = {}

    if (!formData.dia_semana) {
      newErrors.dia_semana = 'Debes seleccionar un día'
    }

    if (!formData.hora_inicio) {
      newErrors.hora_inicio = 'Debes especificar la hora de inicio'
    }

    if (!formData.hora_fin) {
      newErrors.hora_fin = 'Debes especificar la hora de fin'
    }

    if (formData.hora_inicio && formData.hora_fin) {
      const [hInicio, mInicio] = formData.hora_inicio.split(':').map(Number)
      const [hFin, mFin] = formData.hora_fin.split(':').map(Number)
      const minInicio = hInicio * 60 + mInicio
      const minFin = hFin * 60 + mFin

      if (minInicio >= minFin) {
        newErrors.hora_fin = 'La hora de fin debe ser mayor que la de inicio'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const payload = {
      dia_semana: Number(formData.dia_semana),
      hora_inicio: formData.hora_inicio,
      hora_fin: formData.hora_fin,
    }

    // En edición, incluir el campo activo
    if (horario) {
      payload.activo = formData.activo
    }

    onSave(payload)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleDelete = async () => {
    if (!isDeleting) {
      setIsDeleting(true)
      return
    }
    // Segunda confirmación: proceder con eliminación
    if (onDelete && horario) {
      await onDelete(horario.id)
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  const isEditing = horario !== null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {isEditing ? 'Editar Horario' : 'Crear Horario'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Día de la semana */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Día de la Semana
            </label>
            <select
              name="dia_semana"
              value={formData.dia_semana}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">-- Selecciona un día --</option>
              {DIAS_SEMANA.map((dia) => (
                <option key={dia.value} value={dia.value}>
                  {dia.label}
                </option>
              ))}
            </select>
            {errors.dia_semana && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.dia_semana}</p>
            )}
          </div>

          {/* Hora de inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hora de Inicio
            </label>
            <input
              type="time"
              name="hora_inicio"
              value={formData.hora_inicio}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.hora_inicio && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.hora_inicio}</p>
            )}
          </div>

          {/* Hora de fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hora de Fin
            </label>
            <input
              type="time"
              name="hora_fin"
              value={formData.hora_fin}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.hora_fin && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.hora_fin}</p>
            )}
          </div>

          {/* Activo (solo en edición) */}
          {isEditing && (
            <div className="flex items-center">
              <input
                type="checkbox"
                name="activo"
                id="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 border-gray-300 dark:border-slate-600 rounded
                  focus:ring-2 focus:ring-primary-500"
              />
              <label htmlFor="activo" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Horario activo
              </label>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300
                rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDeleting
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isDeleting ? '¿Confirmar?' : 'Eliminar'}
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
