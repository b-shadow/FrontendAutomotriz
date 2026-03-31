/**
 * CambiarEstadoEspacioModal.jsx - Modal para cambiar estado de espacio
 *
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - onSave: function(payload)
 * - espacio: object
 * - isLoading: boolean
 */
import { useState } from 'react'

const ESTADOS = [
  { value: 'DISPONIBLE', label: 'Disponible', color: 'green' },
  { value: 'OCUPADO', label: 'Ocupado', color: 'orange' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento', color: 'red' },
  { value: 'TIEMPO_EXTENDIDO', label: 'Tiempo Extendido', color: 'blue' },
]

export const CambiarEstadoEspacioModal = ({
  isOpen,
  onClose,
  onSave,
  espacio = null,
  isLoading = false,
}) => {
  const getInitialFormData = () => {
    if (isOpen && espacio) {
      return {
        estado: espacio.estado || '',
        motivo: '',
      }
    }
    return {
      estado: '',
      motivo: '',
    }
  }

  const [formData, setFormData] = useState(getInitialFormData())
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!formData.estado) {
      newErrors.estado = 'Debes seleccionar un estado'
    }

    if (espacio && formData.estado === espacio.estado) {
      newErrors.estado = 'El espacioya tiene este estado'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onSave({
      estado: formData.estado,
      motivo: formData.motivo,
    })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  if (!isOpen || !espacio) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Cambiar Estado del Espacio
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Estado actual */}
          <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded">
            <p className="text-sm text-gray-600 dark:text-gray-400">Estado actual</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {espacio.estado_display}
            </p>
          </div>

          {/* Nuevo estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nuevo Estado
            </label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">-- Selecciona un estado --</option>
              {ESTADOS.map((est) => (
                <option key={est.value} value={est.value} disabled={est.value === espacio.estado}>
                  {est.label}
                </option>
              ))}
            </select>
            {errors.estado && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.estado}</p>
            )}
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motivo (opcional)
            </label>
            <textarea
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              placeholder="Explica por qué se cambia el estado..."
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

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
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : 'Cambiar Estado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
