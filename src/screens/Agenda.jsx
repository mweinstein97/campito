import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Card from '../components/Card'
import Modal from '../components/Modal'

const DIAS = ['Jue 9','Vie 10','Sáb 11','Dom 12']

export default function Agenda({ onBadge }) {
  const { state, currentUser, addAgenda, updateAgenda, deleteAgenda, togglePart, showToast } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ nombre:'', dia: DIAS[0], hora:'', descripcion:'' })

  const allActs = Object.values(state?.agenda || {})
  const sortActs = acts => acts.sort((a, b) => {
    if (!a.hora || a.hora === '?') return 1
    if (!b.hora || b.hora === '?') return -1
    return a.hora.localeCompare(b.hora)
  })
  // Agrupar por día real; ordenar grupos según DIAS (nuevo orden), los no reconocidos al final
  const byDia = {}
  allActs.forEach(a => { if (!byDia[a.dia]) byDia[a.dia] = []; byDia[a.dia].push(a) })
  const grouped = Object.keys(byDia)
    .sort((a, b) => {
      const ia = DIAS.indexOf(a), ib = DIAS.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
    .map(dia => ({ dia, acts: sortActs(byDia[dia]) }))
  const totalActs = allActs.length

  function openNew() {
    setEditingId(null)
    setForm({ nombre:'', dia: DIAS[0], hora:'', descripcion:'' })
    setModalOpen(true)
  }

  function openEdit(act) {
    setEditingId(act.id)
    setForm({ nombre: act.nombre, dia: act.dia, hora: act.hora === '?' ? '' : act.hora, descripcion: act.descripcion || '' })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.nombre.trim()) { showToast('Escribí el nombre'); return }
    if (editingId) {
      const existing = state.agenda[editingId]
      await updateAgenda({ ...existing, nombre: form.nombre, dia: form.dia, hora: form.hora || '?', descripcion: form.descripcion })
      showToast('Actividad actualizada ✅')
    } else {
      const id = 'a' + Date.now()
      await addAgenda({ id, nombre: form.nombre, dia: form.dia, hora: form.hora || '?', descripcion: form.descripcion, creador: currentUser.name, participantes: [currentUser.name] })
      showToast('¡Actividad creada! 🎉')
      onBadge?.()
    }
    setForm({ nombre:'', dia: DIAS[0], hora:'', descripcion:'' })
    setModalOpen(false)
  }

  async function handleDelete(id) {
    await deleteAgenda(id)
    showToast('Actividad eliminada')
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[.83rem] text-text2 font-semibold">{totalActs} actividades</span>
        <button
          onClick={openNew}
          className="bg-orange text-white rounded-xl px-3.5 py-1.5 text-[.78rem] font-bold active:opacity-85"
        >
          + Nueva
        </button>
      </div>

      {totalActs === 0 ? (
        <div className="text-center py-10 text-text3">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-[.875rem] font-semibold">No hay actividades aún.<br />¡Creá la primera!</p>
        </div>
      ) : grouped.map(({ dia, acts }) => (
        <div key={dia}>
          <div className="px-4 pt-3 pb-1">
            <span className="text-[.72rem] font-extrabold text-text3 uppercase tracking-widest font-display">{dia}</span>
          </div>
          {acts.map(a => <ActCard key={a.id} act={a} currentUser={currentUser} onToggle={togglePart} onEdit={openEdit} onDelete={handleDelete} />)}
        </div>
      ))}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="font-display font-black text-[1.15rem] mb-3.5">{editingId ? 'Editar actividad' : 'Nueva actividad'}</h2>
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
        <div className="sticky bottom-0 bg-card pt-2 -mx-6 px-6 pb-1">
          <button onClick={handleSave} className="w-full bg-orange text-white rounded-xl py-3 font-bold text-[.9rem] active:opacity-85">
            {editingId ? 'Guardar cambios' : 'Crear actividad'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function ActCard({ act, currentUser, onToggle, onEdit, onDelete }) {
  const joined = act.participantes.includes(currentUser?.name)
  const isCreator = act.creador === currentUser?.name

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-display text-[.975rem] font-extrabold">{act.nombre}</div>
          <div className="text-[.75rem] text-text2 mt-0.5 font-semibold">📅 {act.dia} · ⏰ {act.hora} · por {act.creador}</div>
          {act.descripcion && <div className="text-[.78rem] text-text2 mt-0.5">{act.descripcion}</div>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isCreator && (
            <>
              <button onClick={() => onEdit(act)} className="text-orange text-[.8rem] p-1">✏️</button>
              <button onClick={() => onDelete(act.id)} className="text-text3 text-[.8rem] p-1">🗑️</button>
            </>
          )}
          <button
            onClick={() => onToggle(act.id, currentUser.name)}
            className={`rounded-[10px] px-3.5 py-1.5 text-[.78rem] font-extrabold transition-all active:scale-95 whitespace-nowrap
              ${joined ? 'bg-green-light text-[#065E45]' : 'bg-orange-light text-orange'}`}
          >
            {joined ? '✓ Voy' : '+ Me sumo'}
          </button>
        </div>
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
