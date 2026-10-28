import ThemaKnop from './ThemaKnop'
import './Kop.css'

// Paginakop: titel, optioneel een regel eronder en knoppen rechts.
// Op mobiel staat hier ook de themaknop (de zijbalk is daar weg).
function Kop({ titel, onder, children }) {
  return (
    <header className="kop">
      <div className="kop__tekst">
        <h1 className="kop__titel">{titel}</h1>
        {onder && <div className="kop__onder">{onder}</div>}
      </div>
      <div className="kop__acties">
        {children}
        <ThemaKnop className="btn btn--stil btn--icoon kop__thema" />
      </div>
    </header>
  )
}

export default Kop
