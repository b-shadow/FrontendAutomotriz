/**
 * CitaModalReprogramar - Modal for rescheduling existing citas
 */
import { AlertTriangle } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react'
import { useTenant } from '../../hooks/useTenant'
import citasService from '../../services/citasService'
import espaciosTrabajoService from '../../services/espaciosTrabajoService'

const HORAS_BLOQUE = Array.from({ length: 48 }, (_, i) => {
  const minutos = i * 30
  const h = String(Math.floor(minutos / 60)).padStart(2, '0')
  const m = String(minutos % 60).padStart(2, '0')
  return `${h}:${m}`
})

const obtenerFechaHoy = () => new Date().toISOString().split('T')[0]

const CitaModalReprogramar = ({ cita, onClose, onSuccess }) => {
  const { tenantSlug } = useTenant()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fecha_hora_inicio_programada: '',
    observaciones_cliente: '',
    espacio_trabajo_id: '',
  })
  const [espacios, setEspacios] = useState([])
  const [bloquesDisponibles, setBloquesDisponibles] = useState([])
  const [loadingBloques, setLoadingBloques] = useState(false)
  const [loadingEspacios, setLoadingEspacios] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const duracionRequerida = Number(cita?.duracion_estimada_min || 0)

  const bloquesAgrupadosPorFecha = useMemo(() => {
    const grouped = {}
    for (const b of bloquesDisponibles) {
      if (!grouped[b.fecha]) grouped[b.fecha] = []
      grouped[b.fecha].push(b)
    }
    return grouped
  }, [bloquesDisponibles])

  const valoresInicioDisponibles = useMemo(
    () => new Set(bloquesDisponibles.map((b) => `${b.fecha}T${b.hora}:00`)),
    [bloquesDisponibles]
  )

  const horaSeleccionadaValida = formData.espacio_trabajo_id
    ? valoresInicioDisponibles.has(formData.fecha_hora_inicio_programada)
    : Boolean(formData.fecha_hora_inicio_programada)

  useEffect(() => {
    const cargarEspacios = async () => {
      try {
        setLoadingEspacios(true)
        const data = await espaciosTrabajoService.listarEspacios(tenantSlug, { page_size: 1000 })
        const espaciosList = data.espacios || []
        setEspacios(espaciosList)

        const espacioActual = cita?.espacios_segmentos?.[0]?.espacio_trabajo || ''
        if (espacioActual) {
          setFormData((prev) => ({ ...prev, espacio_trabajo_id: espacioActual }))
        }
      } catch (err) {
        console.error('Error cargando espacios:', err)
      } finally {
        setLoadingEspacios(false)
      }
    }

    if (tenantSlug) cargarEspacios()
  }, [tenantSlug, cita])

  useEffect(() => {
    const cargarBloques = async () => {
      if (!formData.espacio_trabajo_id || duracionRequerida <= 0) {
        setBloquesDisponibles([])
        return
      }

      const fecha = formData.fecha_hora_inicio_programada.split('T')[0] || obtenerFechaHoy()
      setLoadingBloques(true)
      try {
        const data = await citasService.obtenerBloquesDisponibles(tenantSlug, {
          espacio_trabajo_id: formData.espacio_trabajo_id,
          fecha,
          duracion_min: duracionRequerida,
          horizonte_dias: 30,
          max_resultados: 80,
        })
        setBloquesDisponibles(data.bloques_disponibles || [])
      } catch (err) {
        console.error('Error cargando bloques disponibles:', err)
        setBloquesDisponibles([])
      } finally {
        setLoadingBloques(false)
      }
    }

    const timer = setTimeout(cargarBloques, 350)
    return () => clearTimeout(timer)
  }, [formData.espacio_trabajo_id, formData.fecha_hora_inicio_programada, duracionRequerida, tenantSlug])

  useEffect(() => {
    if (!formData.espacio_trabajo_id) return
    if (bloquesDisponibles.length === 0) return

    if (!valoresInicioDisponibles.has(formData.fecha_hora_inicio_programada)) {
      const primero = bloquesDisponibles[0]
      setFormData((prev) => ({
        ...prev,
        fecha_hora_inicio_programada: `${primero.fecha}T${primero.hora}:00`,
      }))
    }
  }, [bloquesDisponibles, formData.espacio_trabajo_id, formData.fecha_hora_inicio_programada, valoresInicioDisponibles])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const fechaLocal = formData.fecha_hora_inicio_programada

      await citasService.reprogramarCita(tenantSlug, cita.id, {
        fecha_hora_inicio_programada: fechaLocal,
        observaciones_cliente: formData.observaciones_cliente,
        espacio_trabajo_id: formData.espacio_trabajo_id || undefined,
      })

      await citasService.refrescarCitaCanonica(tenantSlug, cita.id)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al reprogramar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Reprogramar Cita</h2>
          <button onClick={onClose} className="text-carbon-500 hover:text-carbon-700 text-2xl">×</button>
        </div>

        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="bg-neutral-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Cita actual</h3>
          <div className="text-sm space-y-1">
            <p><strong>Vehículo:</strong> {cita.vehiculo.placa}</p>
            <p><strong>Cliente:</strong> {cita.cliente.nombre_completo || cita.cliente.nombres}</p>
            <p><strong>Inicio actual:</strong> {new Date(cita.fecha_hora_inicio_programada).toLocaleString()}</p>
            <p><strong>Fin actual:</strong> {cita.fecha_hora_fin_programada ? new Date(cita.fecha_hora_fin_programada).toLocaleString() : 'N/A'}</p>
            <p><strong>Duración:</strong> {duracionRequerida} min</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Nueva intención de programación</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Espacio de trabajo</label>
              <select
                value={formData.espacio_trabajo_id || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, espacio_trabajo_id: e.target.value || '' }))}
                disabled={loadingEspacios}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Asignación automática</option>
                {espacios.map((espacio) => (
                  <option key={espacio.id} value={espacio.id}>{espacio.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fecha deseada</label>
              <input
                type="date"
                value={formData.fecha_hora_inicio_programada.split('T')[0] || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fecha_hora_inicio_programada: `${e.target.value}T${formData.fecha_hora_inicio_programada.split('T')[1] || '09:00:00'}`,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Hora deseada</label>
              <select
                value={formData.espacio_trabajo_id ? (formData.fecha_hora_inicio_programada || '') : (formData.fecha_hora_inicio_programada.split('T')[1]?.slice(0, 5) || '')}
                onChange={(e) => {
                  if (formData.espacio_trabajo_id) {
                    setFormData((prev) => ({ ...prev, fecha_hora_inicio_programada: e.target.value || '' }))
                    return
                  }
                  setFormData((prev) => ({
                    ...prev,
                    fecha_hora_inicio_programada: `${formData.fecha_hora_inicio_programada.split('T')[0] || obtenerFechaHoy()}T${e.target.value}:00`,
                  }))
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecciona hora</option>
                {formData.espacio_trabajo_id
                  ? Object.entries(bloquesAgrupadosPorFecha).map(([fecha, bloques]) => (
                      <optgroup key={fecha} label={fecha}>
                        {bloques.map((b) => (
                          <option key={b.inicio} value={`${b.fecha}T${b.hora}:00`}>{b.hora}</option>
                        ))}
                      </optgroup>
                    ))
                  : HORAS_BLOQUE.map((hora) => (
                      <option key={hora} value={hora}>{hora}</option>
                    ))}
              </select>
              {loadingBloques && <p className="text-xs text-blue-600 mt-1">Consultando bloques disponibles...</p>}
              {formData.espacio_trabajo_id && !loadingBloques && bloquesDisponibles.length === 0 && (
                <p className="text-xs text-yellow-700 mt-1">No hay bloques disponibles para esa fecha y duración.</p>
              )}
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg text-sm">
              <strong><AlertTriangle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Backend calculará:</strong> Hora fin, fragmentación, segmentos y estado final.
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-carbon-600">Cancelar</button>
              <button
                onClick={() => setStep(2)}
                disabled={!horaSeleccionadaValida}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Confirmar reprogramación</h3>

            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <p><strong>Nueva intención:</strong> {new Date(formData.fecha_hora_inicio_programada).toLocaleString()}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Motivo/Observaciones (opcional)</label>
              <textarea
                value={formData.observaciones_cliente}
                onChange={(e) => setFormData((prev) => ({ ...prev, observaciones_cliente: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                rows="3"
                placeholder="Por qué se reprograma..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-carbon-600">Anterior</button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'Reprogramando...' : 'Reprogramar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CitaModalReprogramar
