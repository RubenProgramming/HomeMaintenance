import { CATEGORIE_ICONEN } from './categorieIconen'
import './ApparaatTegel.css'

// Klein vierkant vooraan een apparaat: het icoon van zijn categorie,
// anders de eerste letter van de categorie (of van de naam).
// Zo zie je meteen het verschil tussen een apparaat (tegel) en een taak (rondje).
// - icoon: sleutel uit CATEGORIE_ICONEN (of leeg)
// - groot: voor in de paginakop van een apparaat
function ApparaatTegel({ icoon, categorie, naam, groot = false }) {
  const Icoon = CATEGORIE_ICONEN[icoon]?.icoon
  const letter = (categorie || naam || '?').trim()[0]?.toUpperCase()
  return (
    <span className={`tegel ${groot ? 'tegel--groot' : ''}`} aria-hidden>
      {Icoon ? <Icoon /> : letter}
    </span>
  )
}

export default ApparaatTegel
