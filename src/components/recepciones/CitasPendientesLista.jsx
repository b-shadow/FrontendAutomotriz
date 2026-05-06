/**
 * Tabla de citas pendientes de recibir
 */
export default function CitasPendientesLista({ citas, onRegistrarRecepcion }) {
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric', month : 'short',
      day: 'numeric', hour : '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200/60 dark:border-white/[0.06] bg-neutral-50 dark:bg-carbon-800">
            <th className="px-4 py-3 text-left font-semibold text-carbon-700 dark:text-neutral-300">Vehiculo</th>
            <th className="px-4 py-3 text-left font-semibold text-carbon-700 dark:text-neutral-300">Cliente</th>
            <th className="px-4 py-3 text-left font-semibold text-carbon-700 dark:text-neutral-300">Programado</th>
            <th className="px-4 py-3 text-center font-semibold text-carbon-700 dark:text-neutral-300">Servicios</th>
            <th className="px-4 py-3 text-center font-semibold text-carbon-700 dark:text-neutral-300">Accion</th>
          </tr>
        </thead>
        <tbody>
          {citas.map((cita) => (
            <tr
              key={cita.id}
              className="border-b border-neutral-200/60 dark:border-white/[0.06] hover:bg-neutral-50 dark:hover:bg-carbon-800/50 transition"
            >
              <td className="px-4 py-3">
                <p className="font-semibold text-carbon-900 dark:text-white">{cita.vehiculo_placa || '-'}</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-carbon-900 dark:text-white font-medium">{cita.cliente_nombres || '-'}</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-carbon-900 dark:text-white">
                  {cita.fecha_hora_inicio_programada ? formatFecha(cita.fecha_hora_inicio_programada) : '-'}
                </p>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-block bg-primary-100 dark:bg-primary-900/25 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700/40 px-3 py-1 rounded-full text-xs font-semibold">
                  {cita.servicios_count || 0} servicio{cita.servicios_count !== 1 ? 's' : ''}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  onClick={() => onRegistrarRecepcion(cita)}
                  className="btn btn-primary btn-small inline-flex items-center gap-2"
                >
                  Recibir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
