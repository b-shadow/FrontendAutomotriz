/**
 * EspacioTrabajoModal.jsx - Modal para crear/editar espacios de trabajo
 *
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - onSave: function(espacioData)
 * - espacio: object (si es edición, null si es creación)
 * - isLoading: boolean
 */
import { useState } from 'react'

const TIPOS_ESPACIO = [
  { value: 'TALLER', label: 'Taller' },
  { value: 'CHEQUEO', label: 'Chequeo' },
  { value: 'GARAJE', label: 'Garaje' },
  { value: 'LAVADO', label: 'Lavado' },
]

export const EspacioTrabajoModal = ({
  isOpen,
  onClose,
  onSave,
  espacio = null,
  isLoading = false,
}) => {
  const isEditing = !!espacio

  const getInitialFormData = () => {
    if (isEditing && espacio) {
      return {
        codigo: espacio.codigo || '',
        nombre: espacio.nombre || '',
        tipo: espacio.tipo || '',
        observaciones: espacio.observaciones || '',
        activo: espacio.activo !== false,
      }
    }
    return {
      codigo: '',
      nombre: '',
      tipo: '',
      observaciones: '',
      activo: true,
    }
  }

  const [formData, setFormData] = useState(getInitialFormData())
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'Código es obligatorio'
    }
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'Nombre es obligatorio'
    }
    if (!formData.tipo) {
      newErrors.tipo = 'Tipo es obligatorio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {isEditing ? '✏️ Editar Espacio' : '➕ Registrar Espacio'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código
            </label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              placeholder="TALLER_1"
              disabled={isEditing} // No editar código en modo edición
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                disabled:bg-gray-100 dark:disabled:bg-slate-600 disabled:cursor-not-allowed
                focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.codigo && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.codigo}</p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Taller Principal"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.nombre && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">-- Selecciona un tipo --</option>
              {TIPOS_ESPACIO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
            {errors.tipo && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.tipo}</p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              placeholder="Notas adicionales del espacio"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg
                bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
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
                Espacio activo
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
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
