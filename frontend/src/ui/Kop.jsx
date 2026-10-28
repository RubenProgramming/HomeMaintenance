import { Link, useLocation } from 'react-router'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import './Kop.css'

// Paginakop: titel, optioneel een regel eronder en knoppen rechts.
// Op mobiel staat hier ook het tandwiel naar Instellingen (de zijbalk is daar weg).
function Kop({ titel, onder, children }) {
  const { pathname } = useLocation()
  return (
    <header className="kop">
      <div className="kop__tekst">
        <h1 className="kop__titel">{titel}</h1>
        {onder && <div className="kop__onder">{onder}</div>}
      </div>
      <div className="kop__acties">
        {children}
        {pathname !== '/instellingen' && (
          <Link to="/instellingen" className="btn btn--stil btn--icoon kop__instellingen" aria-label="Instellingen">
            <Cog6ToothIcon aria-hidden />
          </Link>
        )}
      </div>
    </header>
  )
}

export default Kop
