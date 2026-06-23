import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Card from '../components/Card'
import Modal from '../components/Modal'

const DIAS = ['Mié 9','Jue 10','Vie 11','Sáb 12']

export default function Agenda({ onBadge }) {
  const { state, currentUser, addAgenda, togglePart, showToast } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nombre:'', dia: DIAS[0], hora:'', descripcion:'' })

  const acts = Object.values(state?.agenda || {}).sort((a, b) => a.dia > b.dia ? 1 : -1)

  async function handleCreate() {
    if (!form.nombre.trim()) { showToast('Escribí el nombre'); return }
    const id = 'a' + Date.now()
    await addAgenda({
      id, nombre: form.nombre, dia: form.dia,
      hora: form.hora || '?', descripcion: form.descripcion,
      creador: currentUser.name, participantes: [currentUser.name],
    })
    setForm({ nombre:'', dia: DIAS[0], hora:'', descripcion:'' })
    setModalOpen(false)
    showToast('¡Actividad creada! 🎉')
    onBadge?.()
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[.83rem] text-text2 font-semibold">{acts.length} actividades</span>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-orange text-white rounded-xl px-3.5 py-1.5 text-[.78rem] font-bold active:opacity-85"
        >
          + Nueva
        </button>
      </div>

      {acts.length === 0 ? (
        <div className="text-center py-10 text-text3">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-[.875rem] font-semibold">No hay actividades aún.<br />¡Creá la primera!</p>
        </div>
      ) : acts.map(a => <ActCard key={a.id} act={a} currentUser={currentUser} onToggle={togglePart} />)}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="font-display font-black text-[1.15rem] mb-3.5">Nueva actividad</h2>
        <Field label="Nombre">
          <input className={fi} value={form.nombre} onChange={e => setForm(f => ({...f, nombre: e.target.value}))} placeholder="Running, Truco, Pool..." />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Día">
            <select className={fi} value={form.dia} onChange={e => setForm(f => ({...f, dia: e.target.value}))}>
              {DIAS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Hora">
            <input className={fi} value={form.hora} onChange={e => setForm(f => ({...f, hora: e.target.value}))} placeholder="18:00" />
          </Field>
        </div>
        <Field label="Descripción (opcional)">
          <textarea className={fi} rows={2} style={{ resize:'none' }} value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion: e.target.value}))} />
        </Field>
        <button onClick={handleCreate} className="w-full bg-orange text-white rounded-xl py-3 font-bold text-[.9rem] active:opacity-85">
          Crear actividad
        </button>
      </Modal>
    </div>
  )
}

function ActCard({ act, currentUser, onToggle }) {
  const joined = act.participantes.includes(currentUser?.name)

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-display text-[.975rem] font-extrabold">{act.nombre}</div>
          <div className="text-[.75rem] text-text2 mt-0.5 font-semibold">📅 {act.dia} · ⏰ {act.hora} · por {act.creador}</div>
          {act.descripcion && <div className="text-[.78rem] text-text2 mt-0.5">{act.descripcion}</div>}
        </div>
        <button
          onClick={() => onToggle(act.id, currentUser.name)}
          className={`rounded-[10px] px-3.5 py-1.5 text-[.78rem] font-extrabold transition-all active:scale-95 whitespace-nowrap flex-shrink-0
            ${joined ? 'bg-green-light text-[#065E45]' : 'bg-orange-light text-orange'}`}
        >
          {joined ? '✓ Voy' : '+ Me sumo'}
        </button>
      </div>
      {act.participantes.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {act.participantes.map(p => (
            <span key={p} className="bg-bg border border-border text-text2 text-[.72rem] font-semibold px-2 py-0.5 rounded-full">
              {p}
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-2.5">
      <label className="block text-[.75rem] font-bold text-text2 mb-0.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const fi = 'w-full px-3 py-2.5 border-[1.5px] border-border rounded-xl text-[.9rem] bg-bg text-text1 font-sans outline-none focus:border-orange transition-colors'
