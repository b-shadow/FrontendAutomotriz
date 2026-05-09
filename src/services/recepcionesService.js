/**
 * Service para operaciones de Recepción de Vehículos.
 * Incluye: crear, listar, obtener detalles de recepciones
 * y obtener citas pendientes de recibir.
 */

import { apiClient } from '@/services/apiClient';

/**
 * Listar recepciones de un tenant
 * GET /api/{slug}/recepciones-vehiculo/
 */
export const listarRecepciones = async (tenantSlug, filtros = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filtros.nivel_combustible) {
      params.append('nivel_combustible', filtros.nivel_combustible);
    }
    if (filtros.asesor_registra) {
      params.append('asesor_registra', filtros.asesor_registra);
    }
    if (filtros.search) {
      params.append('search', filtros.search);
    }
    if (filtros.ordering) {
      params.append('ordering', filtros.ordering);
    }

    const queryString = params.toString();
    const baseUrl = `/api/${tenantSlug}/recepciones-vehiculo/`;
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error listando recepciones:', error);
    throw error;
  }
};

/**
 * Obtener detalle de una recepción
 * GET /api/{slug}/recepciones-vehiculo/{id}/
 */
export const obtenerRecepcion = async (tenantSlug, recepcionId) => {
  try {
    const response = await apiClient.get(
      `/api/${tenantSlug}/recepciones-vehiculo/${recepcionId}/`
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo recepción:', error);
    throw error;
  }
};

/**
 * Crear recepción de vehículo
 * POST /api/{slug}/recepciones-vehiculo/
 * 
 * Payload:
 * {
 *   cita_id: UUID,
 *   kilometraje_ingreso: int,
 *   nivel_combustible: "1/4" | "1/2" | "3/4" | "LLENO",
 *   observaciones: string (opcional)
 * }
 */
export const crearRecepcion = async (tenantSlug, datos) => {
  try {
    const response = await apiClient.post(
      `/api/${tenantSlug}/recepciones-vehiculo/`,
      datos
    );
    return response.data;
  } catch (error) {
    console.error('Error creando recepción:', error);
    throw error;
  }
};

/**
 * Editar recepción (solo observaciones y condición)
 * PATCH /api/{slug}/recepciones-vehiculo/{id}/
 */
export const editarRecepcion = async (tenantSlug, recepcionId, datos) => {
  try {
    const response = await apiClient.patch(
      `/api/${tenantSlug}/recepciones-vehiculo/${recepcionId}/`,
      datos
    );
    return response.data;
  } catch (error) {
    console.error('Error editando recepción:', error);
    throw error;
  }
};

/**
 * Obtener citas pendientes de recibir (EN_ESPERA_INGRESO sin recepción)
 * GET /api/{slug}/recepciones-vehiculo/citas-pendientes/
 */
export const citasPendientes = async (tenantSlug) => {
  try {
    const response = await apiClient.get(
      `/api/${tenantSlug}/recepciones-vehiculo/citas-pendientes/`
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo citas pendientes:', error);
    throw error;
  }
};

/**
 * Obtener información completa de la cita asociada a una recepción
 * GET /api/{slug}/recepciones-vehiculo/{id}/cita-info/
 */
export const obtenerCitaInfo = async (tenantSlug, recepcionId) => {
  try {
    const response = await apiClient.get(
      `/api/${tenantSlug}/recepciones-vehiculo/${recepcionId}/cita-info/`
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo info de cita:', error);
    throw error;
  }
};

/**
 * Obtener múltiples recepciones por IDs
 * POST /api/{slug}/recepciones-vehiculo/bulk-list/
 */
export const obtenerRecepcionesPorIds = async (tenantSlug, ids) => {
  try {
    const response = await apiClient.post(
      `/api/${tenantSlug}/recepciones-vehiculo/bulk-list/`,
      { ids }
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo recepciones en bulk:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de recepciones
 * GET /api/{slug}/recepciones-vehiculo/estadisticas/
 */
export const obtenerEstadisticas = async (tenantSlug) => {
  try {
    const response = await apiClient.get(
      `/api/${tenantSlug}/recepciones-vehiculo/estadisticas/`
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
};

/**
 * Obtener pendientes operativos:
 * - pendientes_recepcion
 * - pendientes_recogida
 * GET /api/{slug}/recepciones-vehiculo/pendientes-operacion/
 */
export const obtenerPendientesOperacion = async (tenantSlug) => {
  try {
    const response = await apiClient.get(
      `/api/${tenantSlug}/recepciones-vehiculo/pendientes-operacion/`
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo pendientes de operacion:', error);
    throw error;
  }
};

/**
 * Marcar una recepción como recogida
 * POST /api/{slug}/recepciones-vehiculo/{id}/marcar-recogida/
 */
export const marcarRecogida = async (tenantSlug, recepcionId) => {
  try {
    const response = await apiClient.post(
      `/api/${tenantSlug}/recepciones-vehiculo/${recepcionId}/marcar-recogida/`
    );
    return response.data;
  } catch (error) {
    console.error('Error marcando recogida:', error);
    throw error;
  }
};
