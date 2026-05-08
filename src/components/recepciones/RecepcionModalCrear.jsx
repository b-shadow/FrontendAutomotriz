import { useState } from 'react'

export default function RecepcionModalCrear({ cita, onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    cita_id: cita.id,
    kilometraje_ingreso: '',
    nivel_combustible: '1/2',
    observaciones: '',
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validar = () => {
    const newErrors = {}
    if (!formData.kilometraje_ingreso || Number(formData.kilometraje_ingreso) <= 0) {
      newErrors.kilometraje_ingreso = 'Kilometraje debe ser un número positivo'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validar()) return
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-xl dark:border-white/[0.08] dark:bg-carbon-900">
        <div className="sticky top-0 flex items-center justify-between border-b border-red-700 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Registrar Recepción</h2>
          <button onClick={onClose} className="rounded p-1 text-white transition hover:bg-red-700">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="rounded-lg bg-neutral-100 p-4 dark:bg-carbon-800">
            <h3 className="mb-3 font-semibold text-carbon-900 dark:text-white">Información de la Cita</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-carbon-600 dark:text-neutral-400">Vehículo</p>
                <p className="font-medium text-carbon-900 dark:text-white">{cita.vehiculo_placa || '—'}</p>
              </div>
              <div>
                <p className="text-carbon-600 dark:text-neutral-400">Cliente</p>
                <p className="font-medium text-carbon-900 dark:text-white">{cita.cliente_nombres || '—'}</p>
              </div>
              <div>
                <p className="text-carbon-600 dark:text-neutral-400">Fecha Programada</p>
                <p className="font-medium text-carbon-900 dark:text-white">
                  {cita.fecha_hora_inicio_programada
                    ? new Date(cita.fecha_hora_inicio_programada).toLocaleString('es-ES')
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-carbon-600 dark:text-neutral-400">Servicios</p>
                <div className="space-y-1">
                  {cita.servicios_nombres && cita.servicios_nombres.length > 0 ? (
                    <ul className="list-inside list-disc">
                      {cita.servicios_nombres.map((servicio, idx) => (
                        <li key={idx} className="text-sm font-medium text-carbon-900 dark:text-white">{servicio}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm font-medium text-carbon-900 dark:text-white">—</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-carbon-900 dark:text-white">Datos de Recepción</h3>

            <div>
              <label className="mb-2 block text-sm font-medium text-carbon-700 dark:text-neutral-300">Kilometraje de Ingreso *</label>
              <input
                type="number"
                name="kilometraje_ingreso"
                value={formData.kilometraje_ingreso}
                onChange={handleChange}
                placeholder="Ej: 145000"
                className={`w-full rounded-lg border px-4 py-2 text-carbon-900 placeholder-neutral-500 dark:bg-carbon-800 dark:text-white dark:placeholder-neutral-400 ${
                  errors.kilometraje_ingreso ? 'border-red-500 dark:border-red-600' : 'border-neutral-300 dark:border-white/[0.08]'
                }`}
              />
              {errors.kilometraje_ingreso && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.kilometraje_ingreso}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-carbon-700 dark:text-neutral-300">Nivel de Combustible *</label>
              <select
                name="nivel_combustible"
                value={formData.nivel_combustible}
                onChange={handleChange}
                className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-carbon-900 dark:border-white/[0.08] dark:bg-carbon-800 dark:text-white"
              >
                <option value="1/4">1/4 de tanque</option>
                <option value="1/2">1/2 de tanque</option>
                <option value="3/4">3/4 de tanque</option>
                <option value="LLENO">Lleno</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-carbon-700 dark:text-neutral-300">Observaciones Adicionales</label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Notas adicionales (opcional)"
                rows="2"
                className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-2 text-carbon-900 placeholder-neutral-500 dark:border-white/[0.08] dark:bg-carbon-800 dark:text-white dark:placeholder-neutral-400"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-neutral-200 pt-6 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-carbon-700 transition hover:bg-neutral-100 disabled:opacity-50 dark:border-white/[0.08] dark:text-neutral-300 dark:hover:bg-carbon-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Guardando...
                </>
              ) : (
                <>✓ Confirmar Recepción</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
