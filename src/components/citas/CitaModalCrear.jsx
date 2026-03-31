/**
 * CitaModalCrear - Modal for creating new citas
 * 
 * Flujo:
 * 1. Usuario selecciona vehículo → cliente se deriva automáticamente
 * 2. Usuario elige servicios (se calcula duración estimada)
 * 3. Usuario ingresa intención: fecha, hora, espacio
 * 4. Resumen con aclaración que backend calcula agenda final
 * 5. Envío → Backend calcula y persiste → Reconsulta → Mostrar resultado canónico
 * 
 * REGLA: Backend es autoridad única sobre segmentos, fragmentación, estado
 */
import React, { useState, useEffect } from 'react'
import { useTenant } from '../../hooks/useTenant'
import citasService from '../../services/citasService'
import vehiculosService from '../../services/vehiculosService'
import planVehiculoService from '../../services/planVehiculoService'
import espaciosTrabajoService from '../../services/espaciosTrabajoService'

const CitaModalCrear = ({ onClose, onSuccess }) => {
  const { tenantSlug } = useTenant()

  // Step control
  const [step, setStep] = useState(1)

  // Form data
  const [formData, setFormData] = useState({
    vehiculo_id: null,
    cliente_id: null,
    plan_servicio_id: null,
    servicios_plan_detalle_ids: [],
    fecha_hora_inicio_programada: '',
    espacio_trabajo_id: null,
    observaciones_cliente: '',
    canal_origen: 'CLIENTE',  // Always CLIENTE from frontend (users or asesor on behalf)
  })

  // Data for selectors
  const [vehiculos, setVehiculos] = useState([])
  const [espacios, setEspacios] = useState([])
  const [serviciosDelPlan, setServiciosDelPlan] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Calculated values (UX only, not authority)
  const [duracionEstimada, setDuracionEstimada] = useState(0)

  // Preview data from backend validation endpoint
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Real-time espacio availability validation (Step 3)
  const [espacioValidation, setEspacioValidation] = useState(null)
  const [espacioValidationLoading, setEspacioValidationLoading] = useState(false)

  // Load initial data
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)
        setError(null)

        const resVehiculos = await vehiculosService.listarVehiculos(tenantSlug, {
          page_size: 1000,
        })
        const vehiculosList = resVehiculos.data || resVehiculos.results || []
        setVehiculos(vehiculosList)
        console.debug('[CitaModalCrear] Vehículos cargados:', vehiculosList.length)

        // Cargar espacios de trabajo
        const resEspacios = await espaciosTrabajoService.listarEspacios(tenantSlug, {
          page_size: 1000,
        })
        console.debug('[CitaModalCrear] Response de espacios:', resEspacios)
        const espaciosList = resEspacios?.espacios || []
        setEspacios(espaciosList)
        console.debug('[CitaModalCrear] Espacios establecidos:', {
          count: espaciosList.length,
          espacios: espaciosList.map((e) => ({ id: e.id, nombre: e.nombre })),
        })
      } catch (err) {
        console.error('❌ Error cargando datos iniciales:', err)
        setError('Error al cargar datos iniciales')
      } finally {
        setLoading(false)
      }
    }
    if (tenantSlug) cargarDatos()
  }, [tenantSlug])

  // Load preview when fecha or servicios change
  useEffect(() => {
    const cargarPreview = async () => {
      // Only call if we have fecha, vehiculo, and servicios
      if (!formData.fecha_hora_inicio_programada || !formData.vehiculo_id || formData.servicios_plan_detalle_ids.length === 0) {
        setPreview(null)
        return
      }

      setPreviewLoading(true)
      try {
        // NO convertir a UTC - enviar la hora exacta que el usuario ingresa (LOCAL)
        // El backend también está en La Paz, así que entiende hora local directamente
        const fechaLocal = formData.fecha_hora_inicio_programada

        console.debug('[CitaModalCrear Preview] Enviando fecha sin conversión:', {
          fechaLocal,
          payload: {
            vehiculo_id: formData.vehiculo_id,
            servicios_ids: formData.servicios_plan_detalle_ids,
            fecha_hora_inicio: fechaLocal,
            espacio_trabajo_id: formData.espacio_trabajo_id || undefined,
          }
        })

        const response = await citasService.previewIntencion(tenantSlug, {
          vehiculo_id: formData.vehiculo_id,
          servicios_ids: formData.servicios_plan_detalle_ids,
          fecha_hora_inicio: fechaLocal,
          espacio_trabajo_id: formData.espacio_trabajo_id || undefined,
        })

        console.debug('[CitaModalCrear Preview] Respuesta:', response)
        setPreview(response)
      } catch (err) {
        console.error('Error cargando preview:', err)
        setPreview({
          es_valida: false,
          mensajes: ['Error validando la intención. Intenta de nuevo.'],
        })
      } finally {
        setPreviewLoading(false)
      }
    }

    // Debounce: esperar 500ms después de último cambio
    const timer = setTimeout(() => {
      cargarPreview()
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.fecha_hora_inicio_programada, formData.servicios_plan_detalle_ids, formData.vehiculo_id, formData.espacio_trabajo_id, tenantSlug])

  // Real-time validation of espacio availability (Step 3)
  // Only validate if espacio is selected AND we have fecha + hora
  useEffect(() => {
    const validarDisponibilidad = async () => {
      // Only validate if:
      // 1. User selected an espacio
      // 2. We have a fecha_hora
      // 3. We have calculated duration from servicios
      if (!formData.espacio_trabajo_id || !formData.fecha_hora_inicio_programada || duracionEstimada === 0) {
        setEspacioValidation(null)
        return
      }

      setEspacioValidationLoading(true)
      try {
        const response = await citasService.validarDisponibilidadEspacio(tenantSlug, {
          espacio_trabajo_id: formData.espacio_trabajo_id,
          fecha_hora_inicio: formData.fecha_hora_inicio_programada,
          duracion_requerida_min: duracionEstimada,
        })

        console.debug('[CitaModalCrear] Validación disponibilidad espacio:', response)
        setEspacioValidation(response)
      } catch (err) {
        console.error('Error validando disponibilidad de espacio:', err)
        setEspacioValidation({
          disponible: false,
          error: err.response?.data?.detail || 'Error al validar disponibilidad',
        })
      } finally {
        setEspacioValidationLoading(false)
      }
    }

    // Debounce: esperar 500ms después de último cambio
    const timer = setTimeout(() => {
      validarDisponibilidad()
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.espacio_trabajo_id, formData.fecha_hora_inicio_programada, duracionEstimada, tenantSlug])

  // When vehicle changes
  const handleVehiculoChange = async (vehiculoId) => {
    setFormData((prev) => ({
      ...prev,
      vehiculo_id: vehiculoId,
      cliente_id: null,
      plan_servicio_id: null,
      servicios_plan_detalle_ids: [],
      // NO reseteamos espacio_trabajo_id para que el usuario pueda pre-seleccionar
    }))

    const vehiculo = vehiculos.find((v) => v.id === vehiculoId)
    if (vehiculo) {
      // Derive customer automatically
      setFormData((prev) => ({
        ...prev,
        cliente_id: vehiculo.propietario.id,
        plan_servicio_id: vehiculo.plan_servicio_id,  // ← ASIGNAR EL PLAN
      }))

      // Load plane for this vehicle
      try {
        if (vehiculo.plan_servicio_id) {
          const resPlan = await planVehiculoService.obtenerPlanVehiculo(
            tenantSlug,
            vehiculo.plan_servicio_id
          )
          setServiciosDelPlan(resPlan.detalles || [])
        } else {
          setServiciosDelPlan([])
        }
      } catch (err) {
        console.error('Error cargando plan:', err)
        setServiciosDelPlan([])
      }
    }
  }

  // When services change
  const handleServiciosChange = (servicioIds) => {
    setFormData((prev) => ({
      ...prev,
      servicios_plan_detalle_ids: servicioIds,
    }))

    // Calculate estimated duration (UX only, not authority)
    const duracion = servicioIds.reduce((sum, id) => {
      const servicio = serviciosDelPlan.find((s) => s.id === id)
      return sum + (servicio?.tiempo_estandar_min || 0)
    }, 0)
    setDuracionEstimada(duracion)
  }

  // Submit
  const handleSubmit = async () => {
    if (!formData.vehiculo_id || formData.servicios_plan_detalle_ids.length === 0) {
      setError('Completa vehículo y servicios')
      return
    }
    if (!formData.fecha_hora_inicio_programada) {
      setError('Indica fecha y hora deseada')
      return
    }

    setLoading(true)
    try {
      // NO convertir a UTC - enviar hora local exacta
      // Backend está en La Paz, entiende hora local
      const fechaLocal = formData.fecha_hora_inicio_programada

      // Construir payload - solo incluir espacio_trabajo_id si tiene valor
      const payload = {
        vehiculo_id: formData.vehiculo_id,
        cliente_id: formData.cliente_id,
        plan_servicio_id: formData.plan_servicio_id,
        servicios_plan_detalle_ids: formData.servicios_plan_detalle_ids,
        fecha_hora_inicio_programada: fechaLocal,
        observaciones_cliente: formData.observaciones_cliente,
        canal_origen: formData.canal_origen,
      }

      // Solo agregar espacio si se seleccionó uno
      if (formData.espacio_trabajo_id) {
        payload.espacio_trabajo_id = formData.espacio_trabajo_id
      }

      const response = await citasService.crearCita(tenantSlug, payload)
      
      // Reconsulta to get canonical state
      await citasService.refrescarCitaCanonica(tenantSlug, response.id)

      onSuccess()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error creando cita')
    } finally {
      setLoading(false)
    }
  }

  const vehiculoSeleccionado = vehiculos.find((v) => v.id === formData.vehiculo_id)
  const cliente = vehiculoSeleccionado?.propietario || vehiculoSeleccionado?.cliente

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Nueva Cita</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Step 1: Vehicle */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Paso 1: Vehículo</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Vehículo</label>
              <select
                value={formData.vehiculo_id || ''}
                onChange={(e) => handleVehiculoChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Selecciona vehículo</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} - {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            {cliente && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Cliente (derivado):</strong> {cliente.nombre_completo || cliente.nombres}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-gray-600">
                Cancelar
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!formData.vehiculo_id}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Services */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Paso 2: Servicios</h3>
            <div>
              <label className="block text-sm font-medium mb-2">
                Servicios a realizar
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {serviciosDelPlan.map((servicio) => {
                  // Verificar si el servicio tiene estado PROGRAMADO
                  const enUso = servicio.estado === 'PROGRAMADO'
                  return (
                    <label key={servicio.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.servicios_plan_detalle_ids.includes(servicio.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleServiciosChange([...formData.servicios_plan_detalle_ids, servicio.id])
                          } else {
                            handleServiciosChange(
                              formData.servicios_plan_detalle_ids.filter((id) => id !== servicio.id)
                            )
                          }
                        }}
                        disabled={enUso}
                        className="rounded"
                      />
                      <span className={`text-sm ${enUso ? 'text-gray-400 line-through' : ''}`}>
                        {servicio.servicio_nombre} ({servicio.tiempo_estandar_min} min)
                        {enUso && <span className="ml-2 text-xs text-red-600">(programado)</span>}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {duracionEstimada > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                <strong>Duración estimada:</strong> {duracionEstimada} minutos (se calcula al validar)
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-600"
              >
                Anterior
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={formData.servicios_plan_detalle_ids.length === 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Schedule Intention */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Paso 3: Intención de Programación</h3>
            
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
                value={formData.fecha_hora_inicio_programada?.split('T')[1]?.slice(0, 5) || '09:00'}
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

            <div>
              <label className="block text-sm font-medium mb-2">Espacio de trabajo (opcional)</label>
              {espacios.length === 0 ? (
                <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600">
                  <p className="text-sm">
                    ℹ️ Sin espacios creados. El backend asignará automáticamente.
                  </p>
                </div>
              ) : (
                <select
                  value={formData.espacio_trabajo_id || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      espacio_trabajo_id: e.target.value || null,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Asignación automática</option>
                  {espacios.map((espacio) => (
                    <option key={espacio.id} value={espacio.id}>
                      {espacio.nombre}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">Si no seleccionas, el backend asignará un espacio disponible</p>

              {/* Real-time availability validation for selected espacio */}
              {formData.espacio_trabajo_id && (
                <div className="mt-3">
                  {espacioValidationLoading && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
                      ⏳ Validando disponibilidad del espacio...
                    </div>
                  )}

                  {espacioValidation && !espacioValidationLoading && (
                    <>
                      {espacioValidation.disponible ? (
                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm">
                          <p className="text-green-800 font-semibold">✓ {espacioValidation.mensaje}</p>
                          <p className="text-green-700 text-xs mt-1">
                            Disponible desde {new Date(espacioValidation.fecha_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm space-y-2">
                          <p className="text-yellow-800 font-semibold">⚠️ {espacioValidation.mensaje}</p>
                          {espacioValidation.proximo_horario_disponible && (
                            <div className="bg-yellow-100 p-2 rounded flex items-center justify-between">
                              <span className="text-yellow-700 text-xs">
                                Próximo horario disponible: <strong>{new Date(espacioValidation.proximo_horario_disponible).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const proximaHora = new Date(espacioValidation.proximo_horario_disponible)
                                  const fechaStr = proximaHora.toISOString().split('T')[0]
                                  const horaStr = proximaHora.toTimeString().slice(0, 5)
                                  setFormData((prev) => ({
                                    ...prev,
                                    fecha_hora_inicio_programada: `${fechaStr}T${horaStr}:00`,
                                  }))
                                }}
                                className="bg-yellow-700 hover:bg-yellow-800 text-white px-2 py-1 rounded text-xs font-semibold"
                              >
                                Usar esta hora
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg text-sm">
              <strong>ℹ️ Nota:</strong> Esta es tu intención de horario. El backend validará 
              disponibilidad y puede ajustar si hay conflictos (fragmentación, múltiples espacios, etc).
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-gray-600"
              >
                Anterior
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!formData.fecha_hora_inicio_programada}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Paso 4: Confirmar</h3>

            {/* Validation status from backend preview */}
            {previewLoading && (
              <div className="bg-blue-50 p-3 rounded-lg text-sm">
                ⏳ Validando programación...
              </div>
            )}

            {preview && (
              <>
                {preview.es_valida ? (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <p className="text-green-800 text-sm font-semibold">✓ Programación válida</p>
                    {preview.fragmentado && (
                      <p className="text-green-700 text-xs mt-1">
                        ⚠️ Se distribuirá en {preview.segmentos_preview?.length || 1} segmento(s) debido a horarios
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-red-800 text-sm font-semibold">✗ Programación inválida</p>
                    <p className="text-red-700 text-xs mt-1">
                      {preview.mensajes?.[0] || 'No se puede programar con estos parámetros'}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <p>
                <strong>Vehículo:</strong> {vehiculoSeleccionado?.placa}
              </p>
              <p>
                <strong>Cliente:</strong> {cliente?.nombre_completo || cliente?.nombres}
              </p>
              <p>
                <strong># Servicios:</strong> {formData.servicios_plan_detalle_ids.length}
              </p>
              <p>
                <strong>Duración total:</strong> {duracionEstimada} minutos
              </p>
              <p>
                <strong>Inicio solicitado:</strong>{' '}
                {new Date(formData.fecha_hora_inicio_programada).toLocaleString()}
              </p>
              
              {/* Show real end time from backend preview (not simple calculation) */}
              {preview?.fecha_hora_fin_estimada ? (
                <p className="font-medium text-purple-700">
                  <strong>Fin estimado (real):</strong>{' '}
                  {new Date(preview.fecha_hora_fin_estimada).toLocaleString()}
                </p>
              ) : (
                <p>
                  <strong>Fin estimado:</strong>{' '}
                  {new Date(new Date(formData.fecha_hora_inicio_programada).getTime() + duracionEstimada * 60000).toLocaleString()}
                  {' '}<span className="text-gray-500 text-xs">(provisional)</span>
                </p>
              )}

              {/* Show segmentos preview if fragmented */}
              {preview?.fragmentado && preview?.segmentos_preview?.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="font-medium text-sm mb-2">Distribución por espacio:</p>
                  <div className="space-y-1">
                    {preview.segmentos_preview.map((seg, idx) => (
                      <div key={idx} className="text-xs text-gray-600 ml-2">
                        • {seg.espacio}: {new Date(seg.inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} a {new Date(seg.fin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({seg.duracion_min} min)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg text-sm">
              <strong>⚠️ IMPORTANTE:</strong> Al confirmar, el backend:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Validará que la intención sea válida</li>
                <li>Puede ajustar la hora fin real si hay conflictos o fragmentación</li>
                <li>Generará los segmentos reales en el(los) espacio(s) de trabajo</li>
                <li>Establecerá el estado: PROGRAMADA o PENDIENTE_APROBACION</li>
              </ul>
            </div>

            <textarea
              placeholder="Observaciones (opcional)"
              value={formData.observaciones_cliente}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  observaciones_cliente: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
              rows="3"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 text-gray-600"
              >
                Anterior
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || (preview && !preview.es_valida)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Cita'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CitaModalCrear
