/**
 * CitaModalCrear - Modal for creating new citas
 * 
 * Flujo:
 * 1. Usuario selecciona vehÃÂ­culo Ã¢â â cliente se deriva automÃÂ¡ticamente
 * 2. Usuario elige servicios (se calcula duraciÃÂ³n estimada)
 * 3. Usuario ingresa intenciÃÂ³n: fecha, hora, espacio
 * 4. Resumen con aclaraciÃÂ³n que backend calcula agenda final
 * 5. EnvÃÂ­o Ã¢â â Backend calcula y persiste Ã¢â â Reconsulta Ã¢â â Mostrar resultado canÃÂ³nico
 * 
 * REGLA: Backend es autoridad ÃÂºnica sobre segmentos, fragmentaciÃÂ³n, estado
 */
import { Info, Hourglass, Check, AlertTriangle, XCircle, Sparkles } from 'lucide-react';
import { useGhostAutomation } from '../../hooks/useGhostAutomation'
import React, { useState, useEffect } from 'react'
import { useTenant } from '../../hooks/useTenant'
import citasService from '../../services/citasService'
import vehiculosService from '../../services/vehiculosService'
import planVehiculoService from '../../services/planVehiculoService'
import espaciosTrabajoService from '../../services/espaciosTrabajoService'

const limpiarPrefijoDisponibilidad = (mensaje = '') => {
  const texto = String(mensaje || '')
  if (texto.startsWith('Ã¢Åâ')) return texto.slice(3).trimStart()
  if (texto.startsWith('â')) return texto.slice(1).trimStart()
  if (texto.startsWith('?')) return texto.slice(1).trimStart()
  return texto
}

const CitaModalCrear = ({ onClose, onSuccess, aiPrefill = null }) => {
  const { tenantSlug } = useTenant()
  const { isSimulating, setIsSimulating, simulateTyping, simulateClick, simulateDelay } = useGhostAutomation()

  // Step control
  const [step, setStep] = useState(1)

  // Form data
  const [formData, setFormData] = useState({
    vehiculo_id: null, cliente_id : null,
    plan_servicio_id: null, servicios_plan_detalle_ids : [],
    fecha_hora_inicio_programada: '', espacio_trabajo_id : null,
    observaciones_cliente: '', canal_origen : 'CLIENTE',  // Always CLIENTE from frontend (users or asesor on behalf)
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
        console.debug('[CitaModalCrear] VehÃÂ­culos cargados:', vehiculosList.length)

        // Cargar espacios de trabajo
        const resEspacios = await espaciosTrabajoService.listarEspacios(tenantSlug, {
          page_size: 1000,
        })
        console.debug('[CitaModalCrear] Response de espacios:', resEspacios)
        const espaciosList = resEspacios.espacios || []
        setEspacios(espaciosList)
        console.debug('[CitaModalCrear] Espacios establecidos:', {
          count: espaciosList.length,
          espacios: espaciosList.map((e) => ({ id: e.id, nombre: e.nombre })),
        })
      } catch (err) {
        console.error(' Error cargando datos iniciales:', err)
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
        // El backend tambiÃÂ©n estÃÂ¡ en La Paz, asÃÂ­ que entiende hora local directamente
        const fechaLocal = formData.fecha_hora_inicio_programada

        console.debug('[CitaModalCrear Preview] Enviando fecha sin conversiÃÂ³n:', {
          fechaLocal, payload : {
            vehiculo_id: formData.vehiculo_id, servicios_ids : formData.servicios_plan_detalle_ids,
            fecha_hora_inicio: fechaLocal, espacio_trabajo_id : formData.espacio_trabajo_id || undefined,
          }
        })

        const response = await citasService.previewIntencion(tenantSlug, {
          vehiculo_id: formData.vehiculo_id, servicios_ids : formData.servicios_plan_detalle_ids,
          fecha_hora_inicio: fechaLocal, espacio_trabajo_id : formData.espacio_trabajo_id || undefined,
        })

        console.debug('[CitaModalCrear Preview] Respuesta:', response)
        setPreview(response)
      } catch (err) {
        console.error('Error cargando preview:', err)
        setPreview({
          es_valida: false, mensajes : ['Error validando la intencion. Intenta de nuevo.'],
        })
      } finally {
        setPreviewLoading(false)
      }
    }

    // Debounce: esperar 500ms despuÃÂ©s de ÃÂºltimo cambio
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
          espacio_trabajo_id: formData.espacio_trabajo_id, fecha_hora_inicio : formData.fecha_hora_inicio_programada,
          duracion_requerida_min: duracionEstimada,
        })

        console.debug('[CitaModalCrear] ValidaciÃÂ³n disponibilidad espacio:', response)
        setEspacioValidation(response)
      } catch (err) {
        console.error('Error validando disponibilidad de espacio:', err)
        setEspacioValidation({
          disponible: false, error : err.response.data.detail || 'Error al validar disponibilidad',
        })
      } finally {
        setEspacioValidationLoading(false)
      }
    }

    // Debounce: esperar 500ms despuÃÂ©s de ÃÂºltimo cambio
    const timer = setTimeout(() => {
      validarDisponibilidad()
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.espacio_trabajo_id, formData.fecha_hora_inicio_programada, duracionEstimada, tenantSlug])

  // EFECTO: AutomatizaciÃ³n de IA para paso a paso
  useEffect(() => {
    if (!aiPrefill || aiPrefill.type !== 'CREAR_CITA') return;

    const processPrefill = async () => {
      setIsSimulating(true);
      await simulateDelay(1000); // Esperar a que se carguen los datos iniciales

      // Paso 1: Seleccionar vehÃ­culo
      if (step === 1) {
        let targetVehiculoId = null;
        if (aiPrefill.placa) {
          const match = vehiculos.find(v => v.placa.toLowerCase() === aiPrefill.placa.toLowerCase());
          if (match) targetVehiculoId = match.id;
        }
        if (targetVehiculoId) {
          handleVehiculoChange(targetVehiculoId);
          await simulateDelay(1000);
          setStep(2);
        } else {
          setIsSimulating(false);
          return;
        }
      }

      // Paso 2: Seleccionar servicios
      if (step === 2) {
        setIsSimulating(false);
        return;
      }

      // Paso 3: Asignar fecha y hora
      if (step === 3) {
        let hasData = false;
        if (aiPrefill.fecha) {
          setFormData(prev => ({
            ...prev,
            fecha_hora_inicio_programada: `${aiPrefill.fecha}T${prev.fecha_hora_inicio_programada?.split('T')[1] || '09:00:00'}`
          }));
          hasData = true;
        }
        if (aiPrefill.hora) {
          setFormData(prev => ({
            ...prev,
            fecha_hora_inicio_programada: `${prev.fecha_hora_inicio_programada?.split('T')[0] || new Date().toISOString().split('T')[0]}T${aiPrefill.hora}:00`
          }));
          hasData = true;
        }
        
        if (hasData && aiPrefill.fecha && aiPrefill.hora) {
           await simulateDelay(1000);
           setStep(4);
        } else {
           setIsSimulating(false);
           return;
        }
      }

      // Paso 4: Observaciones y Guardar
      if (step === 4) {
        if (aiPrefill.observaciones) {
          await simulateTyping(setFormData, 'observaciones_cliente', aiPrefill.observaciones, 40);
        }

        setIsSimulating(false);

        if (aiPrefill.status === 'EJECUTADA' || aiPrefill.estado === 'EJECUTADA') {
          await simulateDelay(1000);
          handleSubmit();
        }
      }
    };

    processPrefill();
  }, [aiPrefill?._ts, step, vehiculos, serviciosDelPlan]);

  // When vehicle changes
  const handleVehiculoChange = async (vehiculoId) => {
    setFormData((prev) => ({
      ...prev, vehiculo_id : vehiculoId,
      cliente_id: null, plan_servicio_id : null,
      servicios_plan_detalle_ids: [],
      // NO reseteamos espacio_trabajo_id para que el usuario pueda pre-seleccionar
    }))

    const vehiculo = vehiculos.find((v) => v.id === vehiculoId)
    if (vehiculo) {
      // Derive customer automatically
      setFormData((prev) => ({
        ...prev, cliente_id : vehiculo.propietario.id,
        plan_servicio_id: vehiculo.plan_servicio_id,  // Ã¢â Â ASIGNAR EL PLAN
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
      ...prev, servicios_plan_detalle_ids : servicioIds,
    }))

    // Calculate estimated duration (UX only, not authority)
    const duracion = servicioIds.reduce((sum, id) => {
      const servicio = serviciosDelPlan.find((s) => s.id === id)
      return sum + (servicio.tiempo_estandar_min || 0)
    }, 0)
    setDuracionEstimada(duracion)
  }

  // Submit
  const handleSubmit = async () => {
    if (!formData.vehiculo_id || formData.servicios_plan_detalle_ids.length === 0) {
      setError('Completa vehiculo y servicios')
      return
    }
    if (!formData.fecha_hora_inicio_programada) {
      setError('Indica fecha y hora deseada')
      return
    }

    setLoading(true)
    try {
      // NO convertir a UTC - enviar hora local exacta
      // Backend estÃÂ¡ en La Paz, entiende hora local
      const fechaLocal = formData.fecha_hora_inicio_programada

      // Construir payload - solo incluir espacio_trabajo_id si tiene valor
      const payload = {
        vehiculo_id: formData.vehiculo_id, cliente_id : formData.cliente_id,
        plan_servicio_id: formData.plan_servicio_id, servicios_plan_detalle_ids : formData.servicios_plan_detalle_ids,
        fecha_hora_inicio_programada: fechaLocal, observaciones_cliente : formData.observaciones_cliente,
        canal_origen: formData.canal_origen,
      }

      // Solo agregar espacio si se seleccionÃÂ³ uno
      if (formData.espacio_trabajo_id) {
        payload.espacio_trabajo_id = formData.espacio_trabajo_id
      }

      const response = await citasService.crearCita(tenantSlug, payload)
      
      // Reconsulta to get canonical state
      await citasService.refrescarCitaCanonica(tenantSlug, response.id)

      onSuccess()
    } catch (err) {
      setError(err.response.data.detail || 'Error creando cita')
    } finally {
      setLoading(false)
    }
  }

  const vehiculoSeleccionado = vehiculos.find((v) => v.id === formData.vehiculo_id)
  const cliente = vehiculoSeleccionado?.propietario || vehiculoSeleccionado?.cliente

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-carbon-900 text-carbon-900 dark:text-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto border border-neutral-200 dark:border-white/[0.08]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Nueva Cita
            {isSimulating && <Sparkles className="text-primary-500 animate-pulse inline-block ml-2" size={20} />}
          </h2>
          <button
            onClick={onClose}
            className="text-carbon-500 hover:text-carbon-700 dark:text-neutral-300 dark:hover:text-white text-2xl"
          >
            X
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Step 1: Vehicle */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Paso 1: Vehiculo</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Vehiculo</label>
              <select
                value={formData.vehiculo_id || ''}
                onChange={(e) => handleVehiculoChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-carbon-900 text-carbon-900 dark:text-white border-neutral-200 dark:border-white/[0.08]"
              >
                <option value="">Selecciona vehiculo</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} - {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            {cliente && (
              <div className="bg-neutral-50 dark:bg-carbon-800/60 p-4 rounded-lg">
                <p className="text-sm text-carbon-800 dark:text-neutral-200">
                  <strong>Cliente (derivado):</strong> {cliente.nombre_completo || cliente.nombres}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 text-carbon-600 dark:text-neutral-300">
                Cancelar
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!formData.vehiculo_id}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
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
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-white dark:bg-carbon-900 border-neutral-200 dark:border-white/[0.08]">
                {serviciosDelPlan.length === 0 ? (
                  <div className="text-center py-4 text-carbon-500 dark:text-neutral-400 text-sm">
                    {formData.vehiculo_id && vehiculos.find(v => v.id === formData.vehiculo_id)?.plan_servicio_id 
                      ? "El plan asociado a este vehiculo no tiene servicios." 
                      : "Este vehiculo no cuenta con un plan de servicios asignado. Debes asignarle un plan primero para agendar una cita."}
                  </div>
                ) : (
                  serviciosDelPlan.map((servicio) => {
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
                      <span className={`text-sm ${enUso ? 'text-neutral-400 dark:text-neutral-500 line-through' : 'text-carbon-800 dark:text-neutral-200'}`}>
                        {servicio.servicio_nombre} ({servicio.tiempo_estandar_min} min)
                        {enUso && <span className="ml-2 text-xs text-red-600 dark:text-red-300">(programado)</span>}
                      </span>
                    </label>
                  )
                  })
                )}
              </div>
            </div>

            {duracionEstimada > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 text-carbon-800 dark:text-blue-100 p-3 rounded-lg text-sm">
                <strong>Duracion estimada:</strong> {duracionEstimada} minutos (se calcula al validar)
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-carbon-600 dark:text-neutral-300"
              >
                Anterior
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={formData.servicios_plan_detalle_ids.length === 0}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Schedule Intention */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Paso 3: Intencion de Programacion</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">Fecha deseada</label>
              <input
                type="date"
                value={formData.fecha_hora_inicio_programada?.split('T')[0] || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev, fecha_hora_inicio_programada : `${e.target.value}T${
                      prev.fecha_hora_inicio_programada?.split('T')[1] || '09:00:00'
                    }`,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-carbon-900 text-carbon-900 dark:text-white border-neutral-200 dark:border-white/[0.08]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Hora deseada</label>
              <input
                type="time"
                value={formData.fecha_hora_inicio_programada?.split('T')[1]?.slice(0, 5) || '09:00'}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev, fecha_hora_inicio_programada : `${
                      prev.fecha_hora_inicio_programada?.split('T')[0] || new Date().toISOString().split('T')[0]
                    }T${e.target.value}:00`,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-carbon-900 text-carbon-900 dark:text-white border-neutral-200 dark:border-white/[0.08]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Espacio de trabajo (opcional)</label>
              {espacios.length === 0 ? (
                <div className="w-full px-3 py-2 border rounded-lg bg-neutral-50 dark:bg-carbon-800/60 text-carbon-600 dark:text-neutral-300 border-neutral-200 dark:border-white/[0.08]">
                  <p className="text-sm">
                    <Info className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Sin espacios creados. El backend asignara automaticamente.
                  </p>
                </div>
              ) : (
                <select
                  value={formData.espacio_trabajo_id || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev, espacio_trabajo_id : e.target.value || null,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-carbon-900 text-carbon-900 dark:text-white border-neutral-200 dark:border-white/[0.08]"
                >
                  <option value="">Asignacion automatica</option>
                  {espacios.map((espacio) => (
                    <option key={espacio.id} value={espacio.id}>
                      {espacio.nombre}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-carbon-500 dark:text-neutral-400 mt-1">Si no seleccionas, el backend asignara un espacio disponible</p>

              {/* Real-time availability validation for selected espacio */}
              {formData.espacio_trabajo_id && (
                <div className="mt-3">
                  {espacioValidationLoading && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 text-carbon-800 dark:text-blue-100 p-3 rounded-lg text-sm">
                      <Hourglass className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Validando disponibilidad del espacio...
                    </div>
                  )}

                  {espacioValidation && !espacioValidationLoading && (
                    <>
                      {espacioValidation.disponible ? (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 p-3 rounded-lg text-sm">
                          <p className="text-green-800 dark:text-green-200 font-semibold"><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> {limpiarPrefijoDisponibilidad(espacioValidation.mensaje)}</p>
                          <p className="text-green-700 dark:text-green-300 text-xs mt-1">
                            Disponible desde {new Date(espacioValidation.fecha_hora_inicio).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                          </p>
                        </div>
              ) : (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 p-3 rounded-lg text-sm space-y-2">
                          <p className="text-yellow-800 dark:text-yellow-200 font-semibold"><AlertTriangle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> {limpiarPrefijoDisponibilidad(espacioValidation.mensaje)}</p>
                          {espacioValidation.proximo_horario_disponible && (
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded flex items-center justify-between">
                              <span className="text-yellow-700 dark:text-yellow-300 text-xs">
                                Proximo horario disponible: <strong>{new Date(espacioValidation.proximo_horario_disponible).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const proximaHora = new Date(espacioValidation.proximo_horario_disponible)
                                  const fechaStr = proximaHora.toISOString().split('T')[0]
                                  const horaStr = proximaHora.toTimeString().slice(0, 5)
                                  setFormData((prev) => ({
                                    ...prev, fecha_hora_inicio_programada : `${fechaStr}T${horaStr}:00`,
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

            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-carbon-800 dark:text-yellow-100 p-3 rounded-lg text-sm">
              <strong><Info className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Nota:</strong> Esta es tu intenciÃ³n de horario. Se validara si es posible y si no se te sugiere alguna opcion posible
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-carbon-600 dark:text-neutral-300"
              >
                Anterior
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!formData.fecha_hora_inicio_programada}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
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
              <div className="bg-blue-50 dark:bg-blue-900/20 text-carbon-800 dark:text-blue-100 p-3 rounded-lg text-sm">
                <Hourglass className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Validando programacion...
              </div>
            )}

            {preview && (
              <>
                {preview.es_valida ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 p-3 rounded-lg">
                    <p className="text-green-800 dark:text-green-200 text-sm font-semibold"><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Programacion valida</p>
                    {preview.fragmentado && (
                      <p className="text-green-700 dark:text-green-300 text-xs mt-1">
                        <AlertTriangle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Se distribuira en {preview.segmentos_preview.length || 1} segmento(s) debido a horarios
                      </p>
                    )}
                  </div>
              ) : (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3 rounded-lg">
                    <p className="text-red-800 dark:text-red-200 text-sm font-semibold"><XCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Programacion invalida</p>
                    <p className="text-red-700 dark:text-red-300 text-xs mt-1">
                      {preview.mensajes?.[0] || 'No se puede programar con estos parametros'}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="bg-neutral-50 dark:bg-carbon-800/60 p-4 rounded-lg space-y-2 text-sm">
              <p>
                <strong>Vehiculo:</strong> {vehiculoSeleccionado.placa}
              </p>
              <p>
                <strong>Cliente:</strong> {cliente.nombre_completo || cliente.nombres}
              </p>
              <p>
                <strong># Servicios:</strong> {formData.servicios_plan_detalle_ids.length}
              </p>
              <p>
                <strong>Duracion total:</strong> {duracionEstimada} minutos
              </p>
              <p>
                <strong>Inicio solicitado:</strong>{' '}
                {new Date(formData.fecha_hora_inicio_programada).toLocaleString()}
              </p>
              
              {/* Show real end time from backend preview (not simple calculation) */}
              {preview.fecha_hora_fin_estimada ? (
                <p className="font-medium text-primary-700 dark:text-primary-300">
                  <strong>Fin estimado (real):</strong>{' '}
                  {new Date(preview.fecha_hora_fin_estimada).toLocaleString()}
                </p> ) : (
                <p>
                  <strong>Fin estimado:</strong>{' '}
                  {new Date(new Date(formData.fecha_hora_inicio_programada).getTime() + duracionEstimada * 60000).toLocaleString()}
                  {' '}<span className="text-carbon-500 dark:text-neutral-400 text-xs">(provisional)</span>
                </p>
              )}

              {/* Show segmentos preview if fragmented */}
              {preview.fragmentado && preview.segmentos_preview.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-white/[0.08]">
                  <p className="font-medium text-sm mb-2">Distribucion por espacio:</p>
                  <div className="space-y-1">
                    {preview.segmentos_preview.map((seg, idx) => (
                      <div key={idx} className="text-xs text-carbon-600 dark:text-neutral-400 ml-2">
                        - {seg.espacio}: {new Date(seg.inicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} a {new Date(seg.fin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({seg.duracion_min} min)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <textarea
              placeholder="Observaciones (opcional)"
              value={formData.observaciones_cliente}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev, observaciones_cliente : e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-carbon-900 text-carbon-900 dark:text-white border-neutral-200 dark:border-white/[0.08]"
              rows="3"
            />

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 text-carbon-600 dark:text-neutral-300"
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




