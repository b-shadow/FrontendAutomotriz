import { useState, useEffect } from 'react'

export const ServicioCatalogoModal = ({
  isOpen,
  onClose,
  onSubmit,
  servicio = null,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tiempo_estandar_min: '',
    precio_base: '',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!isOpen) return
    
    const newFormData = servicio
      ? {
          codigo: servicio.codigo || '',
          nombre: servicio.nombre || '',
          descripcion: servicio.descripcion || '',
          tiempo_estandar_min: servicio.tiempo_estandar_min || '',
          precio_base: servicio.precio_base || '',
        }
      : {
          codigo: '',
          nombre: '',
          descripcion: '',
          tiempo_estandar_min: '',
          precio_base: '',
        }
    
    setFormData(newFormData)
    setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servicio?.id, isOpen])

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || '' : value,
    }))
    // Limpiar error para este campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'El código es obligatorio'
    }
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    }
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria'
    }
    if (!formData.tiempo_estandar_min || parseInt(formData.tiempo_estandar_min) <= 0) {
      newErrors.tiempo_estandar_min = 'El tiempo debe ser mayor a 0 minutos'
    }
    if (!formData.precio_base || parseFloat(formData.precio_base) < 0) {
      newErrors.precio_base = 'El precio base es obligatorio y debe ser >= 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    // Preparar datos para enviar
    const dataToSubmit = {
      codigo: formData.codigo.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      tiempo_estandar_min: parseInt(formData.tiempo_estandar_min),
      precio_base: parseFloat(formData.precio_base),
    }

    onSubmit(dataToSubmit)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {servicio ? '✏️ Editar Servicio' : '🛠️ Agregar Nuevo Servicio'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Código del Servicio *
            </label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleInputChange}
              placeholder="Ej: CAMBIO_ACEITE, SERVICE_BASICO"
              maxLength="50"
              disabled={!!servicio}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 ${
                errors.codigo ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              }`}
            />
            {errors.codigo && <p className="text-red-500 text-xs mt-1">{errors.codigo}</p>}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre del Servicio *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ej: Cambio de aceite y filtro"
              maxLength="200"
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              }`}
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción *
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Describe detalladamente qué incluye este servicio..."
              maxLength="1000"
              rows="3"
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                errors.descripcion ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              }`}
            />
            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
          </div>

          {/* Tiempo estándar y Precio base en una fila */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tiempo Estándar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tiempo Estándar (minutos) *
              </label>
              <input
                type="number"
                name="tiempo_estandar_min"
                value={formData.tiempo_estandar_min}
                onChange={handleInputChange}
                placeholder="Ej: 30"
                min="1"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.tiempo_estandar_min ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                }`}
              />
              {errors.tiempo_estandar_min && <p className="text-red-500 text-xs mt-1">{errors.tiempo_estandar_min}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Se usará para planificación y reservas</p>
            </div>

            {/* Precio Base */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Precio Base (Bs.) *
              </label>
              <input
                type="number"
                name="precio_base"
                value={formData.precio_base}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.precio_base ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                }`}
              />
              {errors.precio_base && <p className="text-red-500 text-xs mt-1">{errors.precio_base}</p>}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              )}
              {servicio ? 'Guardar Cambios' : 'Agregar Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServicioCatalogoModal
