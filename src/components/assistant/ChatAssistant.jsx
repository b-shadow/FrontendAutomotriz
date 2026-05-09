import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Send, Mic, Sparkles, Bot, User,
  Loader2, CheckCircle2, ChevronRight,
  MoreHorizontal, Volume2, VolumeX, Trash2,
  Calendar, Car, Wrench, FileText, UserPlus, Package, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../hooks/useTenant';
import assistantService from '../../services/assistantService';

/**
 * ChatAssistant: Interfaz premium flotante del asistente IA.
 */
const ChatAssistant = ({
  isOpen,
  onClose,
  onNavigate,
  onActionProposed,
  onActionSuccess
}) => {
  const navigate = useNavigate();
  const { user, tenant, tenantSlug } = useTenant();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Auto-scroll al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Inicializar conversación
  useEffect(() => {
    if (isOpen && !currentConversationId) {
      initConversation();
    }
  }, [isOpen]);
  // Limpiar síntesis de voz al cerrar
  useEffect(() => {
    if (!isOpen && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  const toggleVoice = () => {
    setIsVoiceEnabled(prev => {
      const newVal = !prev;
      if (!newVal && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return newVal;
    });
  };

  const speakText = useCallback((text) => {
    if (!window.speechSynthesis || !text) return;
    
    // Limpiar emojis, markdown básico y caracteres especiales para mejor lectura
    const cleanText = text.replace(/[*_#`]|[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
    if (!cleanText) return;

    window.speechSynthesis.cancel(); // Stop any previous speech
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES'; // Priorizar español
    utterance.rate = 1.05; // Un poco más rápido para más dinamismo
    
    const voices = window.speechSynthesis.getVoices();
    // Buscar voz en español
    const esVoice = voices.find(v => v.lang.startsWith('es-') || v.lang.startsWith('es'));
    if (esVoice) utterance.voice = esVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const initConversation = async () => {
    try {
      const data = await assistantService.getConversations(tenantSlug);
      console.log("[ChatAssistant] Conversaciones encontradas:", data.length);
      if (data.length > 0) {
        const convId = data[0].id;
        setCurrentConversationId(convId);
        // Cargar mensajes previos de la BD
        try {
          const convDetail = await assistantService.getConversationMessages(tenantSlug, convId);
          console.log("[ChatAssistant] Mensajes cargados:", convDetail.mensajes?.length || 0);
          if (convDetail.mensajes && convDetail.mensajes.length > 0) {
            setMessages(convDetail.mensajes);
            setSuggestedActions([]);
            return;
          }
        } catch (err) {
          console.error("[ChatAssistant] Error cargando mensajes:", err);
        }
        // Fallback: sin mensajes previos
        setMessages([{
          id: 'welcome',
          sender: 'ai',
          text: `¡Hola ${user.nombres}! Soy tu asistente de AutoTaller Pro. ¿En qué puedo ayudarte hoy?`,
        }]);
        setSuggestedActions(["Agendar Cita", "Ver Vehículos", "Estado de Taller"]);
      } else {
        const newConv = await assistantService.createConversation(tenantSlug);
        setCurrentConversationId(newConv.id);
        setMessages([{
          id: 'welcome',
          sender: 'ai',
          text: `¡Hola ${user.nombres}! Bienvenido al asistente de AutoTaller Pro. Estoy listo para ayudarte con tus tareas diarias.`,
        }]);
        setSuggestedActions(["¿Qué puedes hacer?", "Registrar Vehículo"]);
      }
    } catch (error) {
      console.error("Error al iniciar conversación:", error);
    }
  };

  const handleClearChat = async () => {
    setShowMenu(false);
    if (!currentConversationId) return;
    try {
      // Archivar la conversación actual en la BD
      await assistantService.archiveConversation(tenantSlug, currentConversationId);
      // Crear nueva conversación
      const newConv = await assistantService.createConversation(tenantSlug);
      setCurrentConversationId(newConv.id);
      setMessages([{
        id: 'welcome-new',
        sender: 'ai',
        text: `¡Chat limpio! Conversación anterior archivada. ¿En qué puedo ayudarte ahora, ${user.nombres}?`,
      }]);
      setSuggestedActions(["¿Qué puedes hacer?", "Registrar Vehículo"]);
    } catch (error) {
      console.error("Error al limpiar chat:", error);
    }
  };

  const handleSend = async (text) => {
    const msgText = text || input;
    if (!msgText.trim() || isTyping || !currentConversationId) return;

    const userMsg = { id: Date.now(), sender: 'user', text: msgText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setSuggestedActions([]);

    try {
      const response = await assistantService.sendMessage(tenantSlug, currentConversationId, msgText);

      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: response.mensaje_ia,
        action: response.accion,
        options: response.options,
      };

      setMessages(prev => [...prev, aiMsg]);
      setSuggestedActions(response.suggested_actions || []);

      if (isVoiceEnabled) {
        speakText(aiMsg.text);
      }

      // Notificar al dashboard sobre la acción propuesta para el pre-llenado
      if (onActionProposed && response.accion) {
        console.log("Notificando acción propuesta:", response.accion.accion);
        // Agregamos un timestamp para forzar el re-render en el hijo
        onActionProposed({ ...response.accion, _ts: Date.now() });
      }

      // Lógica de navegación mejorada para SPA interno (DESPUÉS de notificar la acción)
      const redirectPath = response.accion?.redirect_path || response.accion?.parametros?._redirect_path;
      if (redirectPath) {
        console.log("IA solicitando navegación a:", redirectPath);
        setTimeout(() => handleNavigation(redirectPath), 100);
      }

      // Si la IA confirma que ejecutó algo (ej: tras un "Sí"), refrescar datos globales
      // EXCEPCIÓN: Acciones que requieren simulación visual extendida (Ghost User)
      const isGhostAction = ['COMPRAR_PLAN', 'RELLENAR_PAGO', 'CANCELAR_CAMBIO', 'REGISTRAR_VEHICULO', 'CAMBIAR_USUARIO', 'CAMBIAR_TELEFONO', 'CAMBIAR_CONTRASENA', 'ACTUALIZAR_PREFERENCIAS', 'CAMBIAR_NOMBRE_EMPRESA', 'AGREGAR_SERVICIO', 'REGISTRAR_ESPACIO', 'EDITAR_ESPACIO', 'VER_HORARIOS_ESPACIO', 'AGREGAR_HORARIO_ESPACIO', 'EDITAR_HORARIO_ESPACIO', 'BUSCAR_PLAN', 'VER_PLAN', 'EDITAR_PLAN', 'CAMBIAR_ESTADO_PLAN', 'AGREGAR_DETALLE_PLAN', 'FILTRAR_BITACORA', 'EXPORTAR_BITACORA', 'VER_REPORTE_GLOBAL', 'VER_REPORTE_VEHICULO', 'VER_REPORTE_PRESUPUESTO', 'VER_REPORTE_INVENTARIO', 'EXPORTAR_REPORTE'].includes(response.accion?.accion);
      if (response.accion?.estado === 'EJECUTADA' && onActionSuccess && !isGhostAction) {
        onActionSuccess();
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: "Lo siento, he tenido un problema conectando con el cerebro de la IA. ¿Podrías intentar de nuevo?",
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- Lógica de Grabación de Voz ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setIsTyping(true);
        try {
          const res = await assistantService.transcribeAudio(tenantSlug, audioBlob);
          if (res.texto) {
            handleSend(res.texto);
          }
        } catch (error) {
          console.error("Error transcribiendo:", error);
        } finally {
          setIsTyping(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error al acceder al micrófono:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleConfirmAction = async (actionId) => {
    try {
      const targetMsg = messages.find(m => m.action && m.action.id === actionId);
      const mActionType = targetMsg?.action?.accion;

      const res = await assistantService.confirmAction(tenantSlug, currentConversationId, actionId);
      // Actualizar el mensaje de la acción para mostrar éxito
      setMessages(prev => prev.map(m =>
        (m.action && m.action.id === actionId)
          ? { ...m, action: { ...m.action, estado: 'EJECUTADA', resultado: res.resultado } }
          : m
      ));
      // Redirigir si la acción tiene un path asociado (opcional en confirmación si ya se redirigió antes)
      const redirectPath = targetMsg?.action?.parametros?._redirect_path;
      if (redirectPath) {
        handleNavigation(redirectPath);
      }
    } catch (error) {
      console.error("Error confirmando acción:", error);
    }
  };

  const handleNavigation = (path) => {
    // Mapeo exhaustivo de paths a IDs de vista interna del dashboard
    const viewMapping = {
      '/dashboard': 'dashboard',
      '/configuracion/perfil': 'editarPerfil',
      '/gestion/empresa': 'gestionEmpresa',
      '/gestion/usuarios': 'gestionUsuariosRoles',
      '/gestion/suscripcion': 'gestionSuscripciones',
      '/notificaciones': 'notificaciones',
      '/bitacora': 'bitacora',
      '/vehiculos': 'gestionVehiculos',
      '/servicios': 'catalogoServicios',
      '/gestion/espacios-de-trabajo': 'espaciosTrabajo',
      '/gestion/horarios': 'horarios',
      '/plan-vehiculo': 'planVehiculo',
      '/citas': 'citas',
      '/recepcion': 'recepcionVehiculo',
      '/asistente-ia': 'asistenteIA',
      '/reportes': 'generarReportes'
    };

    if (onNavigate && viewMapping[path]) {
      // Priorizar cambio de vista interna para mantener el estado de la SPA en /app
      onNavigate(viewMapping[path]);
    } else {
      // Solo si el path NO es parte del dashboard principal, usar navegación global
      if (path && typeof path === 'string') {
        const fullPath = `/${tenantSlug}${path}`;
        if (window.location.pathname !== fullPath && window.location.pathname !== `${fullPath}/`) {
          navigate(fullPath);
        }
      }
    }
  };

  if (!isOpen) return null;

  // Determinar si hay alguna acción pendiente para activar el modo fantasma
  const hasPendingAction = messages.some(m => m.action?.estado === 'PENDIENTE');

  return (
    <div className={`fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-140px)] bg-white dark:bg-carbon-900 rounded-3xl shadow-2xl shadow-primary-900/20 border border-neutral-200 dark:border-white/[0.08] flex flex-col z-[60] overflow-hidden transition-all duration-500 animate-in fade-in zoom-in ${hasPendingAction ? 'opacity-40 hover:opacity-100' : 'opacity-100'}`}>

      {/* HEADER */}
      <div className="p-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-carbon-900 to-carbon-800 dark:from-carbon-950 dark:to-carbon-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-burgundy-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <Sparkles size={20} strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-carbon-900 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-white font-bold text-base leading-none">Asistente IA</h3>
            <p className="text-carbon-400 text-[11px] mt-1 font-medium">Listo para ayudarte</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={toggleVoice}
            className={`p-2 rounded-xl transition-colors ${isVoiceEnabled ? 'text-primary-400 bg-primary-500/10' : 'text-carbon-400 hover:text-white hover:bg-white/5'}`}
            title={isVoiceEnabled ? "Silenciar Voz" : "Activar Voz de IA"}
          >
            {isVoiceEnabled ? <Volume2 size={18} className={isSpeaking ? 'animate-pulse text-green-400' : ''} /> : <VolumeX size={18} />}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-carbon-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-carbon-800 border border-white/[0.08] rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={handleClearChat}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-white/[0.05] transition-colors text-left"
                >
                  <Trash2 size={15} /> Limpiar Chat
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-carbon-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50 dark:bg-carbon-950/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className="flex-shrink-0 mt-1">
                {msg.sender === 'user' ? (
                  <div className="w-8 h-8 rounded-xl bg-carbon-200 dark:bg-carbon-800 flex items-center justify-center text-carbon-600 dark:text-neutral-400">
                    <User size={16} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/30 border border-primary-200/50 dark:border-primary-800/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <Bot size={18} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === 'user'
                    ? 'bg-carbon-900 dark:bg-white text-white dark:text-carbon-950 rounded-tr-sm shadow-md'
                    : 'bg-white dark:bg-carbon-800 text-carbon-800 dark:text-neutral-100 border border-neutral-100 dark:border-white/[0.04] rounded-tl-sm shadow-sm'
                  }`}>
                  {msg.text}
                </div>

                {/* ACTION CARD */}
                {msg.action && (
                  <div className="bg-white dark:bg-carbon-800 border border-neutral-100 dark:border-white/[0.08] rounded-2xl p-4 shadow-xl shadow-black/5 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        {msg.action.accion === 'CREAR_CITA' && <Calendar size={18} />}
                        {msg.action.accion === 'REGISTRAR_VEHICULO' && <Car size={18} />}
                        {!['CREAR_CITA', 'REGISTRAR_VEHICULO'].includes(msg.action.accion) && <Wrench size={18} />}
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary-500 dark:text-primary-400">Acción Sugerida</h4>
                        <p className="text-sm font-bold text-carbon-900 dark:text-white">
                          {msg.action.accion.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>

                    {/* 
                      Ocultamos los parámetros aquí para que el usuario mire el formulario real 
                      si el estado es PENDIENTE.
                    */}
                    {msg.action.estado !== 'PENDIENTE' && (
                      <div className="space-y-2 mb-4">
                        {Object.entries(msg.action.parametros)
                          .filter(([key]) => !key.startsWith('_'))
                          .map(([key, val]) => (
                            <div key={key} className="flex justify-between text-xs py-1.5 border-b border-neutral-50 dark:border-white/[0.03]">
                              <span className="text-carbon-500 dark:text-neutral-500 capitalize">{key}:</span>
                              <span className="font-semibold text-carbon-900 dark:text-neutral-200">{val}</span>
                            </div>
                          ))}
                      </div>
                    )}

                    {msg.action.estado === 'EJECUTADA' ? (
                      <div className="flex items-center gap-2 py-1 text-green-600 dark:text-green-400 font-bold text-xs bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                        <CheckCircle2 size={16} /> {msg.action.resultado?.message || 'Acción Completada'}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-1 text-primary-600 dark:text-primary-400 font-bold text-[10px] uppercase tracking-wider bg-primary-50 dark:bg-primary-900/10 px-3 py-2 rounded-lg border border-primary-100 dark:border-primary-900/20">
                        <Sparkles size={14} className="animate-pulse" /> Pendiente de confirmación vía chat
                      </div>
                    )}
                  </div>
                )}

                {/* OPTIONS SELECTION CARDS */}
                {msg.options && msg.options.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 mt-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    {msg.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(opt)}
                        className="flex items-center justify-between p-3.5 bg-white dark:bg-carbon-800 border border-neutral-100 dark:border-white/[0.08] rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:border-primary-200 dark:hover:border-primary-800 transition-all text-left group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-neutral-400 group-hover:text-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                            <User size={16} />
                          </div>
                          <span className="text-sm font-semibold text-carbon-800 dark:text-neutral-200 group-hover:text-primary-700 dark:group-hover:text-primary-400 transition-colors">{opt}</span>
                        </div>
                        <ChevronRight size={16} className="text-neutral-300 group-hover:text-primary-500 transition-colors translate-x-0 group-hover:translate-x-1 duration-200" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Bot size={18} />
              </div>
              <div className="bg-white dark:bg-carbon-800 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center border border-neutral-100 dark:border-white/[0.04] shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* FOOTER: INPUT & ACTIONS */}
      <div className="p-4 bg-white dark:bg-carbon-900 border-t border-neutral-100 dark:border-white/[0.06]">
        {/* Suggested Actions */}
        {suggestedActions.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
            {suggestedActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSend(action)}
                className="whitespace-nowrap px-3.5 py-1.5 bg-neutral-50 dark:bg-carbon-800 border border-neutral-200 dark:border-white/[0.08] text-carbon-600 dark:text-neutral-400 text-xs font-bold rounded-full hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-all flex items-center gap-1.5"
              >
                {action === 'Agendar Cita' && <Calendar size={12} />}
                {action === 'Registrar Vehículo' && <Car size={12} />}
                {action} <ChevronRight size={12} />
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 bg-neutral-100 dark:bg-carbon-950 p-1.5 rounded-2xl border border-neutral-200 dark:border-white/[0.04] focus-within:ring-2 focus-within:ring-primary-500/20 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentConversationId ? "Escribe tu solicitud..." : "Iniciando asistente..."}
            disabled={!currentConversationId}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 text-carbon-900 dark:text-white placeholder-carbon-400 dark:placeholder-neutral-500 disabled:opacity-50"
          />

          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            disabled={!currentConversationId}
            className={`p-2.5 rounded-xl transition-all ${isRecording
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'text-carbon-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-30'
              }`}
            title="Mantén para grabar"
          >
            <Mic size={20} />
          </button>

          <button
            type="submit"
            disabled={!input.trim() || isTyping || !currentConversationId}
            className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:bg-carbon-300 dark:disabled:bg-carbon-800 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-primary-900/20"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;
