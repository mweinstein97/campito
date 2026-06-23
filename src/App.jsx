import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Login from './screens/Login'
import Inicio from './screens/Inicio'
import Agenda from './screens/Agenda'
import Preparativos from './screens/Preparativos'
import Gastos from './screens/Gastos'
import Juegos from './screens/Juegos'
import Admin from './screens/Admin'
import Nav from './components/Nav'
import Header from './components/Header'
import Modal from './components/Modal'
import Toast from './components/Toast'

function Shell() {
  const { state, currentUser } = useApp()
  const [tab, setTab] = useState('inicio')
  const [badges, setBadges] = useState({})
  const [adminOpen, setAdminOpen] = useState(false)

  if (!state) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-text3 font-semibold text-sm animate-pulse">Cargando...</div>
      </div>
    )
  }

  if (!currentUser) {
    return <Login />
  }

  function addBadge(t) {
    setBadges(b => ({ ...b, [t]: true }))
  }

  function handleTabChange(t) {
    setTab(t)
    setBadges(b => ({ ...b, [t]: false }))
  }

  return (
    <>
      <Header tab={tab} onAdminClick={() => setAdminOpen(true)} />
      <div className="scroll-area flex-1">
        {tab === 'inicio'       && <Inicio />}
        {tab === 'agenda'       && <Agenda onBadge={() => addBadge('agenda')} />}
        {tab === 'preparativos' && <Preparativos />}
        {tab === 'gastos'       && <Gastos onBadge={() => addBadge('gastos')} />}
        {tab === 'juegos'       && <Juegos />}
      </div>
      <Nav current={tab} onChange={handleTabChange} badges={badges} />
      <Modal open={adminOpen} onClose={() => setAdminOpen(false)}>
        <Admin onClose={() => setAdminOpen(false)} />
      </Modal>
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <div className="h-full flex flex-col max-w-[430px] mx-auto relative bg-bg">
        <Shell />
        <Toast />
      </div>
    </AppProvider>
  )
}
