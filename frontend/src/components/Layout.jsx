import { Link, NavLink, Outlet } from 'react-router'

const MENU = [
  { naar: '/', label: 'Overzicht', icoon: '◧' },
  { naar: '/apparaten', label: 'Apparaten', icoon: '⚙' },
  { naar: '/taken', label: 'Taken', icoon: '✓' },
  { naar: '/inspecties', label: 'Inspecties', icoon: '◎' },
]

// Het "frame" om elke pagina heen.
// <Outlet /> is de plek waar React Router de huidige pagina invult.
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
            <NavLink key={item.naar} to={item.naar} end={item.naar === '/'}>
              <span className="icoon" aria-hidden>{item.icoon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Link to="/apparaten/nieuw" className="knop primair snel-toevoegen">
          + Apparaat
        </Link>
      </aside>

      <main className="inhoud">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
