import { initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'

// Your web app's Firebase configuration
const firebaseApp = initializeApp({
  apiKey: 'AIzaSyCO-cXs_d-hc5TUGm3Fqf8IBRvgO7RdtxI',
  authDomain: 'cartappio.firebaseapp.com',
  projectId: 'cartappio',
  storageBucket: 'cartappio.firebasestorage.app',
  messagingSenderId: '633594192092',
  appId: '1:633594192092:web:09faa88f635f93205e5419',
  measurementId: 'G-LH1J4W7QY8',
})

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(firebaseApp)
const vapidKey =
  'BLTAuFleVwsme2xsAlGfhnh7fP0aVvoWtYs9XG13UpKmDRb4uij1iNhPPdAebimhGblsWS8JLbz3LLoTuDHHDoM'

export default {
  async getToken() {
    try {
      let registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        const swFile =
          typeof process !== 'undefined' && process.env.SERVICE_WORKER_FILE
            ? process.env.SERVICE_WORKER_FILE
            : '/sw.js'
        await navigator.serviceWorker.register(swFile)
      }
      registration = await navigator.serviceWorker.ready

      return await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration,
      })
    } catch (error) {
      console.error('Error retrieving Firebase Push Notification token.', error)
      throw error
    }
  },
}
