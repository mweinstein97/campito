import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import Card from '../components/Card'

const TABS = [
  { id:'gastro', label:'🍽 Gastronómico' },
  { id:'check',  label:'✅ Checklist' },
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
  const { state, currentUser, takeItem, releaseItem, addCheckItem, showToast } = useApp()
  const newItemRef = useRef()
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
            <div key={id} className="flex items-center gap-2.5 py-2 border-b border-border last:border-b-0">
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

const fi = 'w-full px-3 py-2.5 border-[1.5px] border-border rounded-xl text-[.9rem] bg-bg text-text1 font-sans outline-none focus:border-orange transition-colors'
