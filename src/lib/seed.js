// Datos de demo cuando no hay Supabase configurado
export const EMOJIS = [
  '🌊','🎸','🌺','🦋','⚡','🌸','🎯','🦁','🌙','🍦',
  '🏔','🌵','🦄','🌮','🚀','🎨','🦊','🎭','🍕','🐬',
  '🎲','🎪','🐶','🏄','🦅','🌈','🍀','🏆','🎵','🌻',
  '🐱','🎃','🍉','🌴','🦀','🐙','🍓','🌞','🦩','🐳',
  '🎹','🌿','🍄','🦝','🐠','🧸','🏖','🦎','🐝','🦈',
]

export const CHECKLIST_INICIAL = ['Hielo', 'Parlante', 'Botiquín', 'Pelota', 'Juegos de mesa', 'Bajante']

export const VIAJEROS = [
  ['Alejo', '🌊'], ['Bruno', '🎸'], ['Iara', '🌺'], ['Ori', '🦋'],
  ['Martin', '⚡'], ['Val', '🌸'], ['Fede', '🎯'], ['Simón', '🦁'],
  ['Mila', '🌙'], ['Meli', '🍦'], ['Lucho', '🏔'], ['Juli', '🌵'],
  ['Yae', '🦄'], ['Lari', '🌮'], ['Alex', '🚀'], ['Mic', '🎨'],
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
      c1: { id:'c1', item:'Hielo', portadores:[] },
      c2: { id:'c2', item:'Parlante', portadores:[] },
      c3: { id:'c3', item:'Botiquín', portadores:[] },
      c4: { id:'c4', item:'Pelota', portadores:[] },
      c5: { id:'c5', item:'Juegos de mesa', portadores:[] },
      c6: { id:'c6', item:'Bajante', portadores:[] },
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
