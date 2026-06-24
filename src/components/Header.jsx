import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { EMOJIS } from '../lib/seed'
import Modal from './Modal'

const TITLES = { inicio: 'Inicio', agenda: 'Agenda', preparativos: 'Previa', menus: 'Menús', gastos: 'Gastos', juegos: 'Juegos' }

export default function Header({ tab, onAdminClick }) {
  const { currentUser, changeEmoji, changeName, showToast } = useApp()
  const [profileOpen, setProfileOpen] = useState(false)
  const [sel, setSel] = useState(currentUser?.emoji || EMOJIS[0])
  const [nameVal, setNameVal] = useState(currentUser?.name || '')

  function openProfile() {
    setSel(currentUser?.emoji || EMOJIS[0])
    setNameVal(currentUser?.name || '')
    setProfileOpen(true)
  }

  async function handleSave() {
    const newName = nameVal.trim()
    const oldName = currentUser.name
    const newEmoji = sel

    if (!newName) { showToast('El nombre no puede estar vacío'); return }

    if (newEmoji !== currentUser.emoji && newName === oldName) {
      await changeEmoji(oldName, newEmoji)
    } else if (newName !== oldName) {
      await changeName(oldName, newName, newEmoji)
    }
    setProfileOpen(false)
    showToast('¡Perfil actualizado! ✨')
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-3.5 pb-1.5 bg-bg sticky top-0 z-10">
        <span className="font-display text-[1.4rem] font-black">{TITLES[tab]}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={openProfile}
            className="flex items-center gap-1.5 bg-card border-[1.5px] border-border rounded-full py-1.5 pl-1.5 pr-3"
          >
            <span className="text-[1.05rem]">{currentUser?.emoji}</span>
            <span className="text-[.78rem] font-bold text-text2 max-w-[80px] truncate">{currentUser?.name}</span>
          </button>
          <button
            onClick={onAdminClick}
            className="bg-card border-[1.5px] border-border rounded-full w-8 h-8 flex items-center justify-center text-text3 text-[.8rem] font-bold"
            title="Admin"
          >
            ⚙️
          </button>
        </div>
      </div>

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)}>
        <h2 className="font-display font-black text-[1.1rem] mb-1">Tu perfil</h2>
        <p className="text-[.78rem] text-text3 mb-3">Cambiá tu nombre o emoji</p>

        <div className="mb-3">
          <label className="block text-[.75rem] font-bold text-text2 mb-0.5 uppercase tracking-wide">Nombre</label>
          <input
            className="w-full px-3 py-2.5 border-[1.5px] border-border rounded-xl text-[.9rem] bg-bg text-text1 font-sans outline-none focus:border-orange transition-colors"
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div className="mb-4">
          <label className="block text-[.75rem] font-bold text-text2 mb-1.5 uppercase tracking-wide">Emoji</label>
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setSel(e)}
                className={`rounded-[10px] p-1 text-lg text-center border-[1.5px] transition-all
                  ${e === sel ? 'bg-orange-light border-orange' : 'bg-bg border-border'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-orange text-white rounded-xl py-3 text-sm font-bold active:opacity-85">
          Guardar
        </button>
      </Modal>
    </>
  )
}
