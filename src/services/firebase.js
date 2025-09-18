import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseApp = initializeApp({
  apiKey: "AIzaSyBgnlzAzAe1R7pZwjQJVRpUjKdA470G6TY",
  authDomain: "sindiapp-notification.firebaseapp.com",
  projectId: "sindiapp-notification",
  storageBucket: "sindiapp-notification.firebasestorage.app",
  messagingSenderId: "448324716707",
  appId: "1:448324716707:web:401916deff3bade1f55716",
});

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(firebaseApp);
const vapidKey = 'BDdP-T2uVLZkytvcZ3cy7zls0LTdwRkMcsU-wDELTTmCX_PqCIc7Y5MXG9Qqau1RFOBJFJvy5lqaSITspzIgEyI';

export default {
  async getToken() {
    try {
      const registration = await navigator.serviceWorker.ready || await navigator.serviceWorker.register('/sw.js');
      return await getToken(messaging, { vapidKey: vapidKey, serviceWorkerRegistration: registration });
    } catch (error) {
      console.error('Error retrieving Firebase Push Notification token.', error);
    }
  },
}