import { useState, useEffect } from 'react'

export default function Modal({ open, onClose, children }) {
  const [kbOffset, setKbOffset] = useState(0)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    function onResize() {
      setKbOffset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop))
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  return (
    <div
      className={`fixed inset-0 bg-text1/45 z-[200] flex flex-col justify-end
        transition-opacity duration-[220ms] ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-card rounded-t-[24px] px-6 pt-6 max-h-[88vh] overflow-y-auto transition-transform duration-[220ms]
          ${open ? 'translate-y-0' : 'translate-y-16'}`}
        style={{ paddingBottom: `calc(${kbOffset}px + 1.5rem + var(--safe))` }}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
        {children}
      </div>
    </div>
  )
}
