import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import Card from '../components/Card'

const TABS = [
  { id:'gastro',  label:'🍽 Gastronómico' },
  { id:'check',   label:'✅ Checklist' },
  { id:'autos',   label:'🚗 Autos' },
  { id:'resumen', label:'📋 Resumen' },
]

export default function Preparativos() {
  const [tab, setTab] = useState('gastro')

  return (
    <div className="flex flex-col">
      <div className="flex gap-2 px-4 pt-2.5 pb-0.5 overflow-x-auto no-scrollbar">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-[.78rem] font-extrabold whitespace-nowrap border-[1.5px] font-display transition-all
              ${tab === t.id ? 'bg-orange text-white border-orange' : 'bg-card text-text2 border-border'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'gastro'  && <Gastro />}
      {tab === 'check'   && <Checklist />}
      {tab === 'autos'   && <Autos />}
      {tab === 'resumen' && <Resumen />}
    </div>
  )
}

function Gastro() {
  const { state, currentUser, savePref, showToast } = useApp()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const pref = state?.pref?.[currentUser?.name]

  function startEdit() {
    setForm(pref || {})
    setEditing(true)
  }

  async function handleSave() {
    await savePref(currentUser.name, {
      noCome:   form.noCome   || '',
      desayuno: form.desayuno || '',
      desea:    form.desea    || '',
      bebida:   form.bebida   || '',
    })
    setEditing(false)
    showToast('¡Preferencias guardadas! 🎉')
  }

  if (pref && !editing) {
    return (
      <Card className="border-orange bg-gradient-to-br from-[#F5F3FF] to-[#EEF2FF] relative">
        <div className="font-display font-extrabold text-[.9rem] mb-2 flex items-center gap-1.5">
          {currentUser.emoji} Mis preferencias
        </div>
        {[['🚫','No como',pref.noCome],['☀️','Desayuno',pref.desayuno],['✨','Me haría feliz',pref.desea],['🍹','Bebida',pref.bebida]].map(([ic,lb,v]) => v ? (
          <div key={lb} className="flex gap-1.5 items-start mb-1">
            <span className="text-[.875rem] flex-shrink-0 mt-0.5">{ic}</span>
            <span className="text-[.8rem] text-text2 font-semibold">{lb}: <b>{v}</b></span>
          </div>
        ) : null)}
        <button onClick={startEdit} className="absolute top-3 right-4 bg-orange-light text-orange rounded-lg px-2.5 py-1 text-[.72rem] font-extrabold">Editar</button>
      </Card>
    )
  }

  return (
    <Card>
      {!pref && <p className="text-[.875rem] font-semibold text-text2 mb-3.5">Contanos tus preferencias para el viaje 🍽</p>}
      {[['noCome','🚫 Cosas que no comés o no te gustan','Mariscos, picante...'],
        ['desayuno','☀️ Qué no te puede faltar en el desayuno','Medialunas, yogur...'],
        ['desea','✨ Algo que te haría muy feliz comer','Sushi, asado, tarta...'],
        ['bebida','🍹 Bebida favorita','Fernet, vino, cerveza...']
      ].map(([k, label, ph]) => (
        <div key={k} className="mb-2.5">
          <label className="block text-[.75rem] font-bold text-text2 mb-0.5 uppercase tracking-wide">{label}</label>
          <input
            className={fi}
            value={form[k] || ''}
            onChange={e => setForm(f => ({...f, [k]: e.target.value}))}
            placeholder={ph}
          />
        </div>
      ))}
      <div className="flex gap-2">
        {pref && <button onClick={() => setEditing(false)} className="flex-1 bg-bg border-[1.5px] border-border text-text2 rounded-xl py-2.5 text-sm font-bold">Cancelar</button>}
        <button onClick={handleSave} className="flex-1 bg-orange text-white rounded-xl py-2.5 text-sm font-bold active:opacity-85">Guardar</button>
      </div>
    </Card>
  )
}

function Checklist() {
  const { state, currentUser, takeItem, releaseItem, addCheckItem, updateCheckItem, deleteCheckItem, showToast } = useApp()
  const newItemRef = useRef()
  const [editId, setEditId] = useState(null)
  const [editVal, setEditVal] = useState('')
  const items = Object.entries(state?.check || {})
  const covered = items.filter(([, v]) => (v.portadores || []).length > 0).length

  async function handleTake(id) {
    await takeItem(id, currentUser.name)
    showToast(`Llevás ${state.check[id].item} ✅`)
  }

  async function handleRelease(id) {
    await releaseItem(id, currentUser.name)
  }

  async function handleAdd() {
    const v = newItemRef.current?.value.trim()
    if (!v) return
    await addCheckItem({ id: 'c' + Date.now(), item: v, portadores: [] })
    newItemRef.current.value = ''
    showToast('Elemento agregado ✅')
  }

  async function handleUpdate(id) {
    if (!editVal.trim()) return
    await updateCheckItem(id, editVal.trim())
    setEditId(null)
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-[.975rem] font-extrabold">Qué llevamos</span>
          <span className="inline-flex items-center text-[.68rem] font-extrabold px-2 py-0.5 rounded-md bg-green-light text-[#065E45] font-display">
            {covered}/{items.length} cubiertos
          </span>
        </div>
        {items.map(([id, v]) => {
          const portadores = v.portadores || []
          const iMine = portadores.includes(currentUser?.name)
          const covered = portadores.length > 0

          return (
            <div key={id} className="py-2 border-b border-border last:border-b-0">
              {editId === id ? (
                <div className="flex gap-2">
                  <input
                    className={fi + ' flex-1'}
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUpdate(id)}
                    autoFocus
                  />
                  <button onClick={() => handleUpdate(id)} className="bg-orange text-white rounded-xl px-3 text-[.8rem] font-bold">✓</button>
                  <button onClick={() => setEditId(null)} className="border-[1.5px] border-border rounded-xl px-3 text-[.8rem] font-bold text-text3">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <span className="text-[.975rem]">{covered ? '✅' : '⬜'}</span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[.875rem] font-semibold ${covered ? 'text-text3 line-through' : ''}`}>{v.item}</span>
                    {portadores.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {portadores.map(p => (
                          <span key={p} className="text-[.68rem] text-[#065E45] font-bold bg-green-light px-1.5 py-0.5 rounded-full">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { setEditId(id); setEditVal(v.item) }} className="text-text3 text-[.8rem] p-1">✏️</button>
                  <button onClick={() => deleteCheckItem(id)} className="text-text3 text-[.8rem] p-1">🗑️</button>
                  {iMine ? (
                    <button onClick={() => handleRelease(id)} className="bg-[#FFE0E0] text-[#8B0000] rounded-lg px-3 py-1 text-[.73rem] font-extrabold whitespace-nowrap">
                      Suelto
                    </button>
                  ) : (
                    <button onClick={() => handleTake(id)} className="bg-green-light text-[#065E45] rounded-lg px-3 py-1 text-[.73rem] font-extrabold whitespace-nowrap">
                      Lo llevo
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </Card>
      <Card className="flex gap-2">
        <input ref={newItemRef} placeholder="Agregar elemento..." className={fi + ' flex-1'} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <button onClick={handleAdd} className="bg-orange text-white rounded-xl px-4 font-bold text-lg active:opacity-85">+</button>
      </Card>
    </>
  )
}

function Resumen() {
  const { state } = useApp()
  const prefs = Object.entries(state?.pref || {})

  if (!prefs.length) return (
    <div className="text-center py-10 text-text3">
      <div className="text-4xl mb-2">🍽</div>
      <p className="text-[.875rem] font-semibold">Nadie completó preferencias aún</p>
    </div>
  )

  const sections = [
    { key: 'noCome',   icon: '🚫', title: 'No comen' },
    { key: 'desayuno', icon: '☀️', title: 'Desayuno' },
    { key: 'desea',    icon: '✨', title: 'Se mueren por comer' },
    { key: 'bebida',   icon: '🍹', title: 'Qué toman' },
  ]

  return (
    <>
      {sections.map(({ key, icon, title }) => {
        const answers = prefs.filter(([, p]) => p[key]).map(([n, p]) => ({ n, v: p[key] }))
        if (!answers.length) return null
        return (
          <Card key={key}>
            <div className="font-display font-extrabold text-[.9rem] mb-2.5">{icon} {title}</div>
            {answers.map(({ n, v }) => (
              <div key={n} className="flex items-baseline gap-2 py-1.5 border-b border-border last:border-b-0">
                <span className="text-[.78rem] font-bold text-text2 whitespace-nowrap">
                  {state.users[n]?.emoji} {n}
                </span>
                <span className="text-[.82rem] text-text1 flex-1">{v}</span>
              </div>
            ))}
          </Card>
        )
      })}
    </>
  )
}

function Autos() {
  const { state, currentUser, addAuto, updateAuto, deleteAuto, joinAuto, leaveAuto, showToast } = useApp()
  const autos = Object.values(state?.autos || {})
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ origen: '', hora: '', cupos: '4' })

  function openNew() { setForm({ origen: '', hora: '', cupos: '4' }); setEditId(null); setShowForm(true) }
  function openEdit(a) { setForm({ origen: a.origen, hora: a.hora, cupos: String(a.cupos) }); setEditId(a.id); setShowForm(true) }

  async function handleSave() {
    if (!form.origen.trim()) { showToast('Indicá desde dónde salís'); return }
    const cupos = Math.min(4, Math.max(1, parseInt(form.cupos) || 4))
    if (editId) {
      const existing = state.autos[editId]
      await updateAuto({ ...existing, origen: form.origen.trim(), hora: form.hora, cupos })
      showToast('Auto actualizado ✅')
    } else {
      await addAuto({ id: 'car' + Date.now(), conductor: currentUser.name, origen: form.origen.trim(), hora: form.hora, cupos, pasajeros: [] })
      showToast('¡Auto ofrecido! 🚗')
    }
    setShowForm(false)
  }

  return (
    <>
      {autos.length === 0 && !showForm && (
        <div className="text-center py-10 text-text3">
          <div className="text-4xl mb-2">🚗</div>
          <p className="text-[.875rem] font-semibold">Nadie ofreció auto aún</p>
        </div>
      )}

      {autos.map(a => {
        const pasajeros = a.pasajeros || []
        const libres = a.cupos - pasajeros.length
        const isConductor = a.conductor === currentUser?.name
        const isPasajero = pasajeros.includes(currentUser?.name)
        const lleno = libres <= 0 && !isPasajero

        return (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg">{state.users[a.conductor]?.emoji || '🙂'}</span>
                  <span className="font-display font-extrabold text-[.975rem]">{a.conductor}</span>
                  <span className={`text-[.68rem] font-extrabold px-2 py-0.5 rounded-full ${libres > 0 ? 'bg-green-light text-[#065E45]' : 'bg-[#FFE0E0] text-[#8B0000]'}`}>
                    {libres > 0 ? `${libres} lugar${libres > 1 ? 'es' : ''}` : 'Lleno'}
                  </span>
                </div>
                <div className="text-[.78rem] text-text2 font-semibold">
                  📍 {a.origen}{a.hora ? ` · ⏰ ${a.hora}` : ''}
                </div>
                {pasajeros.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {pasajeros.map(p => (
                      <span key={p} className="text-[.68rem] font-bold bg-orange-light text-orange px-2 py-0.5 rounded-full">
                        {state.users[p]?.emoji} {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isConductor && (
                  <>
                    <button onClick={() => openEdit(a)} className="text-orange text-[.8rem] p-1">✏️</button>
                    <button onClick={() => deleteAuto(a.id)} className="text-text3 text-[.8rem] p-1">🗑️</button>
                  </>
                )}
                {!isConductor && (
                  isPasajero ? (
                    <button onClick={() => leaveAuto(a.id, currentUser.name)} className="bg-[#FFE0E0] text-[#8B0000] rounded-lg px-3 py-1.5 text-[.73rem] font-extrabold whitespace-nowrap">
                      Me bajo
                    </button>
                  ) : (
                    <button
                      onClick={() => { if (!lleno) joinAuto(a.id, currentUser.name) }}
                      disabled={lleno}
                      className={`rounded-lg px-3 py-1.5 text-[.73rem] font-extrabold whitespace-nowrap transition-all
                        ${lleno ? 'bg-bg text-text3 cursor-default' : 'bg-orange-light text-orange active:opacity-75'}`}
                    >
                      Me sumo
                    </button>
                  )
                )}
              </div>
            </div>
          </Card>
        )
      })}

      {showForm ? (
        <Card>
          <h3 className="font-display font-extrabold text-[.975rem] mb-3">{editId ? 'Editar auto' : 'Ofrecer auto'}</h3>
          <div className="mb-2.5">
            <label className="block text-[.75rem] font-bold text-text2 mb-0.5 uppercase tracking-wide">Desde dónde salís</label>
            <input className={fi} value={form.origen} onChange={e => setForm(f => ({...f, origen: e.target.value}))} placeholder="Palermo, Belgrano..." />
          </div>
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <div>
              <label className="block text-[.75rem] font-bold text-text2 mb-0.5 uppercase tracking-wide">Hora de salida</label>
              <input className={fi} value={form.hora} onChange={e => setForm(f => ({...f, hora: e.target.value}))} placeholder="08:00" />
            </div>
            <div>
              <label className="block text-[.75rem] font-bold text-text2 mb-0.5 uppercase tracking-wide">Cupos (máx 4)</label>
              <input className={fi} type="number" min="1" max="4" value={form.cupos} onChange={e => setForm(f => ({...f, cupos: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 border-[1.5px] border-border text-text2 rounded-xl py-2.5 text-[.875rem] font-bold">Cancelar</button>
            <button onClick={handleSave} className="flex-1 bg-orange text-white rounded-xl py-2.5 text-[.875rem] font-bold">{editId ? 'Guardar' : 'Ofrecer'}</button>
          </div>
        </Card>
      ) : (
        !autos.some(a => a.conductor === currentUser?.name) && (
          <div className="px-4 pb-2">
            <button onClick={openNew} className="w-full bg-orange text-white rounded-xl py-3 font-bold text-[.875rem] active:opacity-85">
              🚗 Ofrecer mi auto
            </button>
          </div>
        )
      )}
    </>
  )
}

const fi = 'w-full px-3 py-2.5 border-[1.5px] border-border rounded-xl text-[.9rem] bg-bg text-text1 font-sans outline-none focus:border-orange transition-colors'
