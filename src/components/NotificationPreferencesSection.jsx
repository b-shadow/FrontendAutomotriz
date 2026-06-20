import { XCircle, CheckCircle, Bell, Mail, Check, X, Lightbulb } from 'lucide-react';
import { useState, useEffect } from 'react'
import { Card, Button } from './ui'
import firebaseMessagingService from '../services/firebaseMessagingService'
import usuariosService from '../services/usuariosService'
import { useRefresh } from '../context/RefreshContext'
import { useGhostAutomation } from '../hooks/useGhostAutomation'
import { Sparkles } from 'lucide-react'

export const NotificationPreferencesSection = ({ tenantSlug, userId, aiPrefill, onSuccess }) => {
  const { refreshTick } = useRefresh()
  // ESTADO: Carga de preferencias
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)

  const [preferencias, setPreferencias] = useState({
    noti_email: true, noti_push: true,
  })
  const { isSimulating, setIsSimulating, simulateDelay } = useGhostAutomation()

  // ESTADO: Feedback
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // EFECTO: Cargar preferencias al montar
  useEffect(() => {
    const cargarPreferencias = async () => {
      if (!tenantSlug || !userId) {
        setErrorMessage(<><XCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Error: Tenant o usuario no disponible</>)
        setIsLoadingInitial(false)
        return
      }

      try {
        setIsLoadingInitial(true)
        const data = await usuariosService.obtenerPreferenciasNotificacion(tenantSlug)
        setPreferencias(data.preferencias || {
          noti_email: true, noti_push: true,
        })
        if (tenantSlug) {
          firebaseMessagingService.syncIfGranted(tenantSlug).catch(() => {})
        }
        setErrorMessage('')
      } catch (error) {
        console.error('Error al cargar preferencias:', error)
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          'No se pudo cargar las preferencias'
        setErrorMessage(` Error: ${errorMsg}`)
      } finally {
        setIsLoadingInitial(false)
      }
    }

    cargarPreferencias()
  }, [tenantSlug, userId, refreshTick])

  // Manejar cambio de preferencia
  const handleToggle = async (key) => {
    if (!tenantSlug) {
      setErrorMessage(<><XCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Error: Tenant no disponible</>)
      return
    }

    const nuevoValor = !preferencias[key]
    const datosActualizados = {
      ...preferencias, [key]: nuevoValor,
    }

    // Actualizar UI inmediatamente (optimistic update)
    setPreferencias(datosActualizados)
    setSuccessMessage('')
    setErrorMessage('')

    // Actualizar en backend
    setIsLoading(true)
    try {
      if (key === 'noti_push' && nuevoValor) {
        await firebaseMessagingService.requestPermissionAndRegisterToken(tenantSlug)
      }

      const response = await usuariosService.actualizarPreferenciasNotificacion(
        tenantSlug,
        { [key]: nuevoValor }
      )

      // Confirmar con datos del backend
      setPreferencias(response.preferencias || datosActualizados)
      setSuccessMessage(<><CheckCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Preferencia actualizada correctamente</>)

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      // Revertir cambio en caso de error
      setPreferencias({
        noti_email: key === 'noti_email' ? !nuevoValor : preferencias.noti_email,
        noti_push: key === 'noti_push' ? !nuevoValor : preferencias.noti_push,
      })

      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'No se pudo actualizar la preferencia'
      setErrorMessage(` Error: ${errorMsg}`)
      console.error('Error al actualizar preferencia:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // EFECTO: Automatización de la IA (Ghost Click)
  useEffect(() => {
    if (!aiPrefill || aiPrefill.type !== 'ACTUALIZAR_PREFERENCIAS') return;

    const processPrefill = async () => {
      setIsSimulating(true);
      console.log("Notificaciones: Iniciando simulación para", aiPrefill);

      // Si la IA sugiere cambiar email
      if (aiPrefill.noti_email !== undefined) {
        console.log(`Notificaciones: Cambiando email a ${aiPrefill.noti_email}`);
        await simulateDelay(800); // Delay para WOW
        setPreferencias(prev => ({ ...prev, noti_email: aiPrefill.noti_email }));
      }

      // Si la IA sugiere cambiar push
      if (aiPrefill.noti_push !== undefined) {
        console.log(`Notificaciones: Cambiando push a ${aiPrefill.noti_push}`);
        await simulateDelay(600);
        setPreferencias(prev => ({ ...prev, noti_push: aiPrefill.noti_push }));
      }

      setIsSimulating(false);

      if (aiPrefill.status === 'EJECUTADA' || aiPrefill.estado === 'EJECUTADA') {
        try {
          const payload = {};
          if (aiPrefill.noti_email !== undefined) payload.noti_email = aiPrefill.noti_email;
          if (aiPrefill.noti_push !== undefined) payload.noti_push = aiPrefill.noti_push;
          
          if (Object.keys(payload).length > 0) {
            const response = await usuariosService.actualizarPreferenciasNotificacion(tenantSlug, payload);
            if (response && response.preferencias) {
              setPreferencias(response.preferencias);
            }
            setSuccessMessage(<><CheckCircle className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Preferencias guardadas por IA</>);
            setTimeout(() => setSuccessMessage(''), 3000);
          }
        } catch (error) {
          console.error('Error guardando preferencias IA:', error);
        } finally {
          if (onSuccess) onSuccess();
        }
      }
    };

    processPrefill();
  }, [aiPrefill?._ts]); // Usar el timestamp para asegurar que se ejecute en cada nueva propuesta

  // Mientras carga inicial
  if (isLoadingInitial) {
    return (
      <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
        <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-4">
          <Bell className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Preferencias de Notificación
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-carbon-600 dark:text-neutral-400">Cargando preferencias...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
      {/* HEADER */}
      <h3 className="text-lg font-bold text-carbon-900 dark:text-white mb-4 flex items-center gap-2">
        <Bell className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> Preferencias de Notificación
        {isSimulating && <Sparkles className="text-primary-500 animate-pulse ml-2" size={18} />}
      </h3>

      {/* MENSAJES DE ÉXITO */}
      {successMessage && (
        <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-400 text-sm mb-4">
          {successMessage}
        </div>
      )}

      {/* MENSAJES DE ERROR */}
      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm mb-4">
          {errorMessage}
        </div>
      )}

      {/* DESCRIPCIÓN */}
      <p className="text-sm text-carbon-700 dark:text-neutral-300 mb-6">
        Controla cómo deseas recibir notificaciones de la operación del taller.
      </p>

      {/* PREFERENCIAS */}
      <div className="space-y-4">
        {/* NOTIFICACIONES POR EMAIL */}
        <button
          type="button"
          onClick={() => handleToggle('noti_email')}
          disabled={isLoading}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-carbon-700 rounded-lg border border-neutral-200 dark:border-white/[0.08] hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl"><Mail className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></span>
            <div>
              <p className="font-semibold text-carbon-900 dark:text-white">
                Notificaciones por Email
              </p>
              <p className="text-sm text-carbon-600 dark:text-neutral-400">
                Recibe actualizaciones por correo electrónico
              </p>
            </div>
          </div>

          {/* TOGGLE - MUCHO MÁS GRANDE */}
          <div className="flex-shrink-0 ml-4">
            <div
              className={`w-16 h-9 rounded-full flex items-center transition-all ${preferencias.noti_email ?
                  'bg-blue-600'
                  : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
            >
              <div
                className={`w-8 h-8 bg-white rounded-full shadow-md transform transition-transform flex items-center justify-center ${preferencias.noti_email ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
              >
                <span className={`text-lg font-bold ${preferencias.noti_email ? 'text-blue-600' : 'text-neutral-400'
                  }`}>
                  {preferencias.noti_email ? <><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></> : <><X className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></>}
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* NOTIFICACIONES PUSH */}
        <button
          type="button"
          onClick={() => handleToggle('noti_push')}
          disabled={isLoading}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-carbon-700 rounded-lg border border-neutral-200 dark:border-white/[0.08] hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl"><Bell className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></span>
            <div>
              <p className="font-semibold text-carbon-900 dark:text-white">
                Notificaciones Push
              </p>
              <p className="text-sm text-carbon-600 dark:text-neutral-400">
                Recibe notificaciones instantáneas en el navegador
              </p>
            </div>
          </div>

          {/* TOGGLE - MUCHO MÁS GRANDE */}
          <div className="flex-shrink-0 ml-4">
            <div
              className={`w-16 h-9 rounded-full flex items-center transition-all ${preferencias.noti_push ?
                  'bg-blue-600'
                  : 'bg-neutral-300 dark:bg-neutral-600'
                }`}
            >
              <div
                className={`w-8 h-8 bg-white rounded-full shadow-md transform transition-transform flex items-center justify-center ${preferencias.noti_push ? 'translate-x-7' : 'translate-x-0.5'
                  }`}
              >
                <span className={`text-lg font-bold ${preferencias.noti_push ? 'text-blue-600' : 'text-neutral-400'
                  }`}>
                  {preferencias.noti_push ? <><Check className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></> : <><X className="inline-block mx-1 text-current" size={20} strokeWidth={2} /></>}
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* INFORMACIÓN ADICIONAL */}
      <div className="mt-6 p-4 bg-white dark:bg-carbon-700 rounded-lg border border-neutral-200 dark:border-white/[0.08] text-sm text-carbon-600 dark:text-neutral-400">
        <p>
          <Lightbulb className="inline-block mx-1 text-current" size={20} strokeWidth={2} /> <strong>Nota:</strong> Si desactivas <code>noti_push</code>, no se enviarán notificaciones push aunque tu dispositivo esté registrado.
        </p>
      </div>
    </Card>
  )
}

export default NotificationPreferencesSection
