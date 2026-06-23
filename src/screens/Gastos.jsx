import { useState } from 'react'
import { useApp, calcDeudas, calcMyBalance } from '../context/AppContext'
import Card from '../components/Card'
import Modal from '../components/Modal'

export default function Gastos({ onBadge }) {
  const { state, currentUser, addGasto, updateGasto, deleteGasto, showToast } = useApp()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ desc:'', monto:'', pagador:'' })
  const [parts, setParts] = useState({})

  const gastos = Object.values(state?.gastos || {}).sort((a, b) => (b.id || '').localeCompare(a.id || ''))
  const deudas = calcDeudas(state?.gastos || {})
  const myBal  = calcMyBalance(state?.gastos || {}, currentUser?.name)
  const total  = gastos.reduce((a, g) => a + g.monto, 0)
  const users  = Object.keys(state?.users || {})

  function openNew() {
    const allSelected = {}
    users.forEach(u => allSelected[u] = true)
    setParts(allSelected)
    setForm({ desc:'', monto:'', pagador: currentUser.name })
    setEditingId(null)
    setModalOpen(true)
  }

  function openEdit(g) {
    const sel = {}
    g.participantes.forEach(u => sel[u] = true)
    setParts(sel)
    setForm({ desc: g.desc, monto: String(g.monto), pagador: g.pagador })
    setEditingId(g.id)
    setModalOpen(true)
  }

  function toggleAll() {
    const allOn = users.every(u => parts[u])
    const next = {}
    users.forEach(u => next[u] = !allOn)
    setParts(next)
  }

  async function handleSave() {
    const selectedParts = users.filter(u => parts[u])
    if (!form.desc.trim() || !form.monto || !selectedParts.length) {
      showToast('Completá todos los campos'); return
    }
    const item = { id: editingId || ('g' + Date.now()), desc: form.desc, monto: parseFloat(form.monto), pagador: form.pagador, participantes: selectedParts }
    if (editingId) {
      await updateGasto(item)
      showToast('Gasto actualizado ✏️')
    } else {
      await addGasto(item)
      showToast('Gasto registrado 💸')
      onBadge?.()
    }
    setModalOpen(false)
  }

  async function handleDelete(id) {
    await deleteGasto(id)
    showToast('Gasto eliminado')
  }

  return (
    <div className="flex flex-col">
      {/* Saldo */}
      <Card className="border-green">
        <div className="text-[.72rem] font-bold text-[#065E45] uppercase tracking-wider">Mi saldo</div>
        <div className={`font-display text-[1.6rem] font-black leading-tight ${myBal >= 0 ? 'text-[#065E45]' : 'text-[#8B0000]'}`}>
          {myBal >= 0 ? '+' : '-'}${Math.abs(myBal).toLocaleString('es-AR')}
        </div>
        <div className="text-[.72rem] text-[#065E45] mt-0.5">{myBal >= 0 ? 'te deben' : 'debés en total'}</div>
      </Card>

      {/* Transferencias */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-[.975rem] font-extrabold">Transferencias</span>
          <span className="inline-flex items-center text-[.68rem] font-extrabold px-2 py-0.5 rounded-md bg-orange-light text-orange font-display">{deudas.length} movimientos</span>
        </div>
        {deudas.length === 0
          ? <div className="text-[.83rem] text-text3 font-semibold py-1">¡Nadie debe nada! 🎉</div>
          : deudas.map((d, i) => {
            const isFrom = d.from === currentUser?.name
            const isTo   = d.to === currentUser?.name
            return (
              <div key={i} className={`flex items-center gap-1.5 py-2 border-b border-border last:border-b-0 rounded-xl px-1
                ${isFrom ? 'bg-orange-light' : isTo ? 'bg-green-light' : ''}`}>
                <span className="text-[.82rem] font-bold">{state.users[d.from]?.emoji || '🙂'} {d.from}</span>
                <span className="text-orange text-[.82rem]">→</span>
                <span className="text-[.82rem] font-bold">{state.users[d.to]?.emoji || '🙂'} {d.to}</span>
                <span className="flex-1 text-right font-display text-[.875rem] font-extrabold text-orange">${d.monto.toLocaleString('es-AR')}</span>
              </div>
            )
          })}
      </Card>

      {/* Lista gastos */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-[.975rem] font-extrabold">Gastos · ${total.toLocaleString('es-AR')}</span>
          <button onClick={openNew} className="bg-orange text-white rounded-xl px-3.5 py-1.5 text-[.78rem] font-bold active:opacity-85">+ Nuevo</button>
        </div>
        {gastos.length === 0
          ? <div className="text-[.83rem] text-text3 font-semibold">Sin gastos aún</div>
          : gastos.map(g => (
            <div key={g.id} className="flex items-center gap-2.5 py-2 border-b border-border last:border-b-0">
              <div className="flex-1 min-w-0">
                <div className="text-[.875rem] font-bold">{g.desc}</div>
                <div className="text-[.72rem] text-text2 font-semibold">
                  Pagó {state.users[g.pagador]?.emoji || '🙂'} {g.pagador} · {g.participantes.length} personas
                </div>
              </div>
              <div className="font-display text-[.975rem] font-extrabold">${g.monto.toLocaleString('es-AR')}</div>
              <button onClick={() => openEdit(g)} className="text-orange text-[.8rem] p-1">✏️</button>
              <button onClick={() => handleDelete(g.id)} className="text-text3 text-[.8rem] p-1">🗑️</button>
            </div>
          ))}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 className="font-display font-black text-[1.15rem] mb-3.5">{editingId ? 'Editar gasto' : 'Nuevo gasto'}</h2>
        <Field label="Descripción">
          <input className={fi} value={form.desc} onChange={e => setForm(f => ({...f, desc: e.target.value}))} placeholder="Súper, asado, combustible..." />
        </Field>
        <Field label="Monto ($)">
          <input className={fi} type="number" value={form.monto} onChange={e => setForm(f => ({...f, monto: e.target.value}))} placeholder="5000" />
        </Field>
        <Field label="¿Quién pagó?">
          <select className={fi} value={form.pagador} onChange={e => setForm(f => ({...f, pagador: e.target.value}))}>
            {users.map(n => <option key={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Participantes">
          <button
            onClick={toggleAll}
            className="mb-2 text-[.75rem] font-bold text-orange underline"
          >
            {users.every(u => parts[u]) ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>
          <div className="flex flex-wrap gap-1.5">
            {users.map(n => (
              <button
                key={n}
                onClick={() => setParts(p => ({...p, [n]: !p[n]}))}
                className={`border-[1.5px] rounded-lg px-2.5 py-1 text-[.78rem] font-semibold transition-all
                  ${parts[n] ? 'bg-purple-light border-purple text-purple' : 'bg-bg border-border text-text1'}`}
              >
                {state.users[n]?.emoji || '🙂'} {n}
              </button>
            ))}
          </div>
        </Field>
        <button onClick={handleSave} className="w-full bg-orange text-white rounded-xl py-3 font-bold text-[.9rem] mt-2 active:opacity-85">
          {editingId ? 'Guardar cambios' : 'Guardar gasto'}
        </button>
      </Modal>
    </div>
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
