import { Link, NavLink, Outlet } from 'react-router'

// "plus" is de grote knop in het midden van de mobiele balk; op desktop verborgen
// (daar staat de knop onder het menu).
const MENU = [
  { naar: '/', label: 'Overzicht', icoon: '◧' },
  { naar: '/apparaten', label: 'Apparaten', icoon: '⚙' },
  { naar: '/rondgang', label: 'Toevoegen', icoon: '+', plus: true },
  { naar: '/taken', label: 'Taken', icoon: '✓' },
]

// Het "frame" om elke pagina heen.
// <Outlet /> is de plek waar React Router de huidige pagina invult.
// Desktop: zijbalk links. Mobiel (zie index.css): dezelfde nav als balk onderin.
function Layout() {
  return (
    <div className="app">
      <aside className="zijbalk">
        <Link to="/" className="logo">
          Onderhoud<span>planner</span>
        </Link>
        <nav className="menu">
          {MENU.map((item) => (
            // NavLink krijgt automatisch class "active" als je op die pagina bent.
            // "end" zorgt dat "/" niet actief is op elke pagina.
            <NavLink
              key={item.naar}
              to={item.naar}
              end={item.naar === '/'}
              className={item.plus ? 'plus-tab' : undefined}
              aria-label={item.label}
            >
              <span className="icoon" aria-hidden>{item.icoon}</span>
              {!item.plus && item.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/rondgang" className="knop primair snel-toevoegen">
          + Apparaten toevoegen
        </Link>
      </aside>

      <main className="inhoud">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
