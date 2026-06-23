import { useState } from 'react'
import { useApp, calcRanking } from '../context/AppContext'
import Card from '../components/Card'

const MEDALS = ['🥇','🥈','🥉']

export default function Juegos() {
  const [tab, setTab] = useState('prode')

  return (
    <div className="flex flex-col">
      <div className="flex gap-2 px-4 pt-2.5 pb-0.5 overflow-x-auto no-scrollbar">
        {[['prode','🎯 Prode'],['ranking','🏆 Ranking']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full px-3.5 py-1.5 text-[.78rem] font-extrabold whitespace-nowrap border-[1.5px] font-display transition-all
              ${tab === id ? 'bg-orange text-white border-orange' : 'bg-card text-text2 border-border'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'prode' ? <Prode /> : <Ranking />}
    </div>
  )
}

function Prode() {
  const { state, currentUser, respProde, saveProdeResps, showToast } = useApp()
  const prode = state?.prode
  if (!prode?.pregs?.length) return (
    <div className="text-center py-10 text-text3">
      <div className="text-4xl mb-2">🎯</div>
      <p className="text-[.875rem] font-semibold">El admin aún no cargó las preguntas del prode</p>
    </div>
  )

  const myResps = prode.resp[currentUser?.name] || {}

  async function handleSave() {
    await saveProdeResps(currentUser.name, myResps)
    showToast('Prode guardado 🎯')
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3.5">
        <span className="font-display text-[.975rem] font-extrabold">Prode del viaje</span>
        <span className={`inline-flex items-center text-[.68rem] font-extrabold px-2 py-0.5 rounded-md font-display ${prode.closed ? 'bg-orange-light text-orange' : 'bg-green-light text-[#065E45]'}`}>
          {prode.closed ? 'Cerrado' : 'Abierto'}
        </span>
      </div>
      {prode.pregs.map((q, qi) => {
        const resp = myResps[q.id]
        const corr = prode.correct?.[q.id]
        const isLast = qi === prode.pregs.length - 1
        return (
          <div key={q.id} className={`mb-3 pb-3 ${!isLast ? 'border-b border-border' : ''}`}>
            <div className="text-[.875rem] font-bold mb-1.5">{q.pregunta}</div>
            <div className="flex flex-wrap gap-1.5">
              {q.opciones.map(o => {
                let cls = 'bg-bg border-border text-text1'
                if (corr) {
                  if (o === corr) cls = 'bg-green-light border-green text-[#065E45]'
                  else if (o === resp && o !== corr) cls = 'bg-[#FFE0E0] border-[#FF6B6B] text-[#8B0000]'
                } else if (o === resp) cls = 'bg-purple-light border-purple text-purple'
                return (
                  <button
                    key={o}
                    disabled={prode.closed && !corr}
                    onClick={() => respProde(currentUser.name, q.id, o)}
                    className={`border-[1.5px] rounded-lg px-2.5 py-1 text-[.78rem] font-semibold transition-all disabled:opacity-60 ${cls}`}
                  >
                    {o}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      {!prode.closed && (
        <button onClick={handleSave} className="w-full bg-orange text-white rounded-xl py-3 font-bold text-[.9rem] mt-1 active:opacity-85">
          Guardar respuestas
        </button>
      )}
    </Card>
  )
}

function Ranking() {
  const { state, currentUser } = useApp()
  const rnk = calcRanking(state)

  return (
    <Card>
      <div className="font-display text-[.975rem] font-extrabold mb-3.5">Ranking general</div>
      {rnk.map(([n, p], i) => (
        <div
          key={n}
          className={`flex items-center gap-2.5 py-1.5 rounded-xl ${n === currentUser?.name ? 'bg-orange-light px-2' : ''}`}
        >
          <span className={`font-display font-extrabold w-6 text-center ${i < 3 ? 'text-xl' : 'text-[.82rem]'}`}>
            {i < 3 ? MEDALS[i] : i + 1}
          </span>
          <span className="text-xl">{state.users[n]?.emoji || '🙂'}</span>
          <span className="flex-1 text-[.875rem] font-bold">{n}</span>
          <span className="text-[.82rem] font-extrabold text-orange">{p} pts</span>
        </div>
      ))}
    </Card>
  )
}
