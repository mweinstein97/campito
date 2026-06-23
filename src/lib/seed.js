// Datos de demo cuando no hay Supabase configurado
export const EMOJIS = ['🌊','🏄','🎸','🌮','🐶','🦋','🌺','⚡','🎯','🦁','🌙','🎪','🍕','🚀','🎨','🌵','🦊','🎭','🍦','🏔','🐬','🌸','🦄','🎲']

export const CHECKLIST_INICIAL = ['Hielo', 'Parlante', 'Botiquín', 'Pelota', 'Juegos de mesa', 'Bajante']

export const VIAJEROS = [
  ['Alejo', '🌊'], ['Bruno', '🎸'], ['Iara', '🌺'], ['Ori', '🦋'],
  ['Martin', '⚡'], ['Val', '🌸'], ['Fede', '🎯'], ['Simón', '🦁'],
  ['Mila', '🌙'], ['Meli', '🍦'], ['Lucho', '🏔'], ['Juli', '🌵'],
  ['Yae', '🦄'], ['Lara', '🌮'], ['Alex', '🚀'], ['Mic', '🎨'],
  ['Chicho', '🦊'], ['Weri', '🎭'], ['Cami', '🍕'], ['Cata', '🐬'],
  ['Santi', '🎲'], ['Gime', '🎪'], ['Iña', '🐶'],
]

export function buildSeedState() {
  const users = {}
  VIAJEROS.forEach(([n, e]) => { users[n] = { emoji: e } })

  return {
    users,
    agenda: {},
    pref: {},
    check: {
      c1: { id:'c1', item:'Hielo', q:null },
      c2: { id:'c2', item:'Parlante', q:null },
      c3: { id:'c3', item:'Botiquín', q:null },
      c4: { id:'c4', item:'Pelota', q:null },
      c5: { id:'c5', item:'Juegos de mesa', q:null },
      c6: { id:'c6', item:'Bajante', q:null },
    },
    gastos: {},
    prode: {
      pregs: [],
      resp: {},
      correct: {},
      closed: false,
    },
    desafios: {},
  }
}
