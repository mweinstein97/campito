const TABS = [
  { id: 'inicio', icon: '🏠', label: 'Inicio' },
  { id: 'agenda', icon: '📅', label: 'Agenda' },
  { id: 'preparativos', icon: '🎒', label: 'Preparativos' },
  { id: 'gastos', icon: '💸', label: 'Gastos' },
  { id: 'juegos', icon: '🎮', label: 'Juegos' },
]

export default function Nav({ current, onChange, badges = {} }) {
  return (
    <nav className="nav-bar absolute bottom-0 left-0 right-0 bg-card border-t-[1.5px] border-border flex h-[var(--nav)] z-[100]">
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
        >
          <span className={`text-[1.4rem] leading-none transition-transform ${current === t.id ? 'scale-[1.18]' : ''}`}>
            {t.icon}
          </span>
          <span className={`text-[.55rem] font-black font-display uppercase tracking-wider ${current === t.id ? 'text-orange' : 'text-text3'}`}>
            {t.label}
          </span>
          {badges[t.id] && (
            <span className="absolute top-1.5 right-[calc(50%-15px)] bg-pink text-white text-[.58rem] font-black rounded-xl px-1.5 min-w-[15px] text-center font-display">
              !
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}
