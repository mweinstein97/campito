import { useApp } from '../context/AppContext'

const TITLES = { inicio: 'Inicio', agenda: 'Agenda', preparativos: 'Preparativos', gastos: 'Gastos', juegos: 'Juegos' }

export default function Header({ tab, onAdminClick }) {
  const { currentUser } = useApp()
  return (
    <div className="flex items-center justify-between px-5 pt-3.5 pb-1.5 bg-bg sticky top-0 z-10">
      <span className="font-display text-[1.4rem] font-black">{TITLES[tab]}</span>
      <button
        onClick={onAdminClick}
        className="flex items-center gap-1.5 bg-card border-[1.5px] border-border rounded-full py-1.5 pl-1.5 pr-3"
      >
        <span className="text-[1.05rem]">{currentUser?.emoji}</span>
        <span className="text-[.78rem] font-bold text-text2 max-w-[80px] truncate">{currentUser?.name}</span>
      </button>
    </div>
  )
}
