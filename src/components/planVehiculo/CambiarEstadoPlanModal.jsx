import { RefreshCw, X, Hourglass, Check } from 'lucide-react';
import { useState } from 'react'
import planVehiculoService from '../../services/planVehiculoService'

/**
 * CambiarEstadoPlanModal - Modal para cambiar estado del plan
 */
export const CambiarEstadoPlanModal = ({
  tenantSlug,
  plan,
  onClose,
  onSuccess,
}) => {
  const [nuevoEstado, setNuevoEstado] = useState(plan.estado || '')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const estadosDisponibles = [
    'LIBRE',
    'EN_EJECUCION',
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!nuevoEstado) {
      setError('Debes seleccionar un estado')
      return
    }

    try {
      setLoading(true)
      await planVehiculoService.cambiarEstadoPlanVehiculo(tenantSlug, plan.id, {
        estado: nuevoEstado,
        motivo,
      })
      onSuccess()
    } catch (err) {
      setError(
        err.response.data.error ||
          err.response.data.mensaje ||
          'Error al cambiar el estado'
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
            <RefreshCw className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Cambiar Estado del Plan
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

          {/* Estado Actual */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
              Estado Actual
            </label>
            <div className="p-2 bg-neutral-100 dark:bg-carbon-700 rounded-lg text-carbon-800 dark:text-neutral-200 text-sm font-medium">
              {plan.estado.replace(/_/g, ' ') || 'N/A'}
            </div>
          </div>

          {/* Nuevo Estado */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
              Nuevo Estado *
            </label>
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg dark:bg-carbon-700 dark:text-white text-carbon-900 focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
            >
              <option value="">Selecciona un estado</option>
              {estadosDisponibles.map((estado) => (
                <option key={estado} value={estado}>
                  {estado.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-carbon-700 dark:text-neutral-300 mb-2">
              Motivo (Opcional)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Razón del cambio de estado"
              rows={3}
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
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <><Hourglass className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Cambiando...</> : <><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Cambiar Estado</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CambiarEstadoPlanModal
