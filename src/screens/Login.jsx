import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { EMOJIS } from '../lib/seed'

export default function Login() {
  const { state, addUser, loginAs, showToast } = useApp()
  const [newName, setNewName] = useState('')
  const [selEmoji, setSelEmoji] = useState(EMOJIS[Math.floor(Math.random() * EMOJIS.length)])
  const [showPicker, setShowPicker] = useState(false)

  const users = state ? Object.entries(state.users) : []

  function handleNew() {
    if (!newName.trim()) { showToast('Escribí tu nombre'); return }
    setShowPicker(true)
  }

  async function handleConfirm() {
    const name = newName.trim()
    if (!name) return
    await addUser(name, selEmoji)
    loginAs(name, selEmoji)
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-5 overflow-y-auto">
      {/* Logo */}
      <div className="text-center">
        <div className="text-5xl mb-1">🧉</div>
        <div className="font-display text-[2.4rem] font-black text-orange leading-tight">Familia<br />política</div>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1.5 bg-orange-light text-orange font-bold text-sm px-3.5 py-1.5 rounded-full font-display">
            📍 Campito · 9–12 julio
          </span>
        </div>
      </div>

      {/* Name list */}
      <div className="bg-card rounded-card border-[1.5px] border-border p-4 w-full">
        <h3 className="font-display font-extrabold text-[1.05rem] mb-3.5">¿Quién sos?</h3>
        <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto no-scrollbar">
          {users.length === 0 && (
            <p className="text-sm text-text3 font-semibold">Aún no hay participantes</p>
          )}
          {users.map(([name, { emoji }]) => (
            <button
              key={name}
              onClick={() => loginAs(name, emoji)}
              className="bg-bg border-[1.5px] border-border rounded-xl py-2.5 px-3.5 flex items-center gap-2.5 text-sm font-bold text-text1 text-left transition-all active:scale-[0.98] hover:bg-orange-light hover:border-orange hover:text-orange"
            >
              <span className="text-xl">{emoji}</span>
              {name}
            </button>
          ))}
        </div>

        {/* Add new */}
        <div className="flex gap-2 mt-2.5">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNew()}
            placeholder="Mi nombre..."
            className="flex-1 px-3 py-2.5 border-[1.5px] border-border rounded-xl text-sm bg-bg text-text1 font-sans outline-none focus:border-orange transition-colors"
          />
          <button
            onClick={handleNew}
            className="bg-orange text-white rounded-xl px-4 py-2.5 text-sm font-bold whitespace-nowrap active:opacity-85"
          >
            + Sumarme
          </button>
        </div>
      </div>

      {/* Emoji picker */}
      {showPicker && (
        <div className="bg-card rounded-card border-[1.5px] border-border p-4 w-full">
          <h3 className="font-display font-extrabold text-[1.05rem] mb-2">Elegí tu emoji</h3>
          <div className="max-h-44 overflow-y-auto no-scrollbar mb-3">
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setSelEmoji(e)}
                  className={`rounded-[10px] p-1 text-xl text-center border-[1.5px] transition-all
                    ${e === selEmoji ? 'bg-orange-light border-orange' : 'bg-bg border-border'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full bg-orange text-white rounded-xl py-3 text-sm font-bold active:opacity-85"
          >
            ¡Entrar al viaje!
          </button>
        </div>
      )}
    </div>
  )
}
