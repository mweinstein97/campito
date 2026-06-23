import { useApp } from '../context/AppContext'

export default function Toast() {
  const { toast } = useApp()
  return (
    <div
      className={`fixed bottom-[calc(var(--nav)+16px+var(--safe))] left-1/2 z-50
        bg-text1 text-white px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap
        pointer-events-none transition-all duration-300
        ${toast ? 'opacity-100 -translate-x-1/2 translate-y-0' : 'opacity-0 -translate-x-1/2 translate-y-5'}`}
    >
      {toast}
    </div>
  )
}
