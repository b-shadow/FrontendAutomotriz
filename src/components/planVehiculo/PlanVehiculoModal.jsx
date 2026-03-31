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
          vehiculo_id: vehiculoId,
          descripcion_general: descripcion,
        })
      }

      onSuccess()
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.mensaje ||
          'Error al guardar el plan'
      )
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full transition-colors">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {plan ? '✏️ Editar Plan' : '➕ Crear Plan'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            aria-label="Cerrar"
          >
            ✕
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vehículo *
            </label>
            <select
              value={vehiculoId}
              onChange={(e) => setVehiculoId(e.target.value)}
              disabled={!!plan}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none disabled:opacity-50 transition-colors"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción General
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción de las necesidades del vehículo"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none transition-colors resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '⏳ Guardando...' : '✓ Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlanVehiculoModal
