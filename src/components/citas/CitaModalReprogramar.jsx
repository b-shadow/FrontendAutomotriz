/**
 * CitaModalReprogramar - Modal for rescheduling existing citas
 * 
 * Same principle as Create:
 * - Capture new schedule intention
 * - Send to backend
 * - Backend recalculates and persists canonical state
 * - Reconsulta for canonical result
 */
import React, { useState } from 'react'
import { useTenant } from '../../hooks/useTenant'
import citasService from '../../services/citasService'

const CitaModalReprogramar = ({ cita, onClose, onSuccess }) => {
  const { tenantSlug } = useTenant()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fecha_hora_inicio_programada: '',
    observaciones_cliente: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // NO convertir a UTC - enviar hora local exacta
      const fechaLocal = formData.fecha_hora_inicio_programada

      // Send reprogramming request
      await citasService.reprogramarCita(tenantSlug, cita.id, {
        fecha_hora_inicio_programada: fechaLocal,
        observaciones_cliente: formData.observaciones_cliente,
      })

      // Reconsulta for canonical state
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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Current schedule info */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Cita actual</h3>
          <div className="text-sm space-y-1">
            <p>
              <strong>Vehículo:</strong> {cita?.vehiculo?.placa}
            </p>
            <p>
              <strong>Cliente:</strong> {cita?.cliente?.nombre_completo || cita?.cliente?.nombres}
            </p>
            <p>
              <strong>Inicio actual:</strong>{' '}
              {new Date(cita?.fecha_hora_inicio_programada).toLocaleString()}
            </p>
            <p>
              <strong>Fin actual:</strong>{' '}
              {cita?.fecha_hora_fin_programada
                ? new Date(cita.fecha_hora_fin_programada).toLocaleString()
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Step 1: New schedule */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Nueva intención de programación</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Fecha deseada</label>
              <input
                type="date"
                value={formData.fecha_hora_inicio_programada?.split('T')[0] || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fecha_hora_inicio_programada: `${e.target.value}T${
                      formData.fecha_hora_inicio_programada?.split('T')[1] || '09:00:00'
                    }`,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Hora deseada</label>
              <input
                type="time"
                value={
                  formData.fecha_hora_inicio_programada?.split('T')[1]?.slice(0, 5) || '09:00'
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    fecha_hora_inicio_programada: `${
                      formData.fecha_hora_inicio_programada?.split('T')[0] || '2026-03-25'
                    }T${e.target.value}:00`,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg text-sm">
              <strong>⚠️ Backend calculará:</strong> Hora fin, fragmentación, segmentos y estado final.
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-gray-600">
                Cancelar
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!formData.fecha_hora_inicio_programada}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Confirmar reprogramación</h3>

            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <p>
                <strong>Nueva intención:</strong>{' '}
                {new Date(formData.fecha_hora_inicio_programada).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Motivo/Observaciones (opcional)
              </label>
              <textarea
                value={formData.observaciones_cliente}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    observaciones_cliente: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                rows="3"
                placeholder="Por qué se reprograma..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-600">
                Anterior
              </button>
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
