/**
 * citasService.js - Servicio para gestión de citas (CU18)
 */

import apiClient from './apiClient'

const citasService = {
  /**
   * Listar citas del tenant actual
   * GET /api/{slug}/citas/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {object} filtros - Filtros opcionales
   *   {search, estado, cliente_id, vehiculo_id, fecha_inicio, fecha_fin, ordering, page, page_size}
   * @returns {object} { count, next, previous, results: [cita...] }
   */
  listarCitas: async (tenantSlug, filtros = {}) => {
    try {
      const params = new URLSearchParams()

      if (filtros.search) params.append('search', filtros.search)
      if (filtros.estado) params.append('estado', filtros.estado)
      if (filtros.cliente_id) params.append('cliente_id', filtros.cliente_id)
      if (filtros.vehiculo_id) params.append('vehiculo_id', filtros.vehiculo_id)
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio)
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin)
      if (filtros.ordering) params.append('ordering', filtros.ordering)
      if (filtros.page) params.append('page', filtros.page)
      if (filtros.page_size) params.append('page_size', filtros.page_size)

      const queryString = params.toString()
      const url = queryString
        ? `/api/${tenantSlug}/citas/?${queryString}`
        : `/api/${tenantSlug}/citas/`

      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error('❌ Error al listar citas:', error)
      throw error
    }
  },

  /**
   * Obtener datos detallados y canónicos de una cita
   * GET /api/{slug}/citas/{id}/
   * 
   * IMPORTANTE: Devuelve la programación CANÓNICA calatada por el backend:
   * - segmentos reales
   * - estado final (PROGRAMADA, PENDIENTE_APROBACION, etc)
   * - horarios exactos calculados por backend
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} citaId - ID de la cita (UUID)
   * @returns {object} Cita con datos canónicos
   */
  obtenerCita: async (tenantSlug, citaId) => {
    try {
      const response = await apiClient.get(`/api/${tenantSlug}/citas/${citaId}/`)
      return response.data
    } catch (error) {
      console.error('❌ Error al obtener cita:', error)
      throw error
    }
  },

  /**
   * Crear una nueva cita
   * POST /api/{slug}/citas/
   *
   * PATRÓN CORRECTO:
   * 1. Frontend captura INTENCIÓN del usuario
   * 2. Envía datos básicos al backend (NO segmentos pre-calculados como autoridad)
   * 3. Backend calcula segmentación real y estado
   * 4. Frontend reconsulta via refrescarCitaCanonica()
   * 5. Frontend muestra resultado canónico del backend
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {object} citaData - Datos de INTENCIÓN
   *   {
   *     vehiculo_id: (requerido),
   *     cliente_id: (requerido),
   *     plan_servicio_id: (requerido),
   *     servicios_plan_detalle_ids: [ids...] (requerido),
   *     fecha_hora_inicio_programada: (requerido - UTC ISO string),
   *     espacio_trabajo_id: (requerido si backend lo requiere),
   *     motivo_visita: (opcional),
   *     observaciones_cliente: (opcional),
   *     canal_origen: (default: 'CLIENTE'),
   *     
   *     ⚠️ NO ENVIAR como autoridad:
   *     - fecha_hora_fin_programada (backend la calcula)
   *     - segmentos_espacio (backend los calcula/valida)
   *     - estado (backend lo determina)
   *   }
   * @returns {object} Cita creada (estado provisional - DEBE reconsultarse)
   */
  crearCita: async (tenantSlug, citaData) => {
    try {
      console.log('📤 Enviando solicitud de cita al backend con INTENCIÓN:', {
        vehiculo_id: citaData.vehiculo_id,
        cliente_id: citaData.cliente_id,
        fecha_inicio: citaData.fecha_hora_inicio_programada,
        espacio: citaData.espacio_trabajo_id,
        servicios: citaData.servicios_plan_detalle_ids?.length ? `${citaData.servicios_plan_detalle_ids.length} servicio(s)` : 'ninguno',
      })

      const response = await apiClient.post(`/api/${tenantSlug}/citas/`, citaData)
      console.log('✅ Respuesta POST /create:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error al crear cita:', error)
      if (error.response?.data) {
        console.error('🔴 Detalle del error:', JSON.stringify(error.response.data, null, 2))
      }
      throw error
    }
  },

  /**
   * Editar una cita existente
   * PATCH /api/{slug}/citas/{id}/
   *
   * PATRÓN CORRECTO:
   * 1. Frontend captura INTENCIÓN de modificación
   * 2. Envía SOLO lo que el usuario cambió (NO recalcula agenda)
   * 3. Backend valida y recalcula si es necesario
   * 4. Frontend reconsulta via refrescarCitaCanonica()
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} citaId - ID de la cita
   * @param {object} citaData - Datos a actualizar
   *   {
   *     fecha_hora_inicio_programada: (si cambia),
   *     servicios_plan_detalle_ids: (si cambia),
   *     espacio_trabajo_id: (si cambia),
   *     motivo_visita: (opcional),
   *     observaciones_cliente: (opcional),
   *     
   *     ⚠️ NO ENVIAR:
   *     - fecha_hora_fin_programada
   *     - segmentos_espacio
   *     - estado
   *   }
   * @returns {object} Cita actualizada (estado provisional - DEBE reconsultarse)
   */
  editarCita: async (tenantSlug, citaId, citaData) => {
    try {
      console.log(`📝 Enviando modificación de cita ${citaId}`)
      const response = await apiClient.patch(
        `/api/${tenantSlug}/citas/${citaId}/`,
        citaData
      )
      console.log('✅ Respuesta PATCH /edit:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error al editar cita:', error)
      if (error.response?.data) {
        console.error('🔴 Detalle del error:', JSON.stringify(error.response.data, null, 2))
      }
      throw error
    }
  },

  /**
   * Cancelar una cita
   * POST /api/{slug}/citas/{id}/cancelar/
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} citaId - ID de la cita
   * @param {object} cancelData - Datos de cancelación
   *   { motivo_cancelacion: (opcional) }
   * @returns {object} Cita actualizada con estado CANCELADA
   */
  cancelarCita: async (tenantSlug, citaId, cancelData = {}) => {
    try {
      console.log(`❌ Cancelando cita ${citaId}`)
      const response = await apiClient.post(
        `/api/${tenantSlug}/citas/${citaId}/cancelar/`,
        cancelData
      )
      console.log('✅ Cita cancelada')
      return response.data
    } catch (error) {
      console.error('❌ Error al cancelar cita:', error)
      throw error
    }
  },

  /**
   * Reprogramar una cita existente
   * POST /api/{slug}/citas/{id}/reprogramar/
   *
   * PATRÓN CORRECTO:
   * 1. Frontend captura NUEVA INTENCIÓN de programación
   * 2. Envía nueva fecha/hora/espacio (NO segmentos pre-calculados)
   * 3. Backend recalcula segmentación para la nueva intención
   * 4. Frontend reconsulta via refrescarCitaCanonica()
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} citaId - ID de la cita
   * @param {object} reprogramData - Datos de la nueva programación
   *   {
   *     fecha_hora_inicio_programada: (Nueva fecha/hora - UTC ISO),
   *     espacio_trabajo_id: (Nuevo espacio si aplica),
   *     motivo_reprogramacion: (opcional),
   *     
   *     ⚠️ NO ENVIAR:
   *     - fecha_hora_fin_programada
   *     - segmentos_espacio (backend los recalcula)
   *   }
   * @returns {object} Cita actualizada en nueva fecha (estado provisional - DEBE reconsultarse)
   */
  reprogramarCita: async (tenantSlug, citaId, reprogramData) => {
    try {
      console.log(`🔄 Reprogramando cita ${citaId}`)
      const response = await apiClient.post(
        `/api/${tenantSlug}/citas/${citaId}/reprogramar/`,
        reprogramData
      )
      console.log('✅ Respuesta POST /reprogramar:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error al reprogramar cita:', error)
      throw error
    }
  },

  /**
   * Refrescar estado canónico de una cita POST-MUTACIÓN
   * GET /api/{slug}/citas/{id}/
   *
   * CRÍTICO: Después de crear/editar/cancelar/reprogramar, el backend calcula
   * y persiste el estado final. Esta función obtiene la VERDAD DEL BACKEND.
   *
   * Frontend NUNCA confía en lo que acaba de enviar:
   * - reconsulta siempre dopo de mutación
   * - muestra exactamente lo que backend devuelve
   * - estructura la UI según datos canónicos del backend
   *
   * @param {string} tenantSlug - Slug del tenant
   * @param {string} citaId - ID de la cita
   * @returns {object} Cita con estado CANÓNICO del backend
   */
  refrescarCitaCanonica: async (tenantSlug, citaId) => {
    try {
      console.log(`🔄 Refrescando estado canónico de cita ${citaId}`)
      const response = await apiClient.get(`/api/${tenantSlug}/citas/${citaId}/`)
      console.log('✅ Cita canónica:', {
        estado: response.data.estado,
        inicio: response.data.fecha_hora_inicio_programada,
        fin: response.data.fecha_hora_fin_programada,
        segmentos: response.data.espacios_segmentos?.length || 0,
      })
      return response.data
    } catch (error) {
      console.error('❌ Error al refrescar cita canónica:', error)
      throw error
    }
  },

  /**
   * Preview/Validación tentativa de una intención de cita
   * POST /api/{slug}/citas/preview-intencion/
   * 
   * NO persiste nada. Solo calcula qué pasaría con esos parámetros.
   * 
   * @param {string} tenantSlug - Slug del tenant
   * @param {object} intencion - Intención de cita
   *   {vehiculo_id, servicios_ids[], fecha_hora_inicio, espacio_trabajo_id?}
   * @returns {object} { fecha_hora_fin_estimada, es_valida, duracion_total_min, fragmentado, segmentos_preview, mensajes }
   */
  previewIntencion: async (tenantSlug, intencion) => {
    try {
      const response = await apiClient.post(
        `/api/${tenantSlug}/citas/preview-intencion/`,
        intencion
      )
      console.log('✅ Preview intención calculado:', {
        es_valida: response.data.es_valida,
        fin_estimada: response.data.fecha_hora_fin_estimada,
        fragmentado: response.data.fragmentado,
      })
      return response.data
    } catch (error) {
      console.error('❌ Error al calcular preview:', error)
      throw error
    }
  },

  /**
   * Validar disponibilidad de espacio específico en horario específico
   * POST /api/{slug}/citas/validar-disponibilidad-espacio/
   * 
   * NO persiste nada. Solo valida si un espacio específico está libre.
   * Si NO está disponible, devuelve próximo horario disponible.
   * 
   * Útil para Step 3 del Modal: validar en tiempo real si el espacio está ocupado.
   * 
   * @param {string} tenantSlug - Slug del tenant
   * @param {object} validacion - Parámetros de validación
   *   {
   *     espacio_trabajo_id: uuid (requerido),
   *     fecha_hora_inicio: datetime ISO (requerido),
   *     duracion_requerida_min: number (óptimo si disponible)
   *   }
   * @returns {object} 
   *   Si disponible:
   *   {
   *     disponible: true,
   *     fecha_hora_inicio: "...",
   *     fecha_hora_fin_estimada: "...",
   *     espacio_nombre: "Taller 1",
   *     mensaje: "✓ Espacio disponible..."
   *   }
   *   Si NO disponible:
   *   {
   *     disponible: false,
   *     fecha_hora_solicitada: "...",
   *     conflicto_hasta: "...",
   *     proximo_horario_disponible: "...",
   *     espacio_nombre: "Taller 1",
   *     mensaje: "El espacio está ocupado, disponible a partir de..."
   *   }
   */
  validarDisponibilidadEspacio: async (tenantSlug, validacion) => {
    try {
      const response = await apiClient.post(
        `/api/${tenantSlug}/citas/validar-disponibilidad-espacio/`,
        validacion
      )
      console.log('✅ Validación de disponibilidad de espacio:', {
        disponible: response.data.disponible,
        espacioNombre: response.data.espacio_nombre,
        mensaje: response.data.mensaje,
      })
      return response.data
    } catch (error) {
      console.error('❌ Error al validar disponibilidad de espacio:', error)
      throw error
    }
  },

  /**
   * Alias para listarCitas() - mantiene coherencia con nomenclatura del proyecto
   */
  obtenerCitas: async (tenantSlug, filtros = {}) => {
    try {
      return await citasService.listarCitas(tenantSlug, filtros)
    } catch (error) {
      console.error('❌ Error al obtener citas:', error)
      throw error
    }
  },
}

export default citasService
