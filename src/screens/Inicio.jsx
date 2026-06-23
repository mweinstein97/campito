import { useState, useEffect } from 'react'
import { useApp, calcCountdown, calcRanking, todayKey } from '../context/AppContext'
import Card from '../components/Card'

const MEDALS = ['🥇','🥈','🥉','4️⃣','5️⃣']

export default function Inicio() {
  const { state, currentUser, respDesafio, showToast } = useApp()
  const [cd, setCd] = useState(calcCountdown())

  useEffect(() => {
    const t = setInterval(() => setCd(calcCountdown()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!state) return null

  const total = Object.keys(state.users).length
  const compl = Object.keys(state.pref).length
  const pct = total ? Math.round(compl / total * 100) : 0
  const hoy = todayKey()
  const dsf = state.desafios[hoy]
  const rnk = calcRanking(state).slice(0, 5)

  async function handleRespDsf(op) {
    await respDesafio(hoy, currentUser.name, op)
    showToast('Respuesta guardada ⚡')
  }

  const myResp = dsf?.respuestas?.[currentUser?.name]

  return (
    <div className="flex flex-col">
      {/* Countdown card */}
      <div className="bg-orange rounded-[20px] mx-4 mt-4 mb-3 px-6 py-5 text-white">
        <div className="text-[.72rem] font-bold opacity-85 tracking-wider uppercase">📍 Campito · 9–12 de julio</div>
        {cd.gone ? (
          <div className="text-[1.3rem] font-extrabold my-2">¡El viaje ya comenzó! 🎉</div>
        ) : (
          <div className="flex gap-3.5 my-2">
            {[['d','días'],['h','hs'],['m','min'],['s','seg']].map(([k,l]) => (
              <div key={k} className="text-center">
                <div className="font-display text-[2rem] font-black leading-none">{cd[k]}</div>
                <div className="text-[.62rem] font-bold opacity-80 uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </div>
        )}
        <div className="bg-white/30 rounded-xl h-2 overflow-hidden mt-3.5">
          <div className="bg-white h-full rounded-xl transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[.72rem] opacity-90 mt-1 font-semibold">{compl}/{total} completaron preferencias</div>
      </div>

      {/* Desafío */}
      <Card className="bg-yellow-light border-yellow">
        <div className="inline-flex items-center gap-1 bg-yellow text-[#7A5B00] text-[.68rem] font-extrabold px-2.5 py-0.5 rounded-[10px] mb-2 font-display">
          ⚡ Desafío del día
        </div>
        {dsf ? (
          <>
            <div className="text-[.975rem] font-bold mb-3">{dsf.pregunta}</div>
            <div className="flex flex-col gap-1.5">
              {dsf.opciones.map(o => {
                let cls = 'bg-card border-border text-text1'
                if (myResp) {
                  if (dsf.correcta) {
                    if (o === dsf.correcta) cls = 'bg-green-light border-green text-[#065E45]'
                    else if (o === myResp && o !== dsf.correcta) cls = 'bg-[#FFE0E0] border-[#FF6B6B] text-[#8B0000]'
                  } else if (o === myResp) cls = 'bg-yellow border-[#D4A000] text-[#7A5B00]'
                }
                return (
                  <button
                    key={o}
                    disabled={!!myResp}
                    onClick={() => handleRespDsf(o)}
                    className={`border-[1.5px] rounded-xl px-3.5 py-2.5 text-left text-[.875rem] font-semibold transition-all disabled:cursor-default ${cls}`}
                  >
                    {o}
                  </button>
                )
              })}
            </div>
            {myResp && (
              myResp === dsf.correcta
                ? <div className="flex items-center gap-2 mt-2 px-2 py-1.5 bg-green/10 rounded-xl text-[.83rem] font-bold text-[#065E45]">✅ ¡Correcto! +100 pts</div>
                : dsf.correcta
                  ? <div className="flex items-center gap-2 mt-2 px-2 py-1.5 bg-[#FFE0E0] rounded-xl text-[.8rem] font-bold text-[#8B0000]">❌ Esta no era. Correcta: {dsf.correcta}</div>
                  : <div className="flex items-center gap-2 mt-2 px-2 py-1.5 bg-yellow/20 rounded-xl text-[.83rem] font-bold text-[#7A5B00]">⏳ Respuesta guardada</div>
            )}
          </>
        ) : (
          <div className="text-center py-3 text-text3 font-semibold text-[.875rem]">Sin desafío hoy 🌙</div>
        )}
      </Card>

      {/* Ranking */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-[.975rem] font-extrabold">Ranking</span>
          <span className="inline-flex items-center text-[.68rem] font-extrabold px-2 py-0.5 rounded-md bg-orange-light text-orange font-display">{total} viajeros</span>
        </div>
        <div className="flex flex-col gap-1">
          {rnk.length === 0 ? (
            <p className="text-[.83rem] text-text3 font-semibold">Todavía no hay puntos</p>
          ) : rnk.map(([n, p], i) => (
            <div key={n} className="flex items-center gap-2.5 py-1.5">
              <span className={`font-display font-extrabold w-6 text-center ${i < 3 ? 'text-xl' : 'text-[.82rem]'}`}>{MEDALS[i]}</span>
              <span className="text-xl">{state.users[n]?.emoji || '🙂'}</span>
              <span className="flex-1 text-[.875rem] font-bold">{n}</span>
              <span className="text-[.82rem] font-extrabold text-orange">{p} pts</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
