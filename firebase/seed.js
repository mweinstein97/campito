// Script para poblar Firestore con el checklist inicial y los viajeros
// Ejecutar UNA SOLA VEZ con: node firebase/seed.js
// Requiere: GOOGLE_APPLICATION_CREDENTIALS apuntando a un service account
// O correrlo desde la Firebase Admin SDK

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Para correr localmente: npm install -g firebase-tools → firebase login → firebase emulators:start
// Y usar el emulador local, o bien cargar los datos directo desde la consola de Firebase.

const VIAJEROS = [
  ['Alejo', '🌊'], ['Bruno', '🎸'], ['Iara', '🌺'], ['Ori', '🦋'],
  ['Martin', '⚡'], ['Val', '🌸'], ['Fede', '🎯'], ['Simón', '🦁'],
  ['Mila', '🌙'], ['Meli', '🍦'], ['Lucho', '🏔'], ['Juli', '🌵'],
  ['Yae', '🦄'], ['Lara', '🌮'], ['Alex', '🚀'], ['Mic', '🎨'],
  ['Chicho', '🦊'], ['Weri', '🎭'], ['Cami', '🍕'], ['Cata', '🐬'],
  ['Santi', '🎲'], ['Gime', '🎪'], ['Iña', '🐶'],
]

const CHECKLIST = ['Hielo', 'Parlante', 'Botiquín', 'Pelota', 'Juegos de mesa', 'Bajante']

async function seed() {
  initializeApp()
  const db = getFirestore()
  const batch = db.batch()

  VIAJEROS.forEach(([name, emoji]) => {
    batch.set(db.collection('users').doc(name), { emoji })
  })

  CHECKLIST.forEach((item, i) => {
    batch.set(db.collection('checklist').doc(`c${i + 1}`), { item, q: null })
  })

  batch.set(db.collection('prode').doc('estado'), {
    pregs: [], resp: {}, correct: {}, closed: false,
  })

  await batch.commit()
  console.log('Firestore inicializado correctamente ✅')
}

seed().catch(console.error)
