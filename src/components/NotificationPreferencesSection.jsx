import { useState, useEffect } from 'react'
import { Card, Button } from './ui'
import usuariosService from '../services/usuariosService'

export const NotificationPreferencesSection = ({ tenantSlug, userId }) => {
  // ESTADO: Carga de preferencias
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)

  // ESTADO: Preferencias
  const [preferencias, setPreferencias] = useState({
    noti_email: true,
    noti_push: true,
  })

  // ESTADO: Feedback
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // EFECTO: Cargar preferencias al montar
  useEffect(() => {
    const cargarPreferencias = async () => {
      if (!tenantSlug || !userId) {
        setErrorMessage('❌ Error: Tenant o usuario no disponible')
        setIsLoadingInitial(false)
        return
      }

      try {
        setIsLoadingInitial(true)
        const data = await usuariosService.obtenerPreferenciasNotificacion(tenantSlug)
        setPreferencias(data.preferencias || {
          noti_email: true,
          noti_push: true,
        })
        setErrorMessage('')
      } catch (error) {
        console.error('Error al cargar preferencias:', error)
        const errorMsg =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          'No se pudo cargar las preferencias'
        setErrorMessage(`❌ Error: ${errorMsg}`)
      } finally {
        setIsLoadingInitial(false)
      }
    }

    cargarPreferencias()
  }, [tenantSlug, userId])

  // Manejar cambio de preferencia
  const handleToggle = async (key) => {
    if (!tenantSlug) {
      setErrorMessage('❌ Error: Tenant no disponible')
      return
    }

    const nuevoValor = !preferencias[key]
    const datosActualizados = {
      ...preferencias,
      [key]: nuevoValor,
    }

    // Actualizar UI inmediatamente (optimistic update)
    setPreferencias(datosActualizados)
    setSuccessMessage('')
    setErrorMessage('')

    // Actualizar en backend
    setIsLoading(true)
    try {
      const response = await usuariosService.actualizarPreferenciasNotificacion(
        tenantSlug,
        { [key]: nuevoValor }
      )

      // Confirmar con datos del backend
      setPreferencias(response.preferencias || datosActualizados)
      setSuccessMessage('✅ Preferencia actualizada correctamente')

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
      setErrorMessage(`❌ Error: ${errorMsg}`)
      console.error('Error al actualizar preferencia:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Mientras carga inicial
  if (isLoadingInitial) {
    return (
      <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          🔔 Preferencias de Notificación
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando preferencias...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
      {/* HEADER */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        🔔 Preferencias de Notificación
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
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
        Controla cómo deseas recibir notificaciones en el futuro. Estos canales estarán disponibles cuando se implemente el sistema de notificaciones.
      </p>

      {/* PREFERENCIAS */}
      <div className="space-y-4">
        {/* NOTIFICACIONES POR EMAIL */}
        <button
          type="button"
          onClick={() => handleToggle('noti_email')}
          disabled={isLoading}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📧</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Notificaciones por Email
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recibe actualizaciones por correo electrónico
              </p>
            </div>
          </div>

          {/* TOGGLE - MUCHO MÁS GRANDE */}
          <div className="flex-shrink-0 ml-4">
            <div
              className={`w-16 h-9 rounded-full flex items-center transition-all ${
                preferencias.noti_email
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`w-8 h-8 bg-white rounded-full shadow-md transform transition-transform flex items-center justify-center ${
                  preferencias.noti_email ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              >
                <span className={`text-lg font-bold ${
                  preferencias.noti_email ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {preferencias.noti_email ? '✓' : '✕'}
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
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Notificaciones Push
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recibe notificaciones instantáneas en el navegador
              </p>
            </div>
          </div>

          {/* TOGGLE - MUCHO MÁS GRANDE */}
          <div className="flex-shrink-0 ml-4">
            <div
              className={`w-16 h-9 rounded-full flex items-center transition-all ${
                preferencias.noti_push
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <div
                className={`w-8 h-8 bg-white rounded-full shadow-md transform transition-transform flex items-center justify-center ${
                  preferencias.noti_push ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              >
                <span className={`text-lg font-bold ${
                  preferencias.noti_push ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {preferencias.noti_push ? '✓' : '✕'}
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* INFORMACIÓN ADICIONAL */}
      <div className="mt-6 p-4 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-gray-400">
        <p>
          💡 <strong>Nota:</strong> Estos son solo tus canales preferidos. El sistema de envío de notificaciones se implementará en el futuro.
        </p>
      </div>
    </Card>
  )
}

export default NotificationPreferencesSection
