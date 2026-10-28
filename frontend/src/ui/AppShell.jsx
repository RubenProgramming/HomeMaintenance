import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  HomeIcon,
  PlusIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import { useThema } from '../hooks/useThema'
import { ThemaContext } from './themaContext'
import { AppContext } from './appContext'
import RondgangSheet from './RondgangSheet'
import './AppShell.css'

const MENU = [
  { naar: '/', label: 'Overzicht', icoon: HomeIcon },
  { naar: '/apparaten', label: 'Apparaten', icoon: WrenchScrewdriverIcon },
  { naar: '/taken', label: 'Taken', icoon: CheckCircleIcon },
]

function leesIngeklapt() {
  try {
    return localStorage.getItem('rail') !== 'breed'
  } catch {
    return true
  }
}

// Het frame om elke pagina:
// - desktop (≥ 768px): iconenbalk links, uit te klappen tot labels zichtbaar zijn
// - mobiel: tabbalk onderin met een "+" in het midden
// <Outlet /> is de plek waar React Router de huidige pagina invult.
function AppShell() {
  const themaState = useThema()
  const [smal, setSmal] = useState(leesIngeklapt)
  const [versie, setVersie] = useState(0)
  const [rondgang, setRondgang] = useState(false)
  const app = useMemo(
    () => ({ versie, ververs: () => setVersie((v) => v + 1), openRondgang: () => setRondgang(true) }),
    [versie],
  )

  useEffect(() => {
    try {
      localStorage.setItem('rail', smal ? 'smal' : 'breed')
    } catch {
      // geen opslag: dan onthouden we het niet
    }
  }, [smal])

  return (
    <ThemaContext.Provider value={themaState}>
      <AppContext.Provider value={app}>
      <div className={`shell ${smal ? 'shell--smal' : ''}`}>
        <nav className="rail" aria-label="Hoofdmenu">
          <Link to="/" className="rail__merk" aria-label="Onderhoudsplanner, naar overzicht">
            <span className="rail__logo" aria-hidden>O</span>
            <span className="rail__tekst">Onderhoud</span>
          </Link>

          <button type="button" className="rail__item rail__item--toevoegen" onClick={app.openRondgang} data-tip="Toevoegen">
            <PlusIcon aria-hidden />
            <span className="rail__tekst">Toevoegen</span>
          </button>

          <div className="rail__menu">
            {MENU.map(({ naar, label, icoon: Icoon }) => (
              // NavLink krijgt automatisch class "active" op de huidige pagina; "end": "/" niet overal actief
              <NavLink key={naar} to={naar} end={naar === '/'} className="rail__item" data-tip={label}>
                <Icoon aria-hidden />
                <span className="rail__tekst">{label}</span>
              </NavLink>
            ))}
          </div>

          <div className="rail__voet">
            <NavLink to="/instellingen" className="rail__item" data-tip="Instellingen">
              <Cog6ToothIcon aria-hidden />
              <span className="rail__tekst">Instellingen</span>
            </NavLink>
            <button
              type="button"
              className="rail__item"
              onClick={() => setSmal(!smal)}
              aria-label={smal ? 'Menu uitklappen' : 'Menu inklappen'}
              data-tip={smal ? 'Uitklappen' : undefined}
            >
              {smal ? <ChevronDoubleRightIcon aria-hidden /> : <ChevronDoubleLeftIcon aria-hidden />}
              <span className="rail__tekst">Inklappen</span>
            </button>
          </div>
        </nav>

        <main className="shell__inhoud">
          <Outlet />
        </main>

        <nav className="tabbalk" aria-label="Hoofdmenu">
          {[MENU[0], MENU[1], null, MENU[2]].map((item) =>
            item === null ? (
              <button key="plus" type="button" className="tabbalk__plus" onClick={app.openRondgang} aria-label="Toevoegen">
                <PlusIcon aria-hidden />
              </button>
            ) : (
              <NavLink key={item.naar} to={item.naar} end={item.naar === '/'} className="tabbalk__item">
                <item.icoon aria-hidden />
                <span>{item.label}</span>
              </NavLink>
            ),
          )}
        </nav>

        {rondgang && (
          <RondgangSheet
            onSluit={() => {
              setRondgang(false)
              app.ververs() // pagina erachter laat nieuwe apparaten zien
            }}
          />
        )}
      </div>
      </AppContext.Provider>
    </ThemaContext.Provider>
  )
}

export default AppShell
