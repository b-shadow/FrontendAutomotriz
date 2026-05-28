import apiClient from './apiClient';

/**
 * Servicio para interactuar con el Asistente IA en el backend.
 */
const assistantService = {
  /**
   * Obtiene la lista de conversaciones del usuario actual en el tenant.
   */
  getConversations: async (tenantSlug, estado = 'ACTIVA') => {
    const response = await apiClient.get(`/api/${tenantSlug}/comunicacion-control/ia/?estado=${estado}`);
    return response.data;
  },

  /**
   * Crea una nueva conversación de chat.
   */
  createConversation: async (tenantSlug) => {
    const response = await apiClient.post(`/api/${tenantSlug}/comunicacion-control/ia/`);
    return response.data;
  },

  /**
   * Obtiene los mensajes de una conversación específica.
   * NOTA: El endpoint de listado ya trae los mensajes si se configura en el serializer,
   * o se puede implementar un endpoint de detalle.
   */
  getConversationMessages: async (tenantSlug, conversationId) => {
    const response = await apiClient.get(`/api/${tenantSlug}/comunicacion-control/ia/${conversationId}/`);
    return response.data;
  },

  /**
   * Envía un mensaje a la IA y recibe la respuesta procesada.
   * @param {string} tenantSlug - Slug del tenant.
   * @param {string} conversationId - ID de la conversación.
   * @param {string} content - Contenido del mensaje.
   */
  sendMessage: async (tenantSlug, conversationId, content) => {
    const response = await apiClient.post(
      `/api/${tenantSlug}/comunicacion-control/ia/${conversationId}/enviar_mensaje/`,
      { contenido: content }
    );
    return response.data;
  },

  /**
   * Transcribe un archivo de audio a texto.
   * @param {string} tenantSlug - Slug del tenant.
   * @param {Blob} audioBlob - El audio grabado.
   */
  transcribeAudio: async (tenantSlug, audioBlob) => {
    const formData = new FormData();
    const extension = audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
    formData.append('audio', audioBlob, `voice_input.${extension}`);
    
    const response = await apiClient.post(
      `/api/${tenantSlug}/comunicacion-control/ia/transcribir/`,
      formData,
      {
        headers: {
          'Content-Type': undefined,
        },
      }
    );
    return response.data;
  },

  /**
   * Confirma una acción sugerida por la IA.
   * @param {string} tenantSlug - Slug del tenant.
   * @param {string} conversationId - ID de la conversación.
   * @param {string} actionId - ID de la acción a confirmar.
   */
  confirmAction: async (tenantSlug, conversationId, actionId) => {
    const response = await apiClient.post(
      `/api/${tenantSlug}/comunicacion-control/ia/${conversationId}/confirmar_accion/`,
      { accion_id: actionId }
    );
    return response.data;
  },

  /**
   * Archiva una conversación (la mueve a estado ARCHIVADA).
   */
  archiveConversation: async (tenantSlug, conversationId) => {
    const response = await apiClient.post(
      `/api/${tenantSlug}/comunicacion-control/ia/${conversationId}/archivar/`
    );
    return response.data;
  },
};

export default assistantService;
