import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { EMOJIS } from '../lib/seed'
import Modal from './Modal'

const TITLES = { inicio: 'Inicio', agenda: 'Agenda', preparativos: 'Preparativos', gastos: 'Gastos', juegos: 'Juegos' }

export default function Header({ tab, onAdminClick }) {
  const { currentUser, changeEmoji } = useApp()
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [sel, setSel] = useState(currentUser?.emoji || EMOJIS[0])

  async function handleConfirm() {
    await changeEmoji(currentUser.name, sel)
    setEmojiOpen(false)
  }

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-3.5 pb-1.5 bg-bg sticky top-0 z-10">
        <span className="font-display text-[1.4rem] font-black">{TITLES[tab]}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setSel(currentUser?.emoji || EMOJIS[0]); setEmojiOpen(true) }}
            className="text-[1.3rem] bg-card border-[1.5px] border-border rounded-full w-9 h-9 flex items-center justify-center"
            title="Cambiar emoji"
          >
            {currentUser?.emoji}
          </button>
          <button
            onClick={onAdminClick}
            className="flex items-center gap-1.5 bg-card border-[1.5px] border-border rounded-full py-1.5 pl-2 pr-3"
          >
            <span className="text-[.78rem] font-bold text-text2 max-w-[80px] truncate">{currentUser?.name}</span>
          </button>
        </div>
      </div>

      <Modal open={emojiOpen} onClose={() => setEmojiOpen(false)}>
        <h2 className="font-display font-black text-[1.1rem] mb-3">Elegí tu emoji</h2>
        <div className="grid grid-cols-6 gap-1.5 mb-4">
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setSel(e)}
              className={`rounded-[10px] p-1.5 text-xl text-center border-[1.5px] transition-all
                ${e === sel ? 'bg-orange-light border-orange' : 'bg-bg border-border'}`}
            >
              {e}
            </button>
          ))}
        </div>
        <button onClick={handleConfirm} className="w-full bg-orange text-white rounded-xl py-3 text-sm font-bold active:opacity-85">
          Listo
        </button>
      </Modal>
    </>
  )
}
