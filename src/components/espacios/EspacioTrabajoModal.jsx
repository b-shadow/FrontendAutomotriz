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
import { Pencil, Plus } from 'lucide-react';
import { useState, useEffect } from 'react'
import { useGhostAutomation } from '../../hooks/useGhostAutomation'

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
  aiPrefill = null,
  onSuccess = null,
}) => {
  const isEditing = !!espacio

  const getInitialFormData = () => {
    if (isEditing && espacio) {
      return {
        codigo: espacio.codigo || '', nombre : espacio.nombre || '',
        tipo: espacio.tipo || '', observaciones : espacio.observaciones || '',
        activo: espacio.activo !== false,
      }
    }
    return {
      codigo: '', nombre : '',
      tipo: '', observaciones : '',
      activo: true,
    }
  }

  const [formData, setFormData] = useState(getInitialFormData())
  const [errors, setErrors] = useState({})
  const { isSimulating, setIsSimulating, simulateTyping, simulateDelay } = useGhostAutomation()


  useEffect(() => {
    if (!aiPrefill || !isOpen) return;

    // Auto-generar código desde nombre ("Espacio Feliz" → "ESPACIO_FELIZ")
    const generateCodigo = (nombre) => String(nombre || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');

    const nombreEspacio = aiPrefill.nombre || '';
    const aiCodigo = aiPrefill.codigo || generateCodigo(nombreEspacio);

    // Normalizar tipo: la IA puede mandar "Taller", "taller", "TALLER" — normalizamos a uppercase
    const normalizeTipo = (val) => {
      if (!val) return '';
      const upper = String(val).toUpperCase().trim();
      const valid = ['TALLER', 'CHEQUEO', 'GARAJE', 'LAVADO'];
      return valid.includes(upper) ? upper : '';
    };
    const tipoNorm = normalizeTipo(aiPrefill.tipo);

    const processPrefill = async () => {
      console.log('[Ghost Espacio] processPrefill disparado. status=', aiPrefill.status, '| _ts=', aiPrefill._ts, '| aiPrefill=', JSON.stringify(aiPrefill));
      setIsSimulating(true);
      await simulateDelay(400);

      if (aiPrefill.status === 'EJECUTADA' || aiPrefill.estado === 'EJECUTADA') {
        setIsSimulating(false);
        await simulateDelay(800);
        const submitBtn = document.getElementById('espacio-submit-btn');
        if (submitBtn) {
           submitBtn.click();
        } else {
           const submitEvent = { preventDefault: () => { } };
           handleSubmit(submitEvent);
        }
        return;
      }

      // FASE PENDIENTE: llenar visualmente con el hook (igual que ServicioCatalogoModal)
      if (aiCodigo) await simulateTyping(setFormData, 'codigo', aiCodigo, 20);
      if (nombreEspacio) await simulateTyping(setFormData, 'nombre', nombreEspacio, 30);

      // SELECT tipo: directo (simulateTyping no funciona en <select>)
      if (tipoNorm) {
        await simulateDelay(200);
        setFormData(prev => ({ ...prev, tipo: tipoNorm }));
      }

      if (aiPrefill.observaciones) {
        await simulateTyping(setFormData, 'observaciones', String(aiPrefill.observaciones), 20);
      }

      setIsSimulating(false);
    };

    processPrefill();
  }, [aiPrefill?._ts, isOpen]);


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
    if (aiPrefill?.status === 'EJECUTADA' && onSuccess) {
      setTimeout(onSuccess, 1000);
    }
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
        ...prev, [name] : '',
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-carbon-800 rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-carbon-900 dark:text-white mb-4">
          {isEditing ? <><Pencil className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Editar Espacio</> : <><Plus className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Registrar Espacio</>}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-1">
              Código
            </label>
            <input
              type="text"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              placeholder="TALLER_1"
              disabled={isEditing} // No editar código en modo edición
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg
                bg-white dark:bg-carbon-700 text-carbon-900 dark:text-white ? disabled : bg-neutral-100 dark:disabled:bg-carbon-600 disabled:cursor-not-allowed
                focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.codigo && (<p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.codigo}</p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-1">
              Nombre
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Taller Principal"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg
                bg-white dark:bg-carbon-700 text-carbon-900 dark:text-white ? focus : ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.nombre && (<p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.nombre}</p>
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-1">
              Tipo
            </label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg
                bg-white dark:bg-carbon-700 text-carbon-900 dark:text-white ? focus : ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">-- Selecciona un tipo --</option>
              {TIPOS_ESPACIO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
            {errors.tipo && (<p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.tipo}</p>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              placeholder="Notas adicionales del espacio"
              rows="3"
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg
                bg-white dark:bg-carbon-700 text-carbon-900 dark:text-white ? focus : ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="w-4 h-4 text-primary-600 border-neutral-300 dark:border-white/[0.08] rounded ? focus : ring-2 focus:ring-primary-500"
              />
              <label htmlFor="activo" className="ml-2 text-sm text-carbon-700 dark:text-neutral-300">
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
              className="flex-1 px-4 py-2 border border-neutral-300 dark:border-white/[0.08] text-carbon-700 dark:text-neutral-300
                rounded-lg hover:bg-neutral-50 dark:hover:bg-carbon-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              id="espacio-submit-btn"
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg ? disabled : opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
