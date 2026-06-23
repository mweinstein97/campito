import { useState } from 'react'
import { useApp, todayKey } from '../context/AppContext'

const ADMIN_PWD = 'campito2025'

export default function Admin({ onClose }) {
  const [authed, setAuthed] = useState(false)
  const [pwd, setPwd] = useState('')
  const { state, currentUser, showToast, deleteUser, saveDesafio, addProdeQ, closeProde } = useApp()

  function handleLogin() {
    if (pwd === ADMIN_PWD) setAuthed(true)
    else showToast('Contraseña incorrecta')
  }

  if (!authed) {
    return (
      <>
        <h2 className="font-display font-black text-[1.15rem] mb-3.5">Modo administrador</h2>
        <label className="block text-[.75rem] font-bold text-text2 mb-0.5 uppercase tracking-wide">Contraseña</label>
        <input
          type="password"
          className={fi}
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Contraseña..."
        />
        <button onClick={handleLogin} className="w-full bg-orange text-white rounded-xl py-3 font-bold mt-3 active:opacity-85">Entrar</button>
      </>
    )
  }

  return <AdminPanel state={state} currentUser={currentUser} showToast={showToast} deleteUser={deleteUser} saveDesafio={saveDesafio} addProdeQ={addProdeQ} closeProde={closeProde} onClose={onClose} />
}

function AdminPanel({ state, currentUser, showToast, deleteUser, saveDesafio, addProdeQ, closeProde, onClose }) {
  const hoy = todayKey()
  const dsf = state.desafios[hoy] || {}
  const [dsfForm, setDsfForm] = useState({ pregunta: dsf.pregunta||'', opciones: (dsf.opciones||[]).join('|'), correcta: dsf.correcta||'' })
  const [prodeForm, setProdeForm] = useState({ pregunta:'', opciones:'' })
  const [corrects, setCorrects] = useState({})

  async function handleSaveDsf() {
    const opts = dsfForm.opciones.split('|').map(o => o.trim()).filter(Boolean)
    if (!dsfForm.pregunta.trim() || !opts.length) { showToast('Completá pregunta y opciones'); return }
    await saveDesafio(hoy, {
      pregunta: dsfForm.pregunta,
      opciones: opts,
      correcta: dsfForm.correcta || null,
      respuestas: dsf.respuestas || {},
    })
    showToast('Desafío guardado ⚡')
    onClose()
  }

  async function handleAddProde() {
    const opts = prodeForm.opciones.split('|').map(o => o.trim()).filter(Boolean)
    if (!prodeForm.pregunta.trim() || !opts.length) { showToast('Completá pregunta y opciones'); return }
    await addProdeQ({ id: 'p' + Date.now(), pregunta: prodeForm.pregunta, opciones: opts })
    setProdeForm({ pregunta:'', opciones:'' })
    showToast('Pregunta agregada 🎯')
  }

  async function handleCloseProde() {
    await closeProde(corrects)
    showToast('Prode cerrado 🏆')
    onClose()
  }

  return (
    <>
      <h2 className="font-display font-black text-[1.15rem] mb-4">Panel admin 🔧</h2>

      {/* Desafío */}
      <Section title="Desafío del día">
        <Field label="Pregunta">
          <input className={fi} value={dsfForm.pregunta} onChange={e => setDsfForm(f => ({...f, pregunta: e.target.value}))} />
        </Field>
        <Field label="Opciones (separar con |)">
          <input className={fi} value={dsfForm.opciones} onChange={e => setDsfForm(f => ({...f, opciones: e.target.value}))} />
        </Field>
        <Field label="Respuesta correcta">
          <input className={fi} value={dsfForm.correcta} onChange={e => setDsfForm(f => ({...f, correcta: e.target.value}))} />
        </Field>
        <Btn2 onClick={handleSaveDsf}>Guardar desafío</Btn2>
      </Section>

      <div className="h-px bg-border my-4" />

      {/* Prode */}
      <Section title="Agregar pregunta al prode">
        <Field label="Pregunta">
          <input className={fi} value={prodeForm.pregunta} onChange={e => setProdeForm(f => ({...f, pregunta: e.target.value}))} placeholder="¿Quién...?" />
        </Field>
        <Field label="Opciones (separar con |)">
          <input className={fi} value={prodeForm.opciones} onChange={e => setProdeForm(f => ({...f, opciones: e.target.value}))} placeholder="Juan|Sofi|Caro|Nico" />
        </Field>
        <Btn2 onClick={handleAddProde}>Agregar</Btn2>
      </Section>

      <div className="h-px bg-border my-4" />

      {/* Cerrar prode */}
      <Section title="Cerrar prode y cargar correctas">
        {state.prode.pregs.map(q => (
          <div key={q.id} className="mb-2.5">
            <div className="text-[.78rem] font-bold mb-1">{q.pregunta}</div>
            <select
              className={fi}
              value={corrects[q.id] || state.prode.correct?.[q.id] || ''}
              onChange={e => setCorrects(c => ({...c, [q.id]: e.target.value}))}
            >
              <option value="">Sin respuesta</option>
              {q.opciones.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <Btn2 onClick={handleCloseProde}>Cerrar prode</Btn2>
      </Section>

      <div className="h-px bg-border my-4" />

      {/* Users */}
      <Section title={`Participantes (${Object.keys(state.users).length})`}>
        {Object.keys(state.users).map(n => (
          <div key={n} className="flex items-center py-1">
            <span className="text-[.875rem]">{state.users[n].emoji} {n}</span>
            {n !== currentUser?.name && (
              <button
                onClick={async () => { await deleteUser(n); showToast(`${n} eliminado`) }}
                className="ml-auto text-text3 text-[.72rem] bg-none border-none cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </Section>
    </>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-1">
      <h4 className="font-display text-[.8rem] font-extrabold text-text2 uppercase tracking-wider mb-2">{title}</h4>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-2">
      <label className="block text-[.75rem] font-bold text-text2 mb-0.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function Btn2({ children, onClick }) {
  return (
    <button onClick={onClick} className="w-full bg-card text-orange border-[1.5px] border-orange rounded-xl py-2.5 text-[.83rem] font-bold mt-1 active:bg-orange-light">
      {children}
    </button>
  )
}

const fi = 'w-full px-3 py-2.5 border-[1.5px] border-border rounded-xl text-[.9rem] bg-bg text-text1 font-sans outline-none focus:border-orange transition-colors'
