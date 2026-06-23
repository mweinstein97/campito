import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { supabase, isOnline } from '../lib/supabase'
import { buildSeedState } from '../lib/seed'

const STORAGE_KEY = 'fp_state_v1'
const USER_KEY = 'fp_user_v1'
const TRIP_DATE = new Date('2026-07-09T00:00:00')

// ─── helpers ────────────────────────────────────────────────────────────────
export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
}

export function calcCountdown() {
  const diff = TRIP_DATE - new Date()
  if (diff <= 0) return { d:0, h:0, m:0, s:0, gone:true }
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
  Object.values(state.desafios).forEach(d => {
    if (!d.correcta) return
    Object.entries(d.respuestas || {}).forEach(([u, r]) => {
      if (r === d.correcta) pts[u] = (pts[u] || 0) + 100
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
    case 'LOAD': return { ...action.payload }
    case 'SET_USER': return { ...state, users: { ...state.users, [action.name]: { emoji: action.emoji } } }
    case 'DEL_USER': { const u = { ...state.users }; delete u[action.name]; return { ...state, users: u } }
    case 'SET_PREF': return { ...state, pref: { ...state.pref, [action.name]: action.pref } }
    case 'ADD_AGENDA': return { ...state, agenda: { ...state.agenda, [action.item.id]: action.item } }
    case 'TOGGLE_PART': {
      const act = state.agenda[action.actId]
      const parts = act.participantes.includes(action.user)
        ? act.participantes.filter(p => p !== action.user)
        : [...act.participantes, action.user]
      return { ...state, agenda: { ...state.agenda, [action.actId]: { ...act, participantes: parts } } }
    }
    case 'REACT': {
      const act = state.agenda[action.actId]
      const reacs = { ...act.reacciones }
      const userReacs = { ...act.userReacs }
      const prev = userReacs[action.user]
      if (prev === action.emoji) { reacs[prev]--; delete userReacs[action.user] }
      else { if (prev && reacs[prev] > 0) reacs[prev]--; reacs[action.emoji] = (reacs[action.emoji] || 0) + 1; userReacs[action.user] = action.emoji }
      return { ...state, agenda: { ...state.agenda, [action.actId]: { ...act, reacciones: reacs, userReacs } } }
    }
    case 'TAKE_ITEM': return { ...state, check: { ...state.check, [action.id]: { ...state.check[action.id], q: action.user } } }
    case 'ADD_CHECK': return { ...state, check: { ...state.check, [action.item.id]: action.item } }
    case 'ADD_GASTO': return { ...state, gastos: { ...state.gastos, [action.item.id]: action.item } }
    case 'RESP_DSF': {
      const d = state.desafios[action.fecha]
      return { ...state, desafios: { ...state.desafios, [action.fecha]: { ...d, respuestas: { ...d.respuestas, [action.user]: action.resp } } } }
    }
    case 'SAVE_DESAFIO': return { ...state, desafios: { ...state.desafios, [action.fecha]: action.desafio } }
    case 'ADD_PRODE_Q': return { ...state, prode: { ...state.prode, pregs: [...state.prode.pregs, action.q] } }
    case 'RESP_PRODE': {
      const rs = { ...state.prode.resp, [action.user]: { ...(state.prode.resp[action.user] || {}), [action.qid]: action.resp } }
      return { ...state, prode: { ...state.prode, resp: rs } }
    }
    case 'CLOSE_PRODE': return { ...state, prode: { ...state.prode, closed: true, correct: action.correct } }
    default: return state
  }
}

// ─── context ────────────────────────────────────────────────────────────────
const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null)
  const [currentUser, setCurrentUserState] = useReducer((_, u) => u, null)
  const [toast, dispatchToast] = useReducer((_, msg) => msg, null)
  const toastTimer = useRef(null)
  const realtimeChannel = useRef(null)

  // ── persistence ──
  const persist = useCallback((s) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch (_) {}
  }, [])

  const dispatchAndSave = useCallback((action) => {
    dispatch(action)
    // Supabase sync happens per-action via helpers below
  }, [])

  // ── toast ──
  const showToast = useCallback((msg) => {
    dispatchToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => dispatchToast(null), 2200)
  }, [])

  // ── init ──
  useEffect(() => {
    async function init() {
      // Intentar cargar desde Supabase si está configurado
      if (isOnline()) {
        try {
          const loaded = await loadFromSupabase()
          dispatch({ type: 'LOAD', payload: loaded })
          persist(loaded)
          setupRealtime(loaded)
          return
        } catch (e) {
          console.warn('Supabase load failed, falling back to local', e)
        }
      }
      // Fallback: localStorage → seed
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        try { dispatch({ type: 'LOAD', payload: JSON.parse(raw) }); return } catch (_) {}
      }
      const seed = buildSeedState()
      dispatch({ type: 'LOAD', payload: seed })
      persist(seed)
    }

    const savedUser = sessionStorage.getItem(USER_KEY)
    if (savedUser) { try { setCurrentUserState(JSON.parse(savedUser)) } catch (_) {} }

    init()
    return () => { realtimeChannel.current?.unsubscribe() }
  }, []) // eslint-disable-line

  // persist on every state change
  useEffect(() => { if (state) persist(state) }, [state, persist])

  // ── Supabase realtime ──
  function setupRealtime(initial) {
    if (!supabase) return
    realtimeChannel.current = supabase
      .channel('fp-global')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        // Full reload on any change — simple and reliable for small groups
        loadFromSupabase().then(s => dispatch({ type: 'LOAD', payload: s })).catch(() => {})
      })
      .subscribe()
  }

  // ── Supabase loaders ──
  async function loadFromSupabase() {
    const [
      { data: users },
      { data: agenda },
      { data: agendaParts },
      { data: agendaReacs },
      { data: prefs },
      { data: checklist },
      { data: gastos },
      { data: gastosParts },
      { data: desafios },
      { data: desafioResps },
      { data: prodePregs },
      { data: prodeResps },
    ] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('agenda').select('*'),
      supabase.from('agenda_participantes').select('*'),
      supabase.from('agenda_reacciones').select('*'),
      supabase.from('preferencias').select('*'),
      supabase.from('checklist').select('*'),
      supabase.from('gastos').select('*'),
      supabase.from('gastos_participantes').select('*'),
      supabase.from('desafios').select('*'),
      supabase.from('desafio_respuestas').select('*'),
      supabase.from('prode_preguntas').select('*').order('orden'),
      supabase.from('prode_respuestas').select('*'),
    ])

    const usersMap = {}
    users?.forEach(u => usersMap[u.name] = { emoji: u.emoji })

    const agendaMap = {}
    agenda?.forEach(a => {
      agendaMap[a.id] = { id: a.id, nombre: a.nombre, dia: a.dia, hora: a.hora, descripcion: a.descripcion || '', creador: a.creador, participantes: [], reacciones: { '🔥':0,'👏':0,'😂':0 }, userReacs: {} }
    })
    agendaParts?.forEach(p => agendaMap[p.agenda_id]?.participantes.push(p.user_name))
    agendaReacs?.forEach(r => {
      if (agendaMap[r.agenda_id]) {
        agendaMap[r.agenda_id].reacciones[r.emoji] = (agendaMap[r.agenda_id].reacciones[r.emoji] || 0) + 1
        agendaMap[r.agenda_id].userReacs[r.user_name] = r.emoji
      }
    })

    const prefMap = {}
    prefs?.forEach(p => prefMap[p.user_name] = { noCome: p.no_come, desayuno: p.desayuno, desea: p.desea, bebida: p.bebida })

    const checkMap = {}
    checklist?.forEach(c => checkMap[c.id] = { id: c.id, item: c.item, q: c.tomado_por })

    const gastosMap = {}
    gastos?.forEach(g => gastosMap[g.id] = { id: g.id, desc: g.descripcion, monto: g.monto, pagador: g.pagador, participantes: [] })
    gastosParts?.forEach(p => gastosMap[p.gasto_id]?.participantes.push(p.user_name))

    const desafiosMap = {}
    desafios?.forEach(d => desafiosMap[d.fecha] = { pregunta: d.pregunta, opciones: d.opciones, correcta: d.correcta, respuestas: {} })
    desafioResps?.forEach(r => { if (desafiosMap[r.fecha]) desafiosMap[r.fecha].respuestas[r.user_name] = r.respuesta })

    const prodeMap = { pregs: [], resp: {}, correct: {}, closed: false }
    prodePregs?.forEach(q => {
      prodeMap.pregs.push({ id: q.id, pregunta: q.pregunta, opciones: q.opciones })
      if (q.correcta) prodeMap.correct[q.id] = q.correcta
      if (q.cerrado) prodeMap.closed = true
    })
    prodeResps?.forEach(r => {
      if (!prodeMap.resp[r.user_name]) prodeMap.resp[r.user_name] = {}
      prodeMap.resp[r.user_name][r.pregunta_id] = r.respuesta
    })

    return { users: usersMap, agenda: agendaMap, pref: prefMap, check: checkMap, gastos: gastosMap, desafios: desafiosMap, prode: prodeMap }
  }

  // ── action creators ──
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
      if (supabase) await supabase.from('users').upsert({ name, emoji })
    },
    async deleteUser(name) {
      dispatch({ type: 'DEL_USER', name })
      if (supabase) await supabase.from('users').delete().eq('name', name)
    },

    async savePref(name, pref) {
      dispatch({ type: 'SET_PREF', name, pref })
      if (supabase) await supabase.from('preferencias').upsert({ user_name: name, no_come: pref.noCome, desayuno: pref.desayuno, desea: pref.desea, bebida: pref.bebida })
    },

    async addAgenda(item) {
      dispatch({ type: 'ADD_AGENDA', item })
      if (supabase) {
        await supabase.from('agenda').insert({ id: item.id, nombre: item.nombre, dia: item.dia, hora: item.hora, descripcion: item.descripcion, creador: item.creador })
        if (item.participantes.length) await supabase.from('agenda_participantes').insert(item.participantes.map(u => ({ agenda_id: item.id, user_name: u })))
      }
    },
    async togglePart(actId, user) {
      dispatch({ type: 'TOGGLE_PART', actId, user })
      if (supabase) {
        const { data } = await supabase.from('agenda_participantes').select('user_name').eq('agenda_id', actId).eq('user_name', user)
        if (data?.length) await supabase.from('agenda_participantes').delete().eq('agenda_id', actId).eq('user_name', user)
        else await supabase.from('agenda_participantes').insert({ agenda_id: actId, user_name: user })
      }
    },
    async react(actId, emoji, user) {
      dispatch({ type: 'REACT', actId, emoji, user })
      if (supabase) {
        const { data } = await supabase.from('agenda_reacciones').select('emoji').eq('agenda_id', actId).eq('user_name', user)
        if (data?.[0]?.emoji === emoji) await supabase.from('agenda_reacciones').delete().eq('agenda_id', actId).eq('user_name', user)
        else await supabase.from('agenda_reacciones').upsert({ agenda_id: actId, user_name: user, emoji })
      }
    },

    async takeItem(id, user) {
      dispatch({ type: 'TAKE_ITEM', id, user })
      if (supabase) await supabase.from('checklist').update({ tomado_por: user }).eq('id', id)
    },
    async addCheckItem(item) {
      dispatch({ type: 'ADD_CHECK', item })
      if (supabase) await supabase.from('checklist').insert({ id: item.id, item: item.item, tomado_por: null })
    },

    async addGasto(item) {
      dispatch({ type: 'ADD_GASTO', item })
      if (supabase) {
        await supabase.from('gastos').insert({ id: item.id, descripcion: item.desc, monto: item.monto, pagador: item.pagador })
        await supabase.from('gastos_participantes').insert(item.participantes.map(u => ({ gasto_id: item.id, user_name: u })))
      }
    },

    async respDesafio(fecha, user, resp) {
      dispatch({ type: 'RESP_DSF', fecha, user, resp })
      if (supabase) await supabase.from('desafio_respuestas').upsert({ fecha, user_name: user, respuesta: resp })
    },
    async saveDesafio(fecha, desafio) {
      dispatch({ type: 'SAVE_DESAFIO', fecha, desafio })
      if (supabase) await supabase.from('desafios').upsert({ fecha, pregunta: desafio.pregunta, opciones: desafio.opciones, correcta: desafio.correcta || null })
    },

    async addProdeQ(q) {
      dispatch({ type: 'ADD_PRODE_Q', q })
      if (supabase) await supabase.from('prode_preguntas').insert({ id: q.id, pregunta: q.pregunta, opciones: q.opciones })
    },
    respProde(user, qid, resp) {
      dispatch({ type: 'RESP_PRODE', user, qid, resp })
    },
    async saveProdeResps(user, resps) {
      if (supabase) {
        await supabase.from('prode_respuestas').delete().eq('user_name', user)
        const rows = Object.entries(resps).map(([qid, r]) => ({ pregunta_id: qid, user_name: user, respuesta: r }))
        if (rows.length) await supabase.from('prode_respuestas').insert(rows)
      }
    },
    async closeProde(correct) {
      dispatch({ type: 'CLOSE_PRODE', correct })
      if (supabase) {
        await Promise.all(Object.entries(correct).map(([qid, corr]) =>
          supabase.from('prode_preguntas').update({ correcta: corr, cerrado: true }).eq('id', qid)
        ))
      }
    },
  }

  return (
    <AppCtx.Provider value={{ state, currentUser, toast, showToast, ...actions }}>
      {children}
    </AppCtx.Provider>
  )
}

export const useApp = () => useContext(AppCtx)
