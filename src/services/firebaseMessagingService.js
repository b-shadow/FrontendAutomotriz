import { initializeApp } from 'firebase/app'
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from 'firebase/messaging'
import { firebaseConfig, firebaseWebPushVapidKey } from '../config/firebaseConfig'
import tokenStorage from './tokenStorage'
import usuariosService from './usuariosService'

const app = initializeApp(firebaseConfig)

let foregroundListenerBound = false

const getBrowserMessaging = async () => {
  const supported = await isSupported()
  if (!supported) {
    throw new Error('Este navegador no soporta Firebase Cloud Messaging.')
  }
  return getMessaging(app)
}

const firebaseMessagingService = {
  getPermissionStatus() {
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      return 'unsupported'
    }
    return Notification.permission
  },

  async requestPermissionAndRegisterToken(tenantSlug) {
    if (!tenantSlug) {
      throw new Error('Tenant no disponible para registrar notificaciones push.')
    }
    if (typeof window === 'undefined' || typeof Notification === 'undefined') {
      throw new Error('Las notificaciones push no estan disponibles en este entorno.')
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      if (permission === 'denied') {
        throw new Error('Las notificaciones estan bloqueadas en el navegador. Debes habilitarlas manualmente en los permisos del sitio.')
      }
      throw new Error('Debes activar las notificaciones desde el aviso del navegador para registrar este dispositivo.')
    }

    const messaging = await getBrowserMessaging()
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const fcmToken = await getToken(messaging, {
      vapidKey: firebaseWebPushVapidKey,
      serviceWorkerRegistration: registration,
    })

    if (!fcmToken) {
      throw new Error('No se pudo obtener el token push de Firebase.')
    }

    await usuariosService.registrarTokenPush(tenantSlug, {
      token: fcmToken,
      plataforma: 'WEB',
      device_label: window.navigator.platform || 'Web',
      user_agent: window.navigator.userAgent,
    })

    tokenStorage.setTenantPushToken(tenantSlug, fcmToken)
    tokenStorage.setTenantPushPromptPending(tenantSlug, false)
    return fcmToken
  },

  async syncIfGranted(tenantSlug) {
    if (
      !tenantSlug ||
      typeof window === 'undefined' ||
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted'
    ) {
      return null
    }
    return this.requestPermissionAndRegisterToken(tenantSlug)
  },

  async disablePushToken(tenantSlug) {
    const currentToken = tokenStorage.getTenantPushToken(tenantSlug)
    if (!currentToken) {
      return
    }

    try {
      await usuariosService.desactivarTokenPush(tenantSlug, { token: currentToken })
    } catch (error) {
      console.warn('No se pudo desactivar el token push en backend:', error)
    }

    try {
      const messaging = await getBrowserMessaging()
      await deleteToken(messaging)
    } catch (error) {
      console.warn('No se pudo eliminar el token local de Firebase:', error)
    }

    tokenStorage.setTenantPushToken(tenantSlug, null)
  },

  async deactivateCurrentPushToken(tenantSlug) {
    if (!tenantSlug) return
    await this.disablePushToken(tenantSlug)
  },

  async bindForegroundListener() {
    if (foregroundListenerBound || typeof window === 'undefined') {
      return
    }

    try {
      const messaging = await getBrowserMessaging()
      onMessage(messaging, (payload) => {
        const title = payload?.notification?.title || 'Nueva notificacion'
        const body = payload?.notification?.body || 'Tienes una nueva actualizacion.'

        window.dispatchEvent(new CustomEvent('firebase-foreground-message', { detail: payload }))

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(title, { body })
        }
      })
      foregroundListenerBound = true
    } catch (error) {
      console.warn('No se pudo registrar listener foreground de Firebase:', error)
    }
  },
}

export default firebaseMessagingService
