/**
 * CitaModalEditar - Modal for editing existing citas
 * 
 * Backend is sole authority for final schedule calculation.
 * Frontend captures intention, sends to backend, reconsults for canonical result.
 */
import React, { useState } from 'react'
import { useTenant } from '../../hooks/useTenant'
import citasService from '../../services/citasService'

const CitaModalEditar = ({ cita, onClose, onSuccess }) => {
  const { tenantSlug } = useTenant()

  const [formData, setFormData] = useState({
    observaciones_cliente: cita?.observaciones_cliente || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await citasService.editarCita(tenantSlug, cita.id, formData)
      
      // Reconsulta para obtener estado canónico
      await citasService.refrescarCitaCanonica(tenantSlug, cita.id)

      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al editar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Editar Cita</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg mb-4 text-sm space-y-1">
          <p>
            <strong>Vehículo:</strong> {cita?.vehiculo?.placa}
          </p>
          <p>
            <strong>Estado:</strong> {cita?.estado}
          </p>
          <p>
            <strong>Inicio:</strong>{' '}
            {new Date(cita?.fecha_hora_inicio_programada).toLocaleString()}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Observaciones
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
            rows="4"
            placeholder="Notas adicionales..."
          />
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CitaModalEditar
