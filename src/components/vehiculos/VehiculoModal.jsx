import { useState, useEffect } from 'react'

export const VehiculoModal = ({
  isOpen,
  onClose,
  onSubmit,
  vehiculo = null,
  isLoading = false,
  usuarios = [],
  canSelectPropietario = false,
  currentUser = null,
}) => {
  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    color: '',
    kilometraje_actual: 0,
    vin_chasis: '',
    motor: '',
    observaciones: '',
    propietario_id: '',
  })

  const [errors, setErrors] = useState({})

  // Sincronizar formulario cuando cambia vehículo o modal se abre/cierra
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isOpen) return
    
    const newFormData = vehiculo
      ? {
          placa: vehiculo.placa || '',
          marca: vehiculo.marca || '',
          modelo: vehiculo.modelo || '',
          anio: vehiculo.anio || new Date().getFullYear(),
          color: vehiculo.color || '',
          kilometraje_actual: vehiculo.kilometraje_actual || 0,
          vin_chasis: vehiculo.vin_chasis || '',
          motor: vehiculo.motor || '',
          observaciones: vehiculo.observaciones || '',
          propietario_id: vehiculo.propietario || '',
        }
      : {
          placa: '',
          marca: '',
          modelo: '',
          anio: new Date().getFullYear(),
          color: '',
          kilometraje_actual: 0,
          vin_chasis: '',
          motor: '',
          observaciones: '',
          propietario_id: '',
        }
    setFormData(newFormData)
    setErrors({})
  }, [vehiculo, isOpen])

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
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

    if (!formData.placa.trim()) {
      newErrors.placa = 'La placa es obligatoria'
    }
    if (!formData.marca.trim()) {
      newErrors.marca = 'La marca es obligatoria'
    }
    if (!formData.modelo.trim()) {
      newErrors.modelo = 'El modelo es obligatorio'
    }
    if (!formData.anio || formData.anio < 1900 || formData.anio > new Date().getFullYear() + 1) {
      newErrors.anio = 'El año debe ser válido'
    }
    if (formData.kilometraje_actual < 0) {
      newErrors.kilometraje_actual = 'El kilometraje no puede ser negativo'
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
    const dataToSubmit = { ...formData }

    if (!canSelectPropietario) {
      delete dataToSubmit.propietario_id
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
            {vehiculo ? '✏️ Editar Vehículo' : '🚗 Registrar Nuevo Vehículo'}
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
          {/* Propietario - selector si puede seleccionar, info si es USUARIO */}
          {canSelectPropietario ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Propietario
              </label>
              <select
                name="propietario_id"
                value={formData.propietario_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Seleccionar propietario...</option>
                {usuarios.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nombres} {user.apellidos} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          ) : !vehiculo && currentUser ? (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-300">
                <strong>Propietario:</strong> {currentUser.nombres} {currentUser.apellidos}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Este vehículo será registrado a tu nombre automáticamente.
              </p>
            </div>
          ) : null}

          {/* Placa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Placa *
            </label>
            <input
              type="text"
              name="placa"
              value={formData.placa}
              onChange={handleInputChange}
              placeholder="Ej: ABC123"
              maxLength="50"
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.placa ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              }`}
              disabled={isLoading || !!vehiculo} // No permitir editar placa
            />
            {errors.placa && <p className="text-red-500 text-xs mt-1">{errors.placa}</p>}
          </div>

          {/* Marca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Marca *
            </label>
            <input
              type="text"
              name="marca"
              value={formData.marca}
              onChange={handleInputChange}
              placeholder="Ej: Toyota"
              maxLength="100"
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.marca ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              }`}
            />
            {errors.marca && <p className="text-red-500 text-xs mt-1">{errors.marca}</p>}
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modelo *
            </label>
            <input
              type="text"
              name="modelo"
              value={formData.modelo}
              onChange={handleInputChange}
              placeholder="Ej: Corolla"
              maxLength="100"
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.modelo ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              }`}
            />
            {errors.modelo && <p className="text-red-500 text-xs mt-1">{errors.modelo}</p>}
          </div>

          {/* Año, Color en una fila */}
          <div className="grid grid-cols-2 gap-4">
            {/* Año */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Año *
              </label>
              <input
                type="number"
                name="anio"
                value={formData.anio}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.anio ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                }`}
              />
              {errors.anio && <p className="text-red-500 text-xs mt-1">{errors.anio}</p>}
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder="Ej: Blanco"
                maxLength="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Kilometraje */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kilometraje Actual
            </label>
            <input
              type="number"
              name="kilometraje_actual"
              value={formData.kilometraje_actual}
              onChange={handleInputChange}
              min="0"
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.kilometraje_actual ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
              }`}
            />
            {errors.kilometraje_actual && <p className="text-red-500 text-xs mt-1">{errors.kilometraje_actual}</p>}
          </div>

          {/* VIN/Chasis, Motor */}
          <div className="grid grid-cols-2 gap-4">
            {/* VIN/Chasis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                VIN/Chasis
              </label>
              <input
                type="text"
                name="vin_chasis"
                value={formData.vin_chasis}
                onChange={handleInputChange}
                placeholder="Número VIN"
                maxLength="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Motor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motor
              </label>
              <input
                type="text"
                name="motor"
                value={formData.motor}
                onChange={handleInputChange}
                placeholder="Ej: 1.8L Gasolina"
                maxLength="100"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              placeholder="Notas adicionalesobre el vehículo..."
              maxLength="500"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
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
              {isLoading && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {vehiculo ? 'Guardar Cambios' : 'Registrar Vehículo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VehiculoModal
