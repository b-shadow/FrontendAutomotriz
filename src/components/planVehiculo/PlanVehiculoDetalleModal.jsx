import { ClipboardList, X, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { canEditPlanVehiculoDetalle, canChangePlanVehiculoDetalleStatus, canDeletePlanVehiculoDetalle } from '../../utils/roleHelper'
/**
 * PlanVehiculoDetalleModal - Modal para ver todos los detalles de un plan
 */
export const PlanVehiculoDetalleModal = ({
  plan,
  user,
  onClose,
  onEditarDetalle,
  onCambiarEstadoDetalle,
  onEliminarDetalle,
}) => {
  const detalles = plan.detalles || []

  const handleEliminarDetalle = (detalle) => {
    const mensaje = `¿Eliminar detalle "${obtenerNombreServicio(detalle)}"\n\nEsta acción no se puede deshacer.`
    if (window.confirm(mensaje)) {
      onEliminarDetalle(detalle)
    }
  }

  const obtenerNombreServicio = (detalle) => {
    // Intentar obtener nombre del servicio de múltiples fuentes
    // Primero, si hay servicio_nombre directo
    if (detalle.servicio_nombre) {
      return detalle.servicio_nombre
    }
    // Si servicio_catalogo es un objeto con nombre
    if (detalle.servicio_catalogo) {
      if (typeof detalle.servicio_catalogo === 'object' && detalle.servicio_catalogo.nombre) {
        return detalle.servicio_catalogo.nombre
      }
    }
    // Fallback: genérico con primeros 8 caracteres del ID
    return `Servicio (${detalle && detalle.id ? String(detalle.id).substring(0, 8) : ''}...)`
  }

  const obtenerPrecioDisplay = (detalle) => {
    if (detalle.precio_referencial) {
      return `Bs. ${parseFloat(detalle.precio_referencial).toFixed(2)}`
    }
    return 'N/A'
  }

  const obtenerTiempoDisplay = (detalle) => {
    if (detalle.tiempo_estandar_min) {
      return `${detalle.tiempo_estandar_min} min`
    }
    return 'N/A'
  }

  const obtenerInfoVehiculo = () => {
    // Primero, intentar obtener de vehiculo_info (lo que devuelve el backend)
    if (plan.vehiculo_info) {
      const { placa, marca, modelo } = plan.vehiculo_info
      return `${placa || ''}${marca ? ' - ' + marca  : ''}${modelo ? ' ' + modelo  : ''}`
    }
    // Fallback: si vehiculo es un objeto con placa
    if (plan.vehiculo && typeof plan.vehiculo === 'object') {
      const { placa, marca, modelo } = plan.vehiculo
      if (placa) {
        return `${placa}${marca ? ' - ' + marca  : ''}${modelo ? ' ' + modelo  : ''}`
      }
      return `${marca || ''} ${modelo || 'Vehículo'}`
    }
    // Si vehiculo es un string (UUID), retornarlo igualmente
    if (plan.vehiculo) {
      return plan.vehiculo
    }
    return 'N/A'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-carbon-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors">
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-carbon-800">
          <h2 className="text-lg font-bold text-carbon-900 dark:text-white">
            <ClipboardList className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Detalle del Plan
          </h2>
          <button
            onClick={onClose}
            className="text-carbon-500 dark:text-neutral-400 hover:text-carbon-700 dark:hover:text-neutral-300 transition-colors text-xl"
            aria-label="Cerrar"
          >
            <X className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Información General del Plan */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-neutral-200 dark:border-white/[0.08]">
            <div>
              <p className="text-xs text-carbon-600 dark:text-neutral-400 uppercase font-semibold">
                Vehículo
              </p>
              <p className="text-sm font-medium text-carbon-900 dark:text-white mt-1">
                {obtenerInfoVehiculo()}
              </p>
            </div>
            <div>
              <p className="text-xs text-carbon-600 dark:text-neutral-400 uppercase font-semibold">
                Estado
              </p>
              <p className="text-sm font-medium text-carbon-900 dark:text-white mt-1">
                {plan.estado.replace(/_/g, ' ') || 'N/A'}
              </p>
            </div>
          </div>

          {/* Descripción General */}
          <div>
            <p className="text-xs text-carbon-600 dark:text-neutral-400 uppercase font-semibold mb-2">
              Descripción General
            </p>
            <p className="text-sm text-carbon-700 dark:text-neutral-300">
              {plan.descripcion_general || 'Sin descripción'}
            </p>
          </div>

          {/* Detalles del Plan */}
          <div>
            <h3 className="font-bold text-carbon-900 dark:text-white mb-4">
              Detalles del Plan ({detalles.length})
            </h3>

            {detalles.length === 0 ? (
              <p className="text-sm text-carbon-600 dark:text-neutral-400 text-center py-4">
                No hay detalles agregados aún
              </p> ) : (
              <div className="space-y-3">
                {detalles.map((detalle) => (
                  <div
                    key={detalle.id}
                    className="border border-neutral-200 dark:border-white/[0.08] rounded-lg p-4 space-y-3 hover:bg-neutral-50 dark:hover:bg-carbon-700/50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-carbon-900 dark:text-white">
                          {obtenerNombreServicio(detalle)}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {detalle.origen || 'N/A'}
                          </span>
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                            {detalle.estado.replace(/_/g, ' ') || 'N/A'}
                          </span>
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                            {detalle.prioridad || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-xs text-carbon-600 dark:text-neutral-400">
                        <p>{obtenerTiempoDisplay(detalle)}</p>
                        <p>{obtenerPrecioDisplay(detalle)}</p>
                      </div>
                    </div>

                    {detalle.observaciones && (
                      <p className="text-xs text-carbon-600 dark:text-neutral-400">
                        <strong>Observaciones:</strong> {detalle.observaciones}
                      </p>
                    )}

                    {detalle.recomendado_por && (
                      <p className="text-xs text-carbon-600 dark:text-neutral-400">
                        <strong>Recomendado por:</strong> {detalle.recomendado_por}
                      </p>
                    )}

                    {/* Acciones del Detalle */}
                    <div className="flex gap-2 pt-2 border-t border-neutral-200 dark:border-white/[0.08] flex-wrap">
                      {canEditPlanVehiculoDetalle(user) && (
                        <button
                          onClick={() => onEditarDetalle(plan, detalle)}
                          className="text-xs px-2 py-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          title="Editar detalles del servicio"
                        >
                          <Pencil className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Editar
                        </button>
                      )}
                      {canChangePlanVehiculoDetalleStatus(user) && (
                        <button
                          onClick={() => onCambiarEstadoDetalle(detalle)}
                          className="text-xs px-2 py-1 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
                          title="Cambiar estado del servicio"
                        >
                          <RefreshCw className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Estado
                        </button>
                      )}
                      {canDeletePlanVehiculoDetalle(user) && (
                        <button
                          onClick={() => handleEliminarDetalle(detalle)}
                          className="text-xs px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Eliminar detalle (no se puede deshacer)"
                        >
                          <Trash2 className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-2 p-6 border-t border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-carbon-800">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 dark:border-white/[0.08] rounded-lg text-carbon-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-carbon-700 font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
export default PlanVehiculoDetalleModal
