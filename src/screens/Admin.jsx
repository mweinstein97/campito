import { useState } from 'react'
import { useApp, todayKey } from '../context/AppContext'

const ADMIN_PWD = 'campito2025'

export default function Admin({ onClose }) {
  const [authed, setAuthed] = useState(false)
  const [pwd, setPwd] = useState('')
  const { state, currentUser, showToast, deleteUser, addDesafio, updateDesafio, deleteDesafio, addProdeQ, closeProde } = useApp()

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
        <button onClick={onClose} className="w-full border-[1.5px] border-border text-text2 rounded-xl py-2.5 font-bold mt-2 active:opacity-85 text-[.875rem]">Cancelar</button>
      </>
    )
  }

  return <AdminPanel state={state} currentUser={currentUser} showToast={showToast} deleteUser={deleteUser}
    addDesafio={addDesafio} updateDesafio={updateDesafio} deleteDesafio={deleteDesafio}
    addProdeQ={addProdeQ} closeProde={closeProde} onClose={onClose} />
}

function AdminPanel({ state, currentUser, showToast, deleteUser, addDesafio, updateDesafio, deleteDesafio, addProdeQ, closeProde, onClose }) {
  const hoy    = todayKey()
  const hoyDsf = state.desafios[hoy] || { lista: [] }
  const lista  = hoyDsf.lista || []

  const [addForm, setAddForm] = useState({ pregunta:'', opciones:'', correcta:'' })
  const [editId, setEditId]   = useState(null)
  const [editForm, setEditForm] = useState({})
  const [prodeForm, setProdeForm] = useState({ pregunta:'', opciones:'' })
  const [corrects, setCorrects]   = useState({})

  async function handleAddDsf() {
    const opts = addForm.opciones.split('|').map(o => o.trim()).filter(Boolean)
    if (!addForm.pregunta.trim() || !opts.length) { showToast('Completá pregunta y opciones'); return }
    await addDesafio(hoy, {
      id: 'd' + Date.now(),
      pregunta: addForm.pregunta,
      opciones: opts,
      correcta: addForm.correcta.trim() || null,
      respuestas: {},
    })
    setAddForm({ pregunta:'', opciones:'', correcta:'' })
    showToast('Desafío agregado ⚡')
  }

  function startEdit(dsf) {
    setEditId(dsf.id)
    setEditForm({ pregunta: dsf.pregunta, opciones: dsf.opciones.join('|'), correcta: dsf.correcta || '' })
  }

  async function handleUpdateDsf() {
    const opts = editForm.opciones.split('|').map(o => o.trim()).filter(Boolean)
    if (!editForm.pregunta.trim() || !opts.length) { showToast('Completá pregunta y opciones'); return }
    const existing = lista.find(d => d.id === editId)
    await updateDesafio(hoy, {
      ...existing,
      pregunta: editForm.pregunta,
      opciones: opts,
      correcta: editForm.correcta.trim() || null,
    })
    setEditId(null)
    showToast('Desafío actualizado ✅')
  }

  async function handleDeleteDsf(id) {
    await deleteDesafio(hoy, id)
    showToast('Desafío eliminado')
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-black text-[1.15rem]">Panel admin 🔧</h2>
        <button onClick={onClose} className="text-text3 text-[.8rem] font-bold border-[1.5px] border-border rounded-full px-3 py-1 active:bg-bg">Cerrar ✕</button>
      </div>

      {/* Desafíos del día */}
      <Section title="Desafíos del día">
        {/* Lista existente */}
        {lista.map((dsf, idx) => (
          <div key={dsf.id} className="mb-3 border-[1.5px] border-border rounded-xl p-3 bg-bg">
            {editId === dsf.id ? (
              <>
                <Field label="Pregunta">
                  <input className={fi} value={editForm.pregunta} onChange={e => setEditForm(f => ({...f, pregunta: e.target.value}))} />
                </Field>
                <Field label="Opciones (separar con |)">
                  <input className={fi} value={editForm.opciones} onChange={e => setEditForm(f => ({...f, opciones: e.target.value}))} />
                </Field>
                <Field label="Respuesta correcta">
                  <input className={fi} value={editForm.correcta} onChange={e => setEditForm(f => ({...f, correcta: e.target.value}))} />
                </Field>
                <div className="flex gap-2">
                  <button onClick={() => setEditId(null)} className="flex-1 border-[1.5px] border-border text-text2 rounded-xl py-2 text-[.83rem] font-bold">Cancelar</button>
                  <button onClick={handleUpdateDsf} className="flex-1 bg-orange text-white rounded-xl py-2 text-[.83rem] font-bold">Guardar</button>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-[.82rem] font-bold text-text2 mb-0.5">Desafío {idx + 1}</div>
                  <div className="text-[.85rem] font-semibold text-text1">{dsf.pregunta}</div>
                  <div className="text-[.72rem] text-text3 mt-0.5">{(dsf.opciones || []).join(' · ')}</div>
                  {dsf.correcta && <div className="text-[.72rem] text-[#065E45] font-bold mt-0.5">✅ Correcta: {dsf.correcta}</div>}
                  <div className="text-[.68rem] text-text3 mt-0.5">{Object.keys(dsf.respuestas || {}).length} respuestas</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(dsf)} className="text-orange text-[.8rem] p-1">✏️</button>
                  <button onClick={() => handleDeleteDsf(dsf.id)} className="text-text3 text-[.8rem] p-1">🗑️</button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Agregar nuevo */}
        <div className="border-[1.5px] border-dashed border-border rounded-xl p-3">
          <div className="text-[.75rem] font-bold text-text2 uppercase tracking-wider mb-2">+ Agregar desafío</div>
          <Field label="Pregunta">
            <input className={fi} value={addForm.pregunta} onChange={e => setAddForm(f => ({...f, pregunta: e.target.value}))} placeholder="¿Cuántas cervezas...?" />
          </Field>
          <Field label="Opciones (separar con |)">
            <input className={fi} value={addForm.opciones} onChange={e => setAddForm(f => ({...f, opciones: e.target.value}))} placeholder="5|10|15|20" />
          </Field>
          <Field label="Respuesta correcta (opcional)">
            <input className={fi} value={addForm.correcta} onChange={e => setAddForm(f => ({...f, correcta: e.target.value}))} placeholder="10" />
          </Field>
          <Btn2 onClick={handleAddDsf}>Agregar desafío</Btn2>
        </div>
      </Section>

      <div className="h-px bg-border my-4" />

      {/* Prode */}
      <Section title="Agregar pregunta al prode">
        <Field label="Pregunta">
          <input className={fi} value={prodeForm.pregunta} onChange={e => setProdeForm(f => ({...f, pregunta: e.target.value}))} placeholder="¿Quién...?" />
        </Field>
        <Field label="Opciones (separar con |)">
          <div className="flex gap-2 items-start">
            <input className={fi} value={prodeForm.opciones} onChange={e => setProdeForm(f => ({...f, opciones: e.target.value}))} placeholder="Juan|Sofi|Caro|Nico" />
            <button
              onClick={() => setProdeForm(f => ({...f, opciones: Object.keys(state.users).join('|')}))}
              className="whitespace-nowrap text-[.72rem] font-bold text-orange border-[1.5px] border-orange rounded-xl px-2.5 py-2.5 active:bg-orange-light"
            >Todos</button>
          </div>
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
