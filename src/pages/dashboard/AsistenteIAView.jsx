import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, User, Sparkles, Loader2, Wrench, Mic, Volume2, VolumeX, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { useTenant } from '../../hooks/useTenant'
import assistantService from '../../services/assistantService'

const AsistenteIAView = () => {
  const { user, tenant, tenantSlug } = useTenant()
  
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)

  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const messagesEndRef = useRef(null)

  // Cargar conversaciones reales del backend al montar
  useEffect(() => {
    if (!tenantSlug || initialized) return
    const init = async () => {
      try {
        const convs = await assistantService.getConversations(tenantSlug)
        if (convs.length > 0) {
          // Mapear conversaciones del backend a sesiones locales CON sus mensajes reales
          const mappedSessions = await Promise.all(convs.map(async (c) => {
            try {
              const detail = await assistantService.getConversationMessages(tenantSlug, c.id)
              const msgs = (detail.mensajes && detail.mensajes.length > 0) 
                ? detail.mensajes 
                : [{
                    id: 'welcome-' + c.id,
                    sender: 'ai',
                    text: `¡Hola ${user.nombres || ''}! Soy tu Asistente de AutoTaller Pro. ¿Qué necesitas saber?`,
                  }]
              return {
                id: c.id,
                title: msgs.length > 1 ? (msgs.find(m => m.sender === 'user')?.text?.slice(0, 25) + '...' || 'Conversación') : 'Conversación',
                messages: msgs
              }
            } catch {
              return {
                id: c.id,
                title: 'Conversación',
                messages: [{
                  id: 'welcome-' + c.id,
                  sender: 'ai',
                  text: `¡Hola ${user.nombres || ''}! ¿En qué puedo ayudarte?`,
                }]
              }
            }
          }))
          setSessions(mappedSessions)
          setCurrentSessionId(mappedSessions[0].id)
        } else {
          // Crear primera conversación
          const newConv = await assistantService.createConversation(tenantSlug)
          const firstSession = {
            id: newConv.id,
            title: 'Chat Inicial',
            messages: [
              {
                id: 'welcome',
                sender: 'ai',
                text: `¡Hola ${user.nombres || ''}! Soy tu Asistente de IA de AutoTaller Pro. Estoy aquí para informarte y guiarte sobre cómo usar el sistema, resolver dudas mecánicas o analizar datos de ${tenant.nombre || 'tu taller'}. ¿En qué puedo ayudarte?`,
              }
            ]
          }
          setSessions([firstSession])
          setCurrentSessionId(newConv.id)
        }
      } catch (error) {
        console.error("Error al iniciar conversaciones:", error)
        // Fallback local
        const fallback = {
          id: 'local-1',
          title: 'Chat Inicial',
          messages: [{
            id: 'welcome',
            sender: 'ai',
            text: `¡Hola ${user.nombres || ''}! Estoy listo para responder tus preguntas.`,
          }]
        }
        setSessions([fallback])
        setCurrentSessionId('local-1')
      }
      setInitialized(true)
    }
    init()
  }, [tenantSlug])

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0]
  const messages = currentSession ? currentSession.messages : []

  // Text-to-Speech
  const speakText = useCallback((text) => {
    if (!voiceEnabled || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const cleanText = text.replace(/[*_#`]|[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim()
    if (!cleanText) return
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'es-ES'
    utterance.rate = 1.05
    const voices = window.speechSynthesis.getVoices()
    const esVoice = voices.find(v => v.lang.startsWith('es-'))
    if (esVoice) utterance.voice = esVoice
    window.speechSynthesis.speak(utterance)
  }, [voiceEnabled])

  // Scroll al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  // Crear nueva sesión
  const createNewSession = async () => {
    try {
      const newConv = await assistantService.createConversation(tenantSlug)
      const newSession = {
        id: newConv.id,
        title: 'Nuevo Chat',
        messages: [{
          id: 'welcome-' + newConv.id,
          sender: 'ai',
          text: `¡Hola ${user.nombres || ''}! Nueva conversación iniciada. ¿Qué necesitas saber?`,
        }]
      }
      setSessions(prev => [newSession, ...prev])
      setCurrentSessionId(newConv.id)
    } catch (err) {
      console.error("Error creando nueva sesión:", err)
    }
  }

  const deleteSession = (id, e) => {
    e.stopPropagation()
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== id)
      if (newSessions.length === 0) return prev
      if (id === currentSessionId) {
        setCurrentSessionId(newSessions[0].id)
      }
      return newSessions
    })
  }

  // Speech-to-Text (nativo del navegador)
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Tu navegador no soporta reconocimiento de voz.')
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-ES'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript))
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  // Enviar mensaje REAL a la IA
  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || isTyping || !currentSessionId) return

    const userMsg = { id: Date.now(), sender: 'user', text: input.trim() }

    // Agregar mensaje del usuario a la sesión
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        const newTitle = (s.messages.length <= 1) ? input.trim().slice(0, 25) + '...' : s.title
        return { ...s, title: newTitle, messages: [...s.messages, userMsg] }
      }
      return s
    }))

    setInput('')
    setIsTyping(true)

    try {
      const response = await assistantService.sendMessage(tenantSlug, currentSessionId, userMsg.text)
      const aiText = response.mensaje_ia || 'No pude procesar tu solicitud. ¿Podrías intentar de nuevo?'

      const aiMsg = { id: Date.now() + 1, sender: 'ai', text: aiText }

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [...s.messages, aiMsg] }
        }
        return s
      }))

      if (voiceEnabled) speakText(aiText)
    } catch (error) {
      console.error("Error enviando mensaje:", error)
      const errorMsg = { id: Date.now() + 1, sender: 'ai', text: 'Lo siento, tuve un problema conectando con el cerebro de la IA. ¿Podrías intentar de nuevo?' }
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [...s.messages, errorMsg] }
        }
        return s
      }))
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 md:gap-6">
      {/* SIDEBAR HISTORIAL DE CHATS */}
      <div className="hidden md:flex w-72 flex-col bg-white dark:bg-carbon-900 rounded-2xl border border-neutral-200 dark:border-white/[0.06] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-neutral-200 dark:border-white/[0.06]">
          <button 
            onClick={createNewSession}
            className="w-full py-3 px-4 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition"
          >
            <Plus size={18} strokeWidth={2.5} /> Nuevo Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-carbon-400 dark:text-neutral-500">
            Tus Conversaciones
          </p>
          {sessions.map(s => (
            <div 
              key={s.id} 
              onClick={() => setCurrentSessionId(s.id)} 
              className={`group cursor-pointer flex justify-between items-center px-3 py-3 rounded-xl transition-all duration-200 ${
                s.id === currentSessionId ? 'bg-neutral-100 dark:bg-carbon-800 border border-neutral-200 dark:border-white/[0.06]' : 'border border-transparent hover:bg-neutral-50 dark:hover:bg-white/[0.02]'
              }`}
            >
              <div className={`flex items-center gap-3 truncate text-sm ${s.id === currentSessionId ? 'text-carbon-900 dark:text-white font-medium' : 'text-carbon-600 dark:text-neutral-400'}`}>
                <MessageSquare size={16} className={`shrink-0 ${s.id === currentSessionId ? 'text-primary-500' : 'opacity-70'}`} />
                <span className="truncate">{s.title}</span>
              </div>
              {sessions.length > 1 && (
                <button 
                  onClick={(e) => deleteSession(s.id, e)} 
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-carbon-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  title="Eliminar Chat"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT MAIN AREA */}
      <div className="flex-1 flex flex-col bg-neutral-50 dark:bg-carbon-950 rounded-2xl border border-neutral-200 dark:border-white/[0.06] overflow-hidden shadow-sm">
        {/* HEADER IA */}
        <div className="flex-none p-4 border-b border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-carbon-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-burgundy-600 flex items-center justify-center text-white shadow-md shadow-primary-900/20">
              <Sparkles size={20} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-carbon-900 dark:text-white flex items-center gap-2">
                AutoTaller AI <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold uppercase tracking-wider">En Línea</span>
              </h2>
              <p className="text-sm text-carbon-500 dark:text-neutral-400 leading-tight">Asistente informativo inteligente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled)
                if (voiceEnabled) window.speechSynthesis.cancel()
              }}
              className={`p-2 rounded-lg transition-colors ${voiceEnabled ? 'text-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'text-carbon-500 hover:text-carbon-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-carbon-800'}`}
              title={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
            >
              {voiceEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>

        {/* CHAT MESSAGES AREA */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex max-w-[85%] sm:max-w-[70%] gap-3 ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* AVATAR */}
                <div className="flex-shrink-0">
                  {msg.sender === 'user' ? (
                    <div className="w-8 h-8 rounded-full bg-carbon-200 dark:bg-carbon-800 flex items-center justify-center text-carbon-600 dark:text-neutral-300">
                      <User size={16} />
                    </div>
              ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800/50 flex items-center justify-center text-primary-600 dark:text-primary-400">
                      <Bot size={18} />
                    </div>
                  )}
                </div>

                {/* BUBBLE */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user' ?
                       'bg-gradient-to-br from-carbon-800 to-carbon-900 dark:from-white dark:to-neutral-200 text-white dark:text-carbon-900 rounded-tr-sm shadow-md'
                      : 'bg-white dark:bg-carbon-900 text-carbon-800 dark:text-neutral-200 border border-neutral-200 dark:border-white/[0.06] rounded-tl-sm shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex w-full justify-start">
              <div className="flex max-w-[85%] gap-3 flex-row">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800/50 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <Bot size={18} />
                  </div>
                </div>
                <div className="p-4 rounded-2xl rounded-tl-sm bg-white dark:bg-carbon-900 border border-neutral-200 dark:border-white/[0.06] shadow-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="flex-none p-4 bg-white dark:bg-carbon-900 border-t border-neutral-200 dark:border-white/[0.06]">
          <form
            onSubmit={handleSend}
            className="flex items-center gap-3 max-w-4xl mx-auto relative"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregúntale a la IA sobre citas, ingresos o diagnósticos..."
                className="w-full pl-4 pr-12 py-3.5 bg-neutral-100 dark:bg-carbon-950 border border-neutral-200 dark:border-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:focus:ring-primary-400/50 focus:border-transparent text-carbon-900 dark:text-white placeholder-carbon-400 dark:placeholder-neutral-500 transition-all"
                disabled={isTyping}
              />
              <button
                type="button"
                onClick={startListening}
                className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center p-2 rounded-lg transition-colors ${
                  isListening ? 'text-red-500 bg-red-100 dark:bg-red-900/30 animate-pulse' : 'text-carbon-400 hover:text-primary-600 dark:text-neutral-500 dark:hover:text-primary-400'
                }`}
                title="Dictar por voz"
              >
                 <Mic size={18} />
              </button>
            </div>
            
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-r from-primary-600 to-burgundy-600 flex items-center justify-center text-white shadow-lg shadow-primary-900/20 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] text-carbon-400 dark:text-neutral-500">
              Asistente informativo conectado a la IA real de AutoTaller Pro.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AsistenteIAView
