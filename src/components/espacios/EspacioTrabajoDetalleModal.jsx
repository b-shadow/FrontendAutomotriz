import { X } from 'lucide-react';
/**
 * EspacioTrabajoDetalleModal.jsx - Modal para ver detalle completo de un espacio
 *
 * Props:
 * - espacio: object - Datos del espacio
 * - horarios: array - Horarios del espacio
 * - isOpen: boolean
 * - onClose: function
 * - loading: boolean
 */

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const EspacioTrabajoDetalleModal = ({ espacio, horarios = [], isOpen, onClose, loading }) => {
  if (!isOpen || !espacio) return null

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric', month : 'short',
      day: 'numeric', hour : '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return '—'
    const date = new Date(`2000-01-01T${timeString}`)
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-carbon-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-neutral-200 dark:border-white/[0.08] bg-white dark:bg-carbon-800">
          <h2 className="text-xl font-bold text-carbon-900 dark:text-white">
            {espacio.nombre}
          </h2>
          <button
            onClick={onClose}
            className="text-carbon-500 hover:text-carbon-700 dark:text-neutral-400 dark:hover:text-neutral-200 text-2xl leading-none"
          >
            <X className="inline-block mx-1 text-current" size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Información General */}
          <div>
            <h3 className="text-sm font-semibold text-carbon-700 dark:text-neutral-300 uppercase mb-3">
              Información General
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-carbon-500 dark:text-neutral-400">Código</p>
                <p className="text-sm font-medium text-carbon-900 dark:text-white">
                  {espacio.codigo || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-carbon-500 dark:text-neutral-400">Tipo</p>
                <p className="text-sm font-medium text-carbon-900 dark:text-white">
                  {espacio.tipo_display || espacio.tipo || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-carbon-500 dark:text-neutral-400">Estado</p>
                <p className="text-sm font-medium">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      espacio.estado === 'DISPONIBLE' ?
                         'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : espacio.estado === 'OCUPADO' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}
                  >
                    {espacio.estado_display || espacio.estado || '—'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-carbon-500 dark:text-neutral-400">Activo</p>
                <p className="text-sm font-medium">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      espacio.activo ?
                         'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : 'bg-neutral-100 dark:bg-carbon-700 text-carbon-600 dark:text-neutral-400'
                    }`}
                  >
                    {espacio.activo ? 'Sí' : 'No'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {espacio.observaciones && (
            <div>
              <h3 className="text-sm font-semibold text-carbon-700 dark:text-neutral-300 uppercase mb-2">
                Observaciones
              </h3>
              <p className="text-sm text-carbon-700 dark:text-neutral-300 bg-neutral-50 dark:bg-carbon-700/50 p-3 rounded">
                {espacio.observaciones}
              </p>
            </div>
          )}

          {/* Fechas */}
          <div>
            <h3 className="text-sm font-semibold text-carbon-700 dark:text-neutral-300 uppercase mb-3">
              Auditoría
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-carbon-500 dark:text-neutral-400">Creado</p>
                <p className="text-sm text-carbon-900 dark:text-white">
                  {formatDate(espacio.created_at)}
                </p>
              </div>
              <div>
                <p className="text-xs text-carbon-500 dark:text-neutral-400">Actualizado</p>
                <p className="text-sm text-carbon-900 dark:text-white">
                  {formatDate(espacio.updated_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Horarios */}
          <div>
            <h3 className="text-sm font-semibold text-carbon-700 dark:text-neutral-300 uppercase mb-3">
              Horarios
            </h3>

            {loading ? (
              <div className="text-center py-4">
                <p className="text-sm text-carbon-600 dark:text-neutral-400">Cargando horarios...</p>
              </div>
          ) : horarios && horarios.length > 0 ? (
              <div className="space-y-2">
                {horarios.map((horario) => (
                  <div
                    key={horario.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-carbon-700/50 rounded border border-neutral-200 dark:border-white/[0.08]"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-carbon-900 dark:text-white">
                        {DIAS_SEMANA[horario.dia_semana]}
                      </p>
                      <p className="text-xs text-carbon-500 dark:text-neutral-400">
                        {formatTime(horario.hora_inicio)} — {formatTime(horario.hora_fin)}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        horario.activo ?
                           'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : 'bg-neutral-200 dark:bg-carbon-600 text-carbon-600 dark:text-neutral-400'
                      }`}
                    >
                      {horario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>
              ) : (
              <p className="text-sm text-carbon-500 dark:text-neutral-400 py-3">
                No hay horarios registrados
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
