import { initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'
import $sys from 'src/lambdatt'

const configs = $sys.getConfigs()

// Your web app's Firebase configuration
const firebaseApp = initializeApp(configs.fcm.app)

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(firebaseApp)
const vapidKey = configs.fcm.vapidKey

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
