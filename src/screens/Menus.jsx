import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Card from '../components/Card'
import Modal from '../components/Modal'

const SLOTS = [
  { id: 'desayuno', label: 'Desayunos', icon: '☕', grupo: 'Todos los días' },
  { id: 'merienda', label: 'Meriendas', icon: '🍪', grupo: 'Todos los días' },
  { id: 'postre',   label: 'Postres',   icon: '🍰', grupo: 'Todos los días' },
  { id: 'snacks',   label: 'Snacks',    icon: '🥜', grupo: 'Todos los días' },
  { id: 'alm-jue',  label: 'Almuerzo',  icon: '🍽️', grupo: 'Jueves 10' },
  { id: 'cen-jue',  label: 'Cena',      icon: '🌙', grupo: 'Jueves 10' },
  { id: 'alm-vie',  label: 'Almuerzo',  icon: '🍽️', grupo: 'Viernes 11' },
  { id: 'cen-vie',  label: 'Cena',      icon: '🌙', grupo: 'Viernes 11' },
  { id: 'alm-sab',  label: 'Almuerzo',  icon: '🍽️', grupo: 'Sábado 12' },
  { id: 'cen-sab',  label: 'Cena',      icon: '🌙', grupo: 'Sábado 12' },
]

const GRUPOS = ['Todos los días', 'Jueves 10', 'Viernes 11', 'Sábado 12']

export default function Menus() {
  const { state, saveMenu, showToast } = useApp()
  const menus = state?.menus || {}
  const [tab, setTab] = useState('menus')
  const [editSlot, setEditSlot] = useState(null)
  const [form, setForm] = useState({ plato: '', ingredientes: '' })

  function openEdit(slot) {
    const m = menus[slot.id] || { plato: '', ingredientes: [] }
    setForm({ plato: m.plato || '', ingredientes: (m.ingredientes || []).join('\n') })
    setEditSlot(slot)
  }

  async function handleSave() {
    const ingredientes = form.ingredientes
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    await saveMenu(editSlot.id, { plato: form.plato.trim(), ingredientes })
    showToast('Menú guardado ✅')
    setEditSlot(null)
  }

  // Shopping list: count occurrences of each ingredient across all slots
  const ingCount = {}
  SLOTS.forEach(s => {
    const m = menus[s.id]
    if (!m) return
    ;(m.ingredientes || []).forEach(ing => {
      const key = ing.toLowerCase().trim()
      if (!ingCount[key]) ingCount[key] = { label: ing, count: 0 }
      ingCount[key].count++
    })
  })
  const allIngredientes = Object.values(ingCount).sort((a, b) => a.label.localeCompare(b.label))

  return (
    <div className="flex flex-col">
      <div className="flex gap-2 px-4 pt-2.5 pb-0.5 overflow-x-auto no-scrollbar">
        {[['menus','🍽️ Menús'],['lista','🛒 Lista de compras']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full px-3.5 py-1.5 text-[.78rem] font-extrabold whitespace-nowrap border-[1.5px] font-display transition-all
              ${tab === id ? 'bg-orange text-white border-orange' : 'bg-card text-text2 border-border'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'menus' ? (
        GRUPOS.map(grupo => {
          const slots = SLOTS.filter(s => s.grupo === grupo)
          return (
            <div key={grupo}>
              <div className="px-4 pt-3 pb-1">
                <span className="text-[.72rem] font-extrabold text-text3 uppercase tracking-widest font-display">{grupo}</span>
              </div>
              {slots.map(slot => {
                const m = menus[slot.id]
                return (
                  <Card key={slot.id}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-base">{slot.icon}</span>
                          <span className="font-display font-extrabold text-[.9rem]">{slot.label}</span>
                        </div>
                        {m?.plato ? (
                          <>
                            <div className="text-[.875rem] font-semibold text-text1">{m.plato}</div>
                            {m.ingredientes?.length > 0 && (
                              <div className="text-[.72rem] text-text3 mt-0.5">{m.ingredientes.join(' · ')}</div>
                            )}
                          </>
                        ) : (
                          <div className="text-[.78rem] text-text3 font-semibold">Sin definir</div>
                        )}
                      </div>
                      <button
                        onClick={() => openEdit(slot)}
                        className="text-orange text-[.78rem] font-bold border-[1.5px] border-orange-light bg-orange-light rounded-xl px-3 py-1.5 active:opacity-75 whitespace-nowrap flex-shrink-0"
                      >
                        {m?.plato ? 'Editar' : '+ Agregar'}
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )
        })
      ) : (
        <Card>
          <div className="font-display font-extrabold text-[.975rem] mb-3">Lista de compras</div>
          {allIngredientes.length === 0 ? (
            <div className="text-center py-6 text-text3">
              <div className="text-3xl mb-2">🛒</div>
              <p className="text-[.83rem] font-semibold">Cargá ingredientes en los menús<br />para ver la lista acá</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {allIngredientes.map(({ label, count }) => (
                <div key={label} className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl bg-bg">
                  <span className="text-orange font-black text-[.7rem]">○</span>
                  <span className="flex-1 text-[.875rem] font-semibold">{label}</span>
                  {count > 1 && (
                    <span className="text-[.72rem] font-extrabold text-orange bg-orange-light px-2 py-0.5 rounded-full">×{count}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Modal open={!!editSlot} onClose={() => setEditSlot(null)}>
        {editSlot && (
          <>
            <h2 className="font-display font-black text-[1.1rem] mb-0.5">
              {editSlot.icon} {editSlot.label}
            </h2>
            <p className="text-[.75rem] text-text3 mb-3">{editSlot.grupo}</p>

            <div className="mb-3">
              <label className="block text-[.75rem] font-bold text-text2 mb-0.5 uppercase tracking-wide">Plato / menú</label>
              <input
                className={fi}
                value={form.plato}
                onChange={e => setForm(f => ({...f, plato: e.target.value}))}
                placeholder="Ej: Asado, Fideos con tuco..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-[.75rem] font-bold text-text2 mb-0.5 uppercase tracking-wide">Ingredientes (uno por línea)</label>
              <textarea
                className={fi}
                rows={6}
                style={{ resize: 'none' }}
                value={form.ingredientes}
                onChange={e => setForm(f => ({...f, ingredientes: e.target.value}))}
                placeholder={'Carne 2kg\nChorizos\nPan\nEnsalada...'}
              />
            </div>

            <button onClick={handleSave} className="w-full bg-orange text-white rounded-xl py-3 text-sm font-bold active:opacity-85">
              Guardar menú
            </button>
          </>
        )}
      </Modal>
    </div>
  )
}

const fi = 'w-full px-3 py-2.5 border-[1.5px] border-border rounded-xl text-[.9rem] bg-bg text-text1 font-sans outline-none focus:border-orange transition-colors'
