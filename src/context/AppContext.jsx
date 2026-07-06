import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { db, isOnline } from '../lib/firebase'
import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  onSnapshot, getDocs, writeBatch, arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { buildSeedState, VIAJEROS, CHECKLIST_INICIAL } from '../lib/seed'

const STORAGE_KEY = 'fp_state_v1'
const USER_KEY    = 'fp_user_v1'
const TRIP_DATE   = new Date('2026-07-09T00:00:00')

// ─── helpers ────────────────────────────────────────────────────────────────
export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function calcCountdown() {
  const diff = TRIP_DATE - new Date()
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, gone: true }
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    gone: false,
  }
}

export function calcRanking(state) {
  const pts = {}
  Object.keys(state.users).forEach(n => pts[n] = 0)
  Object.values(state.desafios).forEach(day => {
    const lista = day.lista || []
    lista.forEach(d => {
      if (!d.correcta) return
      Object.entries(d.respuestas || {}).forEach(([u, r]) => {
        if (r === d.correcta) pts[u] = (pts[u] || 0) + 100
      })
    })
  })
  Object.entries(state.prode.correct || {}).forEach(([qid, corr]) => {
    Object.entries(state.prode.resp || {}).forEach(([u, rs]) => {
      if (rs[qid] === corr) pts[u] = (pts[u] || 0) + 150
    })
  })
  return Object.entries(pts).sort((a, b) => b[1] - a[1])
}

export function calcDeudas(gastos) {
  const bal = {}
  Object.values(gastos).forEach(g => {
    const share = g.monto / g.participantes.length
    g.participantes.forEach(p => bal[p] = (bal[p] || 0) - share)
    bal[g.pagador] = (bal[g.pagador] || 0) + g.monto
  })
  const creds = [], debts = []
  Object.entries(bal).forEach(([p, b]) => {
    if (b > 0.01) creds.push({ p, b })
    else if (b < -0.01) debts.push({ p, b: -b })
  })
  const txs = []
  let i = 0, j = 0
  creds.sort((a, b) => b.b - a.b)
  debts.sort((a, b) => b.b - a.b)
  while (i < creds.length && j < debts.length) {
    const amt = Math.min(creds[i].b, debts[j].b)
    txs.push({ from: debts[j].p, to: creds[i].p, monto: Math.round(amt) })
    creds[i].b -= amt; debts[j].b -= amt
    if (creds[i].b < 0.01) i++
    if (debts[j].b < 0.01) j++
  }
  return txs
}

export function calcMyBalance(gastos, userName) {
  let b = 0
  Object.values(gastos).forEach(g => {
    if (g.participantes.includes(userName)) b -= g.monto / g.participantes.length
    if (g.pagador === userName) b += g.monto
  })
  return Math.round(b)
}

// ─── reducer ────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':   return { ...action.payload }
    case 'MERGE':  return { ...state, [action.key]: action.data }
    case 'SET_USER':    return { ...state, users: { ...state.users, [action.name]: { emoji: action.emoji } } }
    case 'DEL_USER':  { const u = { ...state.users }; delete u[action.name]; return { ...state, users: u } }
    case 'SET_PREF':    return { ...state, pref: { ...state.pref, [action.name]: action.pref } }
    case 'ADD_AGENDA':  return { ...state, agenda: { ...state.agenda, [action.item.id]: action.item } }
    case 'UPD_AGENDA':  return { ...state, agenda: { ...state.agenda, [action.item.id]: action.item } }
    case 'DEL_AGENDA':  { const a = { ...state.agenda }; delete a[action.id]; return { ...state, agenda: a } }
    case 'TOGGLE_PART': {
      const act = state.agenda[action.actId]
      const parts = act.participantes.includes(action.user)
        ? act.participantes.filter(p => p !== action.user)
        : [...act.participantes, action.user]
      return { ...state, agenda: { ...state.agenda, [action.actId]: { ...act, participantes: parts } } }
    }
    case 'TAKE_ITEM': {
      const it = state.check[action.id]
      const portadores = it.portadores || []
      return { ...state, check: { ...state.check, [action.id]: { ...it, portadores: [...portadores, action.user] } } }
    }
    case 'RELEASE_ITEM': {
      const it = state.check[action.id]
      return { ...state, check: { ...state.check, [action.id]: { ...it, portadores: (it.portadores || []).filter(p => p !== action.user) } } }
    }
    case 'ADD_CHECK':   return { ...state, check: { ...state.check, [action.item.id]: action.item } }
    case 'UPD_CHECK':   return { ...state, check: { ...state.check, [action.id]: { ...state.check[action.id], item: action.label } } }
    case 'DEL_CHECK':   { const c = { ...state.check }; delete c[action.id]; return { ...state, check: c } }
    case 'ADD_AUTO':    return { ...state, autos: { ...state.autos, [action.item.id]: action.item } }
    case 'UPD_AUTO':    return { ...state, autos: { ...state.autos, [action.item.id]: action.item } }
    case 'DEL_AUTO':    { const a = { ...state.autos }; delete a[action.id]; return { ...state, autos: a } }
    case 'ADD_GASTO':   return { ...state, gastos: { ...state.gastos, [action.item.id]: action.item } }
    case 'EDIT_GASTO':  return { ...state, gastos: { ...state.gastos, [action.item.id]: action.item } }
    case 'DEL_GASTO':  { const g = { ...state.gastos }; delete g[action.id]; return { ...state, gastos: g } }
    case 'RESP_DSF': {
      const day = state.desafios[action.fecha] || { lista: [] }
      const newLista = (day.lista || []).map(d =>
        d.id === action.dsfId
          ? { ...d, respuestas: { ...(d.respuestas || {}), [action.user]: action.resp } }
          : d
      )
      return { ...state, desafios: { ...state.desafios, [action.fecha]: { lista: newLista } } }
    }
    case 'SAVE_DESAFIO': return { ...state, desafios: { ...state.desafios, [action.fecha]: action.desafio } }
    case 'ADD_PRODE_Q':  return { ...state, prode: { ...state.prode, pregs: [...state.prode.pregs, action.q] } }
    case 'RESP_PRODE': {
      const rs = { ...state.prode.resp, [action.user]: { ...(state.prode.resp[action.user] || {}), [action.qid]: action.resp } }
      return { ...state, prode: { ...state.prode, resp: rs } }
    }
    case 'CLOSE_PRODE': return { ...state, prode: { ...state.prode, closed: true, correct: action.correct } }
    case 'SET_MENU': return { ...state, menus: { ...state.menus, [action.id]: action.data } }
    case 'SET_COMPRA': return { ...state, compras: { ...state.compras, [action.item]: action.val } }
    case 'SET_RESP': return { ...state, responsables: { ...state.responsables, [action.item]: action.user } }
    default: return state
  }
}

// ─── context ────────────────────────────────────────────────────────────────
const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch]           = useReducer(reducer, null)
  const [currentUser, setCurrentUserState] = useReducer((_, u) => u, null)
  const [toast, dispatchToast]      = useReducer((_, msg) => msg, null)
  const toastTimer                  = useRef(null)
  const stateRef                    = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  const persist = useCallback(s => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch (_) {}
  }, [])

  const showToast = useCallback(msg => {
    dispatchToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => dispatchToast(null), 2200)
  }, [])

  // ── init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const savedUser = sessionStorage.getItem(USER_KEY)
    if (savedUser) { try { setCurrentUserState(JSON.parse(savedUser)) } catch (_) {} }

    if (isOnline()) {
      dispatch({ type: 'LOAD', payload: emptyState() })
      seedFirestoreIfEmpty().catch(console.error)
      return setupListeners(dispatch)
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) { try { dispatch({ type: 'LOAD', payload: JSON.parse(raw) }); return } catch (_) {} }
    const seed = buildSeedState()
    dispatch({ type: 'LOAD', payload: seed })
    persist(seed)
  }, []) // eslint-disable-line

  useEffect(() => {
    if (state && !isOnline()) persist(state)
  }, [state, persist])

  // ── actions ───────────────────────────────────────────────────────────────
  const actions = {
    loginAs(name, emoji) {
      const user = { name, emoji }
      setCurrentUserState(user)
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    },
    logout() {
      setCurrentUserState(null)
      sessionStorage.removeItem(USER_KEY)
    },

    async addUser(name, emoji) {
      dispatch({ type: 'SET_USER', name, emoji })
      if (db) await setDoc(doc(db, 'users', name), { emoji })
    },
    async deleteUser(name) {
      dispatch({ type: 'DEL_USER', name })
      if (db) await deleteDoc(doc(db, 'users', name))
    },
    async changeEmoji(name, emoji) {
      dispatch({ type: 'SET_USER', name, emoji })
      const user = { name, emoji }
      setCurrentUserState(user)
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
      if (db) await updateDoc(doc(db, 'users', name), { emoji })
    },
    async changeName(oldName, newName, emoji) {
      if (!newName.trim() || newName === oldName) return
      // Create doc with new name, delete old
      dispatch({ type: 'SET_USER', name: newName, emoji })
      dispatch({ type: 'DEL_USER', name: oldName })
      const user = { name: newName, emoji }
      setCurrentUserState(user)
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
      if (db) {
        await setDoc(doc(db, 'users', newName), { emoji })
        await deleteDoc(doc(db, 'users', oldName))
      }
    },

    async savePref(name, pref) {
      dispatch({ type: 'SET_PREF', name, pref })
      if (db) await setDoc(doc(db, 'preferencias', name), pref)
    },

    async addAgenda(item) {
      dispatch({ type: 'ADD_AGENDA', item })
      if (db) {
        const { id, ...data } = item
        await setDoc(doc(db, 'agenda', id), data)
      }
    },
    async updateAgenda(item) {
      dispatch({ type: 'UPD_AGENDA', item })
      if (db) {
        const { id, ...data } = item
        await setDoc(doc(db, 'agenda', id), data)
      }
    },
    async deleteAgenda(id) {
      dispatch({ type: 'DEL_AGENDA', id })
      if (db) await deleteDoc(doc(db, 'agenda', id))
    },
    async togglePart(actId, user) {
      dispatch({ type: 'TOGGLE_PART', actId, user })
      if (db) {
        const act = stateRef.current.agenda[actId]
        const joined = act.participantes.includes(user)
        await updateDoc(doc(db, 'agenda', actId), {
          participantes: joined
            ? act.participantes.filter(p => p !== user)
            : [...act.participantes, user],
        })
      }
    },

    async takeItem(id, user) {
      dispatch({ type: 'TAKE_ITEM', id, user })
      if (db) await updateDoc(doc(db, 'checklist', id), { portadores: arrayUnion(user) })
    },
    async releaseItem(id, user) {
      dispatch({ type: 'RELEASE_ITEM', id, user })
      if (db) await updateDoc(doc(db, 'checklist', id), { portadores: arrayRemove(user) })
    },
    async addCheckItem(item) {
      dispatch({ type: 'ADD_CHECK', item })
      if (db) await setDoc(doc(db, 'checklist', item.id), { item: item.item, portadores: [] })
    },
    async addAuto(item) {
      dispatch({ type: 'ADD_AUTO', item })
      if (db) { const { id, ...data } = item; await setDoc(doc(db, 'autos', id), data) }
    },
    async updateAuto(item) {
      dispatch({ type: 'UPD_AUTO', item })
      if (db) { const { id, ...data } = item; await setDoc(doc(db, 'autos', id), data) }
    },
    async deleteAuto(id) {
      dispatch({ type: 'DEL_AUTO', id })
      if (db) await deleteDoc(doc(db, 'autos', id))
    },
    async joinAuto(id, user) {
      const auto = stateRef.current.autos[id]
      const updated = { ...auto, pasajeros: [...(auto.pasajeros || []), user] }
      dispatch({ type: 'UPD_AUTO', item: updated })
      if (db) await updateDoc(doc(db, 'autos', id), { pasajeros: arrayUnion(user) })
    },
    async leaveAuto(id, user) {
      const auto = stateRef.current.autos[id]
      const updated = { ...auto, pasajeros: (auto.pasajeros || []).filter(p => p !== user) }
      dispatch({ type: 'UPD_AUTO', item: updated })
      if (db) await updateDoc(doc(db, 'autos', id), { pasajeros: arrayRemove(user) })
    },

    async updateCheckItem(id, label) {
      dispatch({ type: 'UPD_CHECK', id, label })
      if (db) await updateDoc(doc(db, 'checklist', id), { item: label })
    },
    async deleteCheckItem(id) {
      dispatch({ type: 'DEL_CHECK', id })
      if (db) await deleteDoc(doc(db, 'checklist', id))
    },

    async addGasto(item) {
      dispatch({ type: 'ADD_GASTO', item })
      if (db) {
        const { id, ...data } = item
        await setDoc(doc(db, 'gastos', id), data)
      }
    },
    async updateGasto(item) {
      dispatch({ type: 'EDIT_GASTO', item })
      if (db) {
        const { id, ...data } = item
        await setDoc(doc(db, 'gastos', id), data)
      }
    },
    async deleteGasto(id) {
      dispatch({ type: 'DEL_GASTO', id })
      if (db) await deleteDoc(doc(db, 'gastos', id))
    },

    async respDesafio(fecha, dsfId, user, resp) {
      dispatch({ type: 'RESP_DSF', fecha, dsfId, user, resp })
      if (db) {
        const day = stateRef.current.desafios[fecha] || { lista: [] }
        const newLista = (day.lista || []).map(d =>
          d.id === dsfId
            ? { ...d, respuestas: { ...(d.respuestas || {}), [user]: resp } }
            : d
        )
        await setDoc(doc(db, 'desafios', fecha), { lista: newLista })
      }
    },
    async addDesafio(fecha, dsfItem) {
      const current = stateRef.current.desafios[fecha] || { lista: [] }
      const newDoc = { lista: [...(current.lista || []), dsfItem] }
      dispatch({ type: 'SAVE_DESAFIO', fecha, desafio: newDoc })
      if (db) await setDoc(doc(db, 'desafios', fecha), newDoc)
    },
    async updateDesafio(fecha, dsfItem) {
      const current = stateRef.current.desafios[fecha] || { lista: [] }
      const newDoc = { lista: (current.lista || []).map(d => d.id === dsfItem.id ? dsfItem : d) }
      dispatch({ type: 'SAVE_DESAFIO', fecha, desafio: newDoc })
      if (db) await setDoc(doc(db, 'desafios', fecha), newDoc)
    },
    async deleteDesafio(fecha, dsfId) {
      const current = stateRef.current.desafios[fecha] || { lista: [] }
      const newDoc = { lista: (current.lista || []).filter(d => d.id !== dsfId) }
      dispatch({ type: 'SAVE_DESAFIO', fecha, desafio: newDoc })
      if (db) await setDoc(doc(db, 'desafios', fecha), newDoc)
    },

    async addProdeQ(q) {
      dispatch({ type: 'ADD_PRODE_Q', q })
      if (db) await updateDoc(doc(db, 'prode', 'estado'), {
        pregs: [...(stateRef.current.prode.pregs || []), q],
      })
    },
    respProde(user, qid, resp) {
      dispatch({ type: 'RESP_PRODE', user, qid, resp })
    },
    async saveProdeResps(user, resps) {
      if (db) await updateDoc(doc(db, 'prode', 'estado'), { [`resp.${user}`]: resps })
    },
    async toggleCompra(item, val) {
      dispatch({ type: 'SET_COMPRA', item, val })
      if (db) await setDoc(doc(db, 'compras', 'estado'), { [item]: val }, { merge: true })
    },

    async setCompraResp(item, user) {
      dispatch({ type: 'SET_RESP', item, user })
      if (db) await setDoc(doc(db, 'compras', 'responsables'), { [item]: user }, { merge: true })
    },

    async saveMenu(id, data) {
      dispatch({ type: 'SET_MENU', id, data })
      if (db) await setDoc(doc(db, 'menus', id), data)
    },

    async closeProde(correct) {
      dispatch({ type: 'CLOSE_PRODE', correct })
      if (db) await updateDoc(doc(db, 'prode', 'estado'), { correct, closed: true })
    },
  }

  return (
    <AppCtx.Provider value={{ state, currentUser, toast, showToast, ...actions }}>
      {children}
    </AppCtx.Provider>
  )
}

export const useApp = () => useContext(AppCtx)

// ─── Firestore first-run seed ────────────────────────────────────────────────
async function seedFirestoreIfEmpty() {
  const metaSnap = await getDocs(collection(db, 'meta'))
  if (!metaSnap.empty) return

  // Si ya hay usuarios (seed corrió antes del flag), solo guardar la marca
  const usersSnap = await getDocs(collection(db, 'users'))
  if (!usersSnap.empty) {
    await setDoc(doc(db, 'meta', 'seeded'), { at: new Date().toISOString() })
    return
  }

  const batch = writeBatch(db)
  batch.set(doc(db, 'meta', 'seeded'), { at: new Date().toISOString() })
  VIAJEROS.forEach(([name, emoji]) => {
    batch.set(doc(db, 'users', name), { emoji }, { merge: true })
  })
  CHECKLIST_INICIAL.forEach((item, i) => {
    batch.set(doc(db, 'checklist', `c${i + 1}`), { item, portadores: [] })
  })
  batch.set(doc(db, 'prode', 'estado'), { pregs: [], resp: {}, correct: {}, closed: false })
  await batch.commit()
}

// ─── Firestore listeners ────────────────────────────────────────────────────
function setupListeners(dispatch) {
  const unsubs = []

  unsubs.push(onSnapshot(collection(db, 'users'), snap => {
    const users = {}
    snap.forEach(d => users[d.id] = d.data())
    dispatch({ type: 'MERGE', key: 'users', data: users })
  }))

  const DIA_MAP = { 'Mié 9':'Jue 9', 'Jue 10':'Vie 10', 'Vie 11':'Sáb 11', 'Sáb 12':'Dom 12' }
  unsubs.push(onSnapshot(collection(db, 'agenda'), snap => {
    const agenda = {}
    snap.forEach(d => {
      const data = d.data()
      agenda[d.id] = { id: d.id, ...data, dia: DIA_MAP[data.dia] || data.dia }
    })
    dispatch({ type: 'MERGE', key: 'agenda', data: agenda })
  }))

  unsubs.push(onSnapshot(collection(db, 'preferencias'), snap => {
    const pref = {}
    snap.forEach(d => pref[d.id] = d.data())
    dispatch({ type: 'MERGE', key: 'pref', data: pref })
  }))

  unsubs.push(onSnapshot(collection(db, 'checklist'), snap => {
    const check = {}
    snap.forEach(d => {
      const data = d.data()
      // backward compat: old `q` field → portadores array
      const portadores = Array.isArray(data.portadores)
        ? data.portadores
        : (data.q ? [data.q] : [])
      check[d.id] = { id: d.id, item: data.item, portadores }
    })
    dispatch({ type: 'MERGE', key: 'check', data: check })
  }))

  unsubs.push(onSnapshot(collection(db, 'gastos'), snap => {
    const gastos = {}
    snap.forEach(d => gastos[d.id] = { id: d.id, ...d.data() })
    dispatch({ type: 'MERGE', key: 'gastos', data: gastos })
  }))

  unsubs.push(onSnapshot(collection(db, 'desafios'), snap => {
    const desafios = {}
    snap.forEach(d => {
      const data = d.data()
      if (data.lista) {
        desafios[d.id] = data
      } else {
        // backward compat: old single-desafio structure
        desafios[d.id] = {
          lista: [{ id: 'd0', pregunta: data.pregunta, opciones: data.opciones || [], correcta: data.correcta || null, respuestas: data.respuestas || {} }],
        }
      }
    })
    dispatch({ type: 'MERGE', key: 'desafios', data: desafios })
  }))

  unsubs.push(onSnapshot(doc(db, 'compras', 'estado'), snap => {
    dispatch({ type: 'MERGE', key: 'compras', data: snap.exists() ? snap.data() : {} })
  }))

  unsubs.push(onSnapshot(doc(db, 'compras', 'responsables'), snap => {
    dispatch({ type: 'MERGE', key: 'responsables', data: snap.exists() ? snap.data() : {} })
  }))

  unsubs.push(onSnapshot(collection(db, 'autos'), snap => {
    const autos = {}
    snap.forEach(d => autos[d.id] = { id: d.id, ...d.data() })
    dispatch({ type: 'MERGE', key: 'autos', data: autos })
  }))

  unsubs.push(onSnapshot(collection(db, 'menus'), snap => {
    const menus = {}
    snap.forEach(d => menus[d.id] = d.data())
    dispatch({ type: 'MERGE', key: 'menus', data: menus })
  }))

  unsubs.push(onSnapshot(doc(db, 'prode', 'estado'), snap => {
    if (snap.exists()) {
      dispatch({ type: 'MERGE', key: 'prode', data: snap.data() })
    } else {
      setDoc(doc(db, 'prode', 'estado'), { pregs: [], resp: {}, correct: {}, closed: false })
    }
  }))

  return () => unsubs.forEach(u => u())
}

function emptyState() {
  return {
    users: {}, agenda: {}, pref: {}, check: {}, gastos: {}, desafios: {}, menus: {}, compras: {}, responsables: {}, autos: {},
    prode: { pregs: [], resp: {}, correct: {}, closed: false },
  }
}
