import { Pencil, Settings } from 'lucide-react';
import { useState, useEffect } from 'react'

const BLOQUE_MINUTOS = 30
const DURACION_MAX_MIN = 12 * 60

const DURACIONES_SERVICIO = Array.from(
  { length: DURACION_MAX_MIN / BLOQUE_MINUTOS },
  (_, i) => {
    const value = (i + 1) * BLOQUE_MINUTOS
    const horas = Math.floor(value / 60)
    const minutos = value % 60

    let label = ''
    if (horas > 0) {
      label = `${horas} hora${horas > 1 ? 's' : ''}`
      if (minutos > 0) label += ` ${minutos} minutos`
    } else {
      label = `${minutos} minutos`
    }

    return { value, label }
  }
)

export const ServicioCatalogoModal = ({
  isOpen,
  onClose,
  onSubmit,
  servicio = null,
  isLoading = false,
  aiPrefill = null,
  onSuccess = null,
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

  // Ghost User Effect
  useEffect(() => {
    if (!aiPrefill || !isOpen) return;

    if (aiPrefill.status === 'PENDIENTE') {
      const formUpdates = {};
      const fieldsToSimulate = [];
      const typingSpeed = 10;

      const aiCodigo = aiPrefill.codigo || (aiPrefill.nombre_servicio ? aiPrefill.nombre_servicio.toUpperCase().replace(/\s+/g, '_') : '');
      if (aiCodigo && aiCodigo !== formData.codigo) {
        fieldsToSimulate.push({ field: 'codigo', value: aiCodigo });
      }
      if (aiPrefill.nombre_servicio && aiPrefill.nombre_servicio !== formData.nombre) {
        fieldsToSimulate.push({ field: 'nombre', value: aiPrefill.nombre_servicio });
      }
      if (aiPrefill.descripcion && aiPrefill.descripcion !== formData.descripcion) {
        fieldsToSimulate.push({ field: 'descripcion', value: aiPrefill.descripcion });
      }
      if (aiPrefill.tiempo_estandar_min && aiPrefill.tiempo_estandar_min !== formData.tiempo_estandar_min) {
        fieldsToSimulate.push({ field: 'tiempo_estandar_min', value: aiPrefill.tiempo_estandar_min });
      }
      if (aiPrefill.precio_base && aiPrefill.precio_base !== formData.precio_base) {
        fieldsToSimulate.push({ field: 'precio_base', value: aiPrefill.precio_base });
      }

      if (fieldsToSimulate.length > 0) {
        let currentFieldIndex = 0;
        let currentCharIndex = 0;

        const typeNextChar = () => {
          if (currentFieldIndex >= fieldsToSimulate.length) return;

          const currentField = fieldsToSimulate[currentFieldIndex];
          const targetValue = String(currentField.value);

          if (currentCharIndex < targetValue.length) {
            setFormData(prev => ({
              ...prev,
              [currentField.field]: targetValue.substring(0, currentCharIndex + 1)
            }));
            currentCharIndex++;
            setTimeout(typeNextChar, typingSpeed);
          } else {
            currentFieldIndex++;
            currentCharIndex = 0;
            setTimeout(typeNextChar, typingSpeed * 3);
          }
        };

        typeNextChar();
      }
    } else if (aiPrefill.status === 'EJECUTADA') {
      setTimeout(() => {
        const btn = document.getElementById('servicio-submit-btn');
        if (btn) btn.click();
      }, 500);
    }
  }, [aiPrefill?._ts, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || '' : value,
    }))

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

    const tiempo = parseInt(formData.tiempo_estandar_min, 10)
    if (!tiempo || tiempo < BLOQUE_MINUTOS || tiempo % BLOQUE_MINUTOS !== 0) {
      newErrors.tiempo_estandar_min = 'Selecciona una duración válida en bloques de 30 minutos'
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

    const dataToSubmit = {
      codigo: formData.codigo.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim(),
      tiempo_estandar_min: parseInt(formData.tiempo_estandar_min, 10),
      precio_base: parseFloat(formData.precio_base),
    }

    onSubmit(dataToSubmit)
    if (aiPrefill?.status === 'EJECUTADA' && onSuccess) {
      setTimeout(onSuccess, 1000);
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-carbon-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-carbon-800 px-6 py-4 border-b border-neutral-200 dark:border-white/[0.08] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-carbon-900 dark:text-white">
            {servicio ? <><Pencil className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Editar Servicio</> : <><Settings className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Agregar Nuevo Servicio</>}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-carbon-600 dark:hover:text-neutral-300 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
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
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-carbon-700 text-carbon-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 ${
                errors.codigo ? 'border-red-500' : 'border-neutral-300 dark:border-white/[0.08]'
              }`}
            />
            {errors.codigo && <p className="text-red-500 text-xs mt-1">{errors.codigo}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
              Nombre del Servicio *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Ej: Cambio de aceite y filtro"
              maxLength="200"
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-carbon-700 text-carbon-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.nombre ? 'border-red-500' : 'border-neutral-300 dark:border-white/[0.08]'
              }`}
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
              Descripción *
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              placeholder="Describe detalladamente qué incluye este servicio..."
              maxLength="1000"
              rows="3"
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-carbon-700 text-carbon-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                errors.descripcion ? 'border-red-500' : 'border-neutral-300 dark:border-white/[0.08]'
              }`}
            />
            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
                Tiempo Estándar *
              </label>
              <select
                name="tiempo_estandar_min"
                value={formData.tiempo_estandar_min}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-carbon-700 text-carbon-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.tiempo_estandar_min ? 'border-red-500' : 'border-neutral-300 dark:border-white/[0.08]'
                }`}
              >
                <option value="">Selecciona duración</option>
                {DURACIONES_SERVICIO.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              {errors.tiempo_estandar_min && <p className="text-red-500 text-xs mt-1">{errors.tiempo_estandar_min}</p>}
              <p className="text-xs text-carbon-500 dark:text-neutral-400 mt-1">Solo bloques de 30 minutos</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
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
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-carbon-700 text-carbon-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.precio_base ? 'border-red-500' : 'border-neutral-300 dark:border-white/[0.08]'
                }`}
              />
              {errors.precio_base && <p className="text-red-500 text-xs mt-1">{errors.precio_base}</p>}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-6 border-t border-neutral-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg text-carbon-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-carbon-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              id="servicio-submit-btn"
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
