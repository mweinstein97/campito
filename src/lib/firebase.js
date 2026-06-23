import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID

export const isOnline = () => !!projectId

let db = null

if (projectId) {
  const app = initializeApp({
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  })
  db = getFirestore(app)
}

export { db }
