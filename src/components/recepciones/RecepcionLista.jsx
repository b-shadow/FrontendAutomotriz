/**
 * Tabla de recepciones registradas (historial)
 */
export default function RecepcionLista({ recepciones }) {
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short',
      day: 'numeric', hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getNivelCombustibleLabel = (nivel) => {
    const labels = {
      '1/4': '1/4 tanque',
      '1/2': '1/2 tanque',
      '3/4': '3/4 tanque',
      LLENO: 'Lleno',
    }
    return labels[nivel] || nivel
  }

  const getNivelCombustibleColor = (nivel) => {
    switch (nivel) {
      case '1/4':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case '1/2':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case '3/4':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case 'LLENO':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      default:
        return 'bg-neutral-100 dark:bg-carbon-800 text-carbon-700 dark:text-neutral-300'
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200/60 dark:border-white/[0.06] bg-neutral-50 dark:bg-carbon-800">
            <th className="px-4 py-3 text-left font-semibold text-carbon-700 dark:text-neutral-300">Vehiculo</th>
            <th className="px-4 py-3 text-left font-semibold text-carbon-700 dark:text-neutral-300">Cliente</th>
            <th className="px-4 py-3 text-right font-semibold text-carbon-700 dark:text-neutral-300">Km ingreso</th>
            <th className="px-4 py-3 text-center font-semibold text-carbon-700 dark:text-neutral-300">Combustible</th>
            <th className="px-4 py-3 text-left font-semibold text-carbon-700 dark:text-neutral-300">Asesor</th>
            <th className="px-4 py-3 text-left font-semibold text-carbon-700 dark:text-neutral-300">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200/60 dark:divide-white/[0.06]">
          {recepciones.map((recepcion) => (
            <tr key={recepcion.id} className="hover:bg-neutral-50 dark:hover:bg-carbon-800/50 transition">
              <td className="px-4 py-3">
                <div>
                  <p className="font-semibold text-carbon-900 dark:text-white">{recepcion.vehiculo_placa}</p>
                  <p className="text-carbon-600 dark:text-neutral-400 text-xs">{recepcion.vehiculo_marca_modelo}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-carbon-900 dark:text-white">{recepcion.cliente_nombre}</td>
              <td className="px-4 py-3 text-right font-semibold text-carbon-900 dark:text-white">
                {recepcion.kilometraje_ingreso.toLocaleString('es-ES')} km
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getNivelCombustibleColor(recepcion.nivel_combustible)}`}>
                  {getNivelCombustibleLabel(recepcion.nivel_combustible)}
                </span>
              </td>
              <td className="px-4 py-3 text-carbon-900 dark:text-white text-sm">{recepcion.asesor_nombre}</td>
              <td className="px-4 py-3 text-carbon-600 dark:text-neutral-400 text-xs">{formatFecha(recepcion.fecha_recepcion)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {recepciones.length === 0 && (
        <div className="text-center py-8 text-carbon-500 dark:text-neutral-400">No hay recepciones para mostrar</div>
      )}
    </div>
  )
}
