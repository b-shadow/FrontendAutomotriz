import { Pencil, Plus, X, Hourglass, Check } from 'lucide-react';
import { useState, useEffect } from 'react'
import planVehiculoService from '../../services/planVehiculoService'

/**
 * PlanVehiculoModal - Modal para crear o editar planes
 */
export const PlanVehiculoModal = ({
  tenantSlug,
  plan,
  vehiculos,
  onClose,
  onSuccess,
  aiPrefill = null,
}) => {
  const [descripcion, setDescripcion] = useState('')
  const [vehiculoId, setVehiculoId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (plan) {
      setDescripcion(plan.descripcion_general || '')
      if (plan.vehiculo) {
        setVehiculoId(
          typeof plan.vehiculo === 'object' ? plan.vehiculo.id : plan.vehiculo
        )
      }
    }
  }, [plan])

  // Ghost User Effect
  useEffect(() => {
    if (!aiPrefill) return;

    if (aiPrefill.status === 'PENDIENTE') {
      const typingSpeed = 10;
      const targetDesc = String(aiPrefill.descripcion || '');
      
      if (targetDesc && targetDesc !== descripcion) {
        let currentCharIndex = 0;
        const typeNextChar = () => {
          if (currentCharIndex < targetDesc.length) {
            setDescripcion(targetDesc.substring(0, currentCharIndex + 1));
            currentCharIndex++;
            setTimeout(typeNextChar, typingSpeed);
          }
        };
        typeNextChar();
      }
    } else if (aiPrefill.status === 'EJECUTADA') {
      if (aiPrefill.descripcion) setDescripcion(aiPrefill.descripcion);

      setTimeout(() => {
        const btn = document.getElementById('plan-submit-btn');
        if (btn && !btn.disabled) {
          btn.click();
        }
      }, 500);
    }
  }, [aiPrefill?._ts]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // CU22: No se pueden crear planes nuevos manualmente
    if (!plan) {
      setError('CU22: El plan de vehículo se crea automáticamente al registrar el vehículo. No es posible crear planes manualmente.')
      return
    }

    if (!vehiculoId) {
      setError('Debes seleccionar un vehículo')
      return
    }

    try {
      setLoading(true)

      if (plan) {
        // Editar plan existente
        await planVehiculoService.editarPlanVehiculo(tenantSlug, plan.id, {
          descripcion_general: descripcion,
        })
      } else {
        // Crear nuevo plan - NUNCA DEBERÍA LLEGAR AQUÍ
        await planVehiculoService.crearPlanVehiculo(tenantSlug, {
          vehiculo_id: vehiculoId, descripcion_general : descripcion,
        })
      }

      onSuccess()
    } catch (err) {
      setError(
        err.response.data.error ||
          err.response.data.mensaje ||
          'Error al guardar el plan'
      )
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-carbon-800 rounded-lg shadow-xl max-w-md w-full transition-colors">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-neutral-200 dark:border-white/[0.08]">
          <h2 className="text-lg font-bold text-carbon-900 dark:text-white">
            {plan ? <><Pencil className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Editar Plan</> : <><Plus className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Crear Plan</>}
          </h2>
          <button
            onClick={onClose}
            className="text-carbon-500 dark:text-neutral-400 hover:text-carbon-700 dark:hover:text-neutral-300 transition-colors"
            aria-label="Cerrar"
          >
            <X className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Vehículo */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
              Vehículo *
            </label>
            <select
              value={vehiculoId}
              onChange={(e) => setVehiculoId(e.target.value)}
              disabled={!!plan}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg dark:bg-carbon-700 dark:text-white text-carbon-900 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50 transition-colors"
            >
              <option value="">Selecciona un vehículo</option>
              {vehiculos.map((veh) => (
                <option key={veh.id} value={veh.id}>
                  {veh.placa} - {veh.marca} {veh.modelo}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción General */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
              Descripción General
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción de las necesidades del vehículo"
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg dark:bg-carbon-700 dark:text-white text-carbon-900 focus:ring-2 focus:ring-primary-500 outline-none transition-colors resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-neutral-200 dark:border-white/[0.08]">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg text-carbon-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-carbon-700 font-medium transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            id="plan-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <><Hourglass className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Guardando...</> : <><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Guardar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlanVehiculoModal
