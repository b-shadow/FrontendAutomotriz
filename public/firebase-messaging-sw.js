/* global importScripts, firebase */

importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyBfgODLHOBB4txVAHc_xTkJxoJ1QqrCOQo',
  authDomain: 'si2-taller-88be4.firebaseapp.com',
  projectId: 'si2-taller-88be4',
  storageBucket: 'si2-taller-88be4.firebasestorage.app',
  messagingSenderId: '447057788953',
  appId: '1:447057788953:web:b52336226b8e176a252a88',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Nueva notificacion'
  const options = {
    body: payload?.notification?.body || 'Tienes una nueva actualizacion.',
  }

  self.registration.showNotification(title, options)
})
