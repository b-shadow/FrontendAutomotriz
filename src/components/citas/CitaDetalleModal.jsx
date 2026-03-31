/**
 * CitaDetalleModal - Display canonical cita data from backend
 * 
 * RULE: Shows ONLY what backend returned. Never reconstructed locally.
 * Backend is authority for:
 * - Real start/end times
 * - Final state (PROGRAMADA, PENDIENTE_APROBACION, etc)
 * - Segments and their dates/times
 * - Fragmentation and multi-day info
 */
import React from 'react'

const CitaDetalleModal = ({ cita, onClose }) => {
  const estadoColorMap = {
    PROGRAMADA: 'bg-green-100 text-green-800',
    PENDIENTE_APROBACION: 'bg-yellow-100 text-yellow-800',
    CANCELADA: 'bg-red-100 text-red-800',
    FINALIZADA: 'bg-blue-100 text-blue-800',
    NO_SHOW: 'bg-orange-100 text-orange-800',
  }

  const colorClass = estadoColorMap[cita?.estado] || 'bg-gray-100 text-gray-800'

  // Calculate total duration from segments
  const calcularDuracionTotal = () => {
    if (!cita?.espacios_segmentos || cita.espacios_segmentos.length === 0) {
      return 'N/A'
    }
    const segmentos = cita.espacios_segmentos
    const inicioPrimero = new Date(segmentos[0].inicio_programado)
    const finUltimo = new Date(segmentos[segmentos.length - 1].fin_programado)
    const duracionMs = finUltimo - inicioPrimero
    const duracionMin = Math.round(duracionMs / 1000 / 60)
    return `${duracionMin} min`
  }

  // Group segments by date
  const agruparSegmentosPorFecha = () => {
    if (!cita?.espacios_segmentos) return {}
    const grupos = {}
    cita.espacios_segmentos.forEach((seg) => {
      const fecha = seg.inicio_programado.split('T')[0]
      if (!grupos[fecha]) grupos[fecha] = []
      grupos[fecha].push(seg)
    })
    return grupos
  }

  const segmentosPorFecha = agruparSegmentosPorFecha()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Detalle de Cita</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {/* Info básica */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 uppercase font-semibold">Vehículo</p>
            <p className="text-lg font-semibold">{cita?.vehiculo?.placa}</p>
            <p className="text-sm text-gray-600">
              {cita?.vehiculo?.marca} {cita?.vehiculo?.modelo}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 uppercase font-semibold">Cliente</p>
            <p className="text-lg font-semibold">
              {cita?.cliente?.nombre_completo || cita?.cliente?.nombres}
            </p>
            <p className="text-sm text-gray-600">{cita?.cliente?.email}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 uppercase font-semibold">Estado</p>
            <div className="mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
                {cita?.estado}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-xs text-gray-500 uppercase font-semibold">Duración Total</p>
            <p className="text-lg font-semibold">{calcularDuracionTotal()}</p>
          </div>
        </div>

        {/* Intention */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm font-semibold text-blue-900 mb-2">Intención Solicitada</p>
          <p className="text-sm text-blue-800">
            Inicio: {new Date(cita?.fecha_hora_inicio_programada).toLocaleString()}
          </p>
        </div>

        {/* Segments (canonical backend data) */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4">Programación Final (Backend Canonical)</h3>

          {Object.entries(segmentosPorFecha).map(([fecha, segmentos]) => (
            <div key={fecha} className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                {new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <div className="space-y-2">
                {segmentos.map((seg) => (
                  <div key={seg.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {seg.espacio_trabajo?.nombre || 'Espacio N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(seg.inicio_programado).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          –{' '}
                          {new Date(seg.fin_programado).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-500 uppercase">
                          {seg.tipo_segmento}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {(!cita?.espacios_segmentos || cita.espacios_segmentos.length === 0) && (
            <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800">
              ⚠️ No hay segmentos definidos aún. Backend estará calculando.
            </div>
          )}
        </div>

        {/* Services */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-4">Servicios</h3>
          {cita?.detalles && cita.detalles.length > 0 ? (
            <div className="space-y-2">
              {cita.detalles.map((detalle, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium">
                      {detalle.servicio_nombre || 'Servicio N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {detalle.tiempo_estandar_min || '0'} min
                    </p>
                  </div>
                  <span className="text-gray-600 font-medium">
                    ${detalle.precio_referencial || '0'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600">
              ℹ️ Sin servicios registrados
            </div>
          )}
        </div>

        {/* Observations */}
        {cita?.observaciones_cliente && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Observaciones</h3>
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
              {cita.observaciones_cliente}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
          <p>
            <strong>ID:</strong> {cita?.id}
          </p>
          <p>
            <strong>Creada:</strong> {new Date(cita?.created_at).toLocaleString()}
          </p>
          {cita?.updated_at && (
            <p>
              <strong>Última actualización:</strong> {new Date(cita.updated_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Close button */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default CitaDetalleModal
