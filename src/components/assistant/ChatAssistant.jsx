import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Send, Mic, Sparkles, Bot, User,
  Loader2, CheckCircle2, ChevronRight,
  MoreHorizontal, Volume2, VolumeX, Trash2,
  Calendar, Car, Wrench, FileText, UserPlus, Package, AlertTriangle,
  History, ArrowLeft, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../hooks/useTenant';
import assistantService from '../../services/assistantService';
import DynamicAIPrompt from './DynamicAIPrompt';

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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [blockedMessageId, setBlockedMessageId] = useState(null);

  // Estados para historial de chat
  const [viewMode, setViewMode] = useState('chat'); // 'chat', 'history_list', 'history_detail'
  const [historyList, setHistoryList] = useState([]);
  const [historyMessages, setHistoryMessages] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [viewingHistoryTitle, setViewingHistoryTitle] = useState('');

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Formateador seguro de fecha para evitar RangeError y caídas de renderizado
  const formatSafeDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return 'Fecha inválida';
      return d.toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return 'Fecha inválida';
    }
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
      const resData = await assistantService.getConversations(tenantSlug);
      const data = resData ? (Array.isArray(resData) ? resData : (resData.results || resData.data || [])) : [];
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
            setBlockedMessageId(null);
            return;
          }
        } catch (err) {
          console.error("[ChatAssistant] Error cargando mensajes:", err);
        }
        // Fallback: sin mensajes previos
        setBlockedMessageId(null);
        setMessages([{
          id: 'welcome',
          sender: 'ai',
          text: `¡Hola ${user.nombres}! Soy tu asistente de AutoTaller Pro. ¿En qué puedo ayudarte hoy?`,
        }]);
        setSuggestedActions(["Agendar Cita", "Ver Vehículos", "Estado de Taller"]);
      } else {
        const newConv = await assistantService.createConversation(tenantSlug);
        setCurrentConversationId(newConv.id);
        setBlockedMessageId(null);
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

  const handleHistoryToggle = async () => {
    if (viewMode !== 'chat') {
      setViewMode('chat');
    } else {
      setViewMode('history_list');
      await loadHistoryList();
    }
  };

  const loadHistoryList = async () => {
    setIsLoadingHistory(true);
    try {
      const resData = await assistantService.getConversations(tenantSlug, 'ARCHIVADA');
      const list = resData ? (Array.isArray(resData) ? resData : (resData.results || resData.data || [])) : [];
      setHistoryList(list);
    } catch (err) {
      console.error("Error cargando historial de conversaciones:", err);
      setHistoryList([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSelectHistory = async (conv) => {
    if (!conv) return;
    setViewMode('history_detail');
    setIsLoadingHistory(true);
    const dateStr = formatSafeDate(conv.created_at);
    setViewingHistoryTitle(`Chat del ${dateStr}`);
    try {
      const detail = await assistantService.getConversationMessages(tenantSlug, conv.id);
      setHistoryMessages(detail.mensajes || []);
    } catch (err) {
      console.error("Error cargando mensajes del historial:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleClearChat = async () => {
    setShowMenu(false);
    if (!currentConversationId) return;
    setBlockedMessageId(null);
    setViewMode('chat');
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

    setBlockedMessageId(null);

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
        ui_type: response.ui_type,
      };

      setMessages(prev => [...prev, aiMsg]);
      setSuggestedActions(response.suggested_actions || []);

      if (response.options && response.options.length > 0) {
        const filteredResponseOptions = response.options.filter(opt => opt && opt.toLowerCase() !== 'cancelar' && opt.toLowerCase() !== 'cancel');
        if (filteredResponseOptions.length > 0) {
          setBlockedMessageId(aiMsg.id);
        } else {
          setBlockedMessageId(null);
        }
      }
      
      // Permitimos que el usuario siga escribiendo o hablando sin restricciones
      // Se mantiene blockedMessageId para saber qué tarjeta de opciones está activa
      // pero ya no bloquearemos los inputs.

      if (isVoiceEnabled) {
        speakText(aiMsg.text);
      }

      // Lógica de navegación determinista (ANTES de notificar la acción)
      if (response.accion?.accion) {
        console.log("IA solicitando navegación para acción:", response.accion.accion);
        handleActionNavigation(response.accion.accion);
      }

      // Notificar al dashboard sobre la acción propuesta para el pre-llenado
      // Esperamos unos milisegundos para asegurar que el componente de destino esté montado si hubo redirección
      if (onActionProposed && response.accion) {
        setTimeout(() => {
          console.log("Notificando acción propuesta al contexto global:", response.accion.accion);
          onActionProposed({ ...response.accion, _ts: Date.now() });
        }, 300);
      }

      // Si la IA confirma que ejecutó algo (ej: tras un "Sí"), refrescar datos globales
      // EXCEPCIÓN: Acciones que requieren simulación visual extendida (Ghost User)
      const isGhostAction = ['COMPRAR_PLAN', 'RELLENAR_PAGO', 'CANCELAR_CAMBIO', 'REGISTRAR_VEHICULO', 'BUSCAR_VEHICULO', 'FILTRAR_CITAS', 'CAMBIAR_NOMBRES_PERSONALES', 'CAMBIAR_TELEFONO', 'CAMBIAR_CONTRASENA', 'ACTUALIZAR_PREFERENCIAS', 'CAMBIAR_NOMBRE_EMPRESA', 'AGREGAR_SERVICIO', 'REGISTRAR_ESPACIO', 'EDITAR_ESPACIO', 'VER_HORARIOS_ESPACIO', 'AGREGAR_HORARIO_ESPACIO', 'EDITAR_HORARIO_ESPACIO', 'BUSCAR_PLAN_VEHICULO', 'VER_PLAN_VEHICULO', 'EDITAR_PLAN_VEHICULO', 'CAMBIAR_ESTADO_PLAN_VEHICULO', 'AGREGAR_DETALLE_PLAN_VEHICULO', 'FILTRAR_BITACORA', 'EXPORTAR_BITACORA', 'VER_REPORTE_GLOBAL', 'VER_REPORTE_VEHICULO', 'VER_REPORTE_PRESUPUESTO', 'VER_REPORTE_INVENTARIO', 'EXPORTAR_REPORTE', 'CREAR_CATEGORIA_INVENTARIO', 'CREAR_ITEM_INVENTARIO', 'CREAR_PROVEEDOR', 'AGREGAR_ITEM_COMPRA', 'CONFIGURAR_BACKUP', 'CREAR_USUARIO', 'CAMBIAR_ROL_USUARIO'].includes(response.accion?.accion);
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

  // --- Lógica de Voz con Web Speech API (sin tokens) ---
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('[Web Speech] Transcripción:', transcript);
      if (transcript.trim()) {
        handleSend(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('[Web Speech] Error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
      // Redirigir usando el mapa estático de acciones (opcional en confirmación si ya se redirigió antes)
      if (mActionType) {
        handleActionNavigation(mActionType);
      }
    } catch (error) {
      console.error("Error confirmando acción:", error);
    }
  };

  const handleActionNavigation = (actionName) => {
    if (!actionName) return;

    // Mapa estático de Acciones de IA -> IDs de vista del TenantDashboard
    const actionViewMapping = {
      'CAMBIAR_NOMBRES_PERSONALES': 'editarPerfil',
      'CAMBIAR_TELEFONO': 'editarPerfil',
      'CAMBIAR_CONTRASENA': 'editarPerfil',
      'ACTUALIZAR_PREFERENCIAS': 'editarPerfil',
      'CAMBIAR_NOMBRE_EMPRESA': 'gestionEmpresa',
      'COMPRAR_PLAN': 'gestionSuscripciones',
      'RELLENAR_PAGO': 'gestionSuscripciones',
      'CANCELAR_CAMBIO': 'gestionSuscripciones',
      'REGISTRAR_VEHICULO': 'gestionVehiculos',
      'BUSCAR_VEHICULO': 'gestionVehiculos',
      'AGREGAR_SERVICIO': 'catalogoServicios',
      'REGISTRAR_ESPACIO': 'espaciosTrabajo',
      'EDITAR_ESPACIO': 'espaciosTrabajo',
      'VER_HORARIOS_ESPACIO': 'horarios',
      'AGREGAR_HORARIO_ESPACIO': 'horarios',
      'EDITAR_HORARIO_ESPACIO': 'horarios',
      'CREAR_CITA': 'citas',
      'FILTRAR_CITAS': 'citas',
      'BUSCAR_PLAN_VEHICULO': 'planVehiculo',
      'VER_PLAN_VEHICULO': 'planVehiculo',
      'EDITAR_PLAN_VEHICULO': 'planVehiculo',
      'CAMBIAR_ESTADO_PLAN_VEHICULO': 'planVehiculo',
      'AGREGAR_DETALLE_PLAN_VEHICULO': 'planVehiculo',
      'FILTRAR_BITACORA': 'bitacora',
      'EXPORTAR_BITACORA': 'bitacora',
      'VER_REPORTE_GLOBAL': 'generarReportes',
      'VER_REPORTE_VEHICULO': 'generarReportes',
      'VER_REPORTE_PRESUPUESTO': 'generarReportes',
      'VER_REPORTE_INVENTARIO': 'generarReportes',
      'EXPORTAR_REPORTE': 'generarReportes',
      'CREAR_CATEGORIA_INVENTARIO': 'inventario',
      'CREAR_ITEM_INVENTARIO': 'inventario',
      'CREAR_PROVEEDOR': 'proveedores',
      'AGREGAR_ITEM_COMPRA': 'comprasInsumos',
      'CONFIGURAR_BACKUP': 'gestionBackup',
      'CREAR_USUARIO': 'gestionUsuariosRoles',
      'CAMBIAR_ROL_USUARIO': 'gestionUsuariosRoles'
    };

    const viewId = actionViewMapping[actionName];
    if (onNavigate && viewId) {
      // Navegación segura interna basada estrictamente en el viewId
      onNavigate(viewId);
    } else {
      console.warn(`No se encontró vista para la acción: ${actionName}`);
    }
  };

  if (!isOpen) return null;

  // Determinar si hay alguna acción pendiente para activar el modo fantasma
  const hasPendingAction = messages.some(m => m.action?.estado === 'PENDIENTE');

  return (
    <div className={`fixed bottom-24 right-6 w-[400px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-140px)] bg-white dark:bg-carbon-900 rounded-3xl shadow-2xl shadow-primary-900/20 border border-neutral-200 dark:border-white/[0.08] flex flex-col z-[60] overflow-hidden transition-all duration-500 animate-in fade-in zoom-in ${hasPendingAction ? 'opacity-40 hover:opacity-100' : 'opacity-100'}`}>

      {/* HEADER */}
      <div className="p-4 border-b border-neutral-100 dark:border-white/[0.06] bg-gradient-to-r from-carbon-900 to-carbon-800 dark:from-carbon-950 dark:to-carbon-900 flex items-center justify-between">
        
        {viewMode === 'chat' && (
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
        )}

        {viewMode === 'history_list' && (
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode('chat')} className="p-1.5 text-carbon-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h3 className="text-white font-bold text-base leading-none">Historial</h3>
              <p className="text-carbon-400 text-[11px] mt-1 font-medium">Chats previos</p>
            </div>
          </div>
        )}

        {viewMode === 'history_detail' && (
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode('history_list')} className="p-1.5 text-carbon-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft size={16} />
            </button>
            <div>
              <h3 className="text-white font-bold text-base leading-none truncate max-w-[180px]">{viewingHistoryTitle}</h3>
              <p className="text-carbon-400 text-[11px] mt-1 font-medium">Solo lectura</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button 
            onClick={handleHistoryToggle}
            className={`p-2 rounded-xl transition-colors ${viewMode !== 'chat' ? 'text-primary-400 bg-primary-500/10' : 'text-carbon-400 hover:text-white hover:bg-white/5'}`}
            title="Historial de chats"
          >
            <History size={18} />
          </button>
          
          {viewMode === 'chat' && (
            <button 
              onClick={toggleVoice}
              className={`p-2 rounded-xl transition-colors ${isVoiceEnabled ? 'text-primary-400 bg-primary-500/10' : 'text-carbon-400 hover:text-white hover:bg-white/5'}`}
              title={isVoiceEnabled ? "Silenciar Voz" : "Activar Voz de IA"}
            >
              {isVoiceEnabled ? <Volume2 size={18} className={isSpeaking ? 'animate-pulse text-green-400' : ''} /> : <VolumeX size={18} />}
            </button>
          )}

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
      {viewMode === 'chat' && (
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

                  {/* OPTIONS SELECTION CARDS */}
                  {msg.ui_type && msg.options && msg.options.length > 0 ? (
                    <DynamicAIPrompt 
                      type={msg.ui_type} 
                      options={msg.options} 
                      onSelect={(val) => { setBlockedMessageId(null); handleSend(val); }} 
                      disabled={blockedMessageId !== null && blockedMessageId !== msg.id}
                    />
                  ) : msg.options && msg.options.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 mt-2 animate-in fade-in slide-in-from-left-2 duration-300">
                      {msg.options
                        .filter(opt => opt && opt.toLowerCase() !== 'cancelar' && opt.toLowerCase() !== 'cancel')
                        .map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => { setBlockedMessageId(null); handleSend(opt); }}
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
                      {blockedMessageId === msg.id && msg.options.filter(opt => opt && opt.toLowerCase() !== 'cancelar' && opt.toLowerCase() !== 'cancel').length > 0 && (
                        <button
                          type="button"
                          onClick={() => setBlockedMessageId(null)}
                          className="flex items-center justify-center gap-1.5 p-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/35 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 duration-150 mt-1"
                        >
                          Cancelar
                        </button>
                      )}
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
          {isTranscribing && (
            <div className="flex justify-end pr-2 animate-pulse">
              <div className="text-[11px] font-semibold text-primary-500 bg-primary-50 dark:bg-primary-950/40 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Loader2 size={12} className="animate-spin" />
                Procesando audio...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {viewMode === 'history_list' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/50 dark:bg-carbon-950/30">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="animate-spin text-primary-500 mb-2" size={24} />
              <p className="text-sm text-carbon-500 dark:text-neutral-400">Cargando historial...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Clock className="text-neutral-300 dark:text-carbon-700 mb-3" size={40} />
              <p className="text-sm font-semibold text-carbon-600 dark:text-neutral-300">No hay chats archivados</p>
              <p className="text-xs text-carbon-500 dark:text-neutral-500 mt-1">Las conversaciones que limpies se archivarán aquí.</p>
            </div>
          ) : (
            historyList.map((conv) => {
              if (!conv) return null;
              const dateStr = formatSafeDate(conv.created_at);
              return (
                <button
                  key={conv.id || Math.random().toString()}
                  onClick={() => handleSelectHistory(conv)}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-carbon-800 border border-neutral-100 dark:border-white/[0.06] rounded-2xl hover:border-primary-300 dark:hover:border-primary-800 transition-all text-left shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-carbon-100 dark:bg-carbon-700 flex items-center justify-center text-carbon-600 dark:text-neutral-300">
                      <Bot size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-carbon-900 dark:text-white">Chat #{conv.id ? String(conv.id).substring(0, 8) : ''}</h4>
                      <p className="text-[11px] text-carbon-500 dark:text-neutral-400 mt-1">{dateStr}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-400" />
                </button>
              );
            })
          )}
        </div>
      )}

      {viewMode === 'history_detail' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50 dark:bg-carbon-950/30">
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="animate-spin text-primary-500 mb-2" size={24} />
              <p className="text-sm text-carbon-500 dark:text-neutral-400">Cargando mensajes...</p>
            </div>
          ) : (
            historyMessages.map((msg) => {
              if (!msg) return null;
              return (
                <div key={msg.id || Math.random().toString()} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                    <div className="p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap bg-white dark:bg-carbon-800 text-carbon-800 dark:text-neutral-100 border border-neutral-100 dark:border-white/[0.04] shadow-sm">
                      {msg.text || ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* FOOTER: INPUT & ACTIONS */}
      {viewMode === 'chat' && (
        <div className="p-4 bg-white dark:bg-carbon-900 border-t border-neutral-100 dark:border-white/[0.06]">
          {/* Suggested Actions */}
          {suggestedActions.length > 0 && !blockedMessageId && (
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
              placeholder={
                !currentConversationId 
                  ? "Iniciando asistente..." 
                  : "Escribe tu solicitud..."
              }
              disabled={!currentConversationId}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 text-carbon-900 dark:text-white placeholder-carbon-400 dark:placeholder-neutral-500 disabled:opacity-50"
            />

            <button
              type="button"
              onClick={handleMicClick}
              disabled={!currentConversationId}
              className={`p-2.5 rounded-xl transition-all ${isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-carbon-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-30'
                }`}
              title={isRecording ? "Hacer clic para detener" : "Hacer clic para grabar"}
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
      )}
    </div>
  );
};

export default ChatAssistant;
