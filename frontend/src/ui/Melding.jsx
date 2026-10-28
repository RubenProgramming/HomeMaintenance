import { XMarkIcon } from '@heroicons/react/20/solid'
import { TOAST_DUUR } from '../hooks/useAfvinken'
import './Melding.css'

// Korte melding onderin ("Afgerond: Ontkalken — Ongedaan maken").
// Werkt samen met useAfvinken: geef melding, ongedaan en sluit door.
// Het streepje onderin loopt leeg in de tijd dat je nog kunt terugdraaien.
function Melding({ melding, ongedaan, sluit }) {
  if (!melding) return null
  return (
    <div key={melding.id} className={`melding ${melding.fout ? 'melding--fout' : ''}`} role="status">
      <span className="melding__tekst">{melding.tekst}</span>
      {melding.logId && (
        <button type="button" className="melding__actie" onClick={ongedaan}>
          Ongedaan maken
        </button>
      )}
      <button type="button" className="melding__sluit" onClick={sluit} aria-label="Sluiten">
        <XMarkIcon aria-hidden />
      </button>
      <span className="melding__tijd" style={{ animationDuration: `${TOAST_DUUR}ms` }} aria-hidden />
    </div>
  )
}

export default Melding
