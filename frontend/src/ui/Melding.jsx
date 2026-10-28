import { XMarkIcon } from '@heroicons/react/20/solid'
import { MELDING_DUUR } from '../hooks/useMelding'
import './Melding.css'

// Korte melding onderin ("Afgerond: Ontkalken — Ongedaan maken").
// Werkt samen met useMelding (of useAfvinken / useTaakActies): geef melding, ongedaan en sluit door.
// "Ongedaan maken" verschijnt alleen als de melding iets terug te draaien heeft
// (melding.ongedaan, zie useMelding) en de pagina de ongedaan-functie doorgeeft.
// Het streepje onderin loopt leeg in de tijd dat je nog kunt terugdraaien.
function Melding({ melding, ongedaan, sluit }) {
  if (!melding) return null
  return (
    <div key={melding.id} className={`melding ${melding.fout ? 'melding--fout' : ''}`} role="status">
      <span className="melding__tekst">{melding.tekst}</span>
      {melding.ongedaan && ongedaan && (
        <button type="button" className="melding__actie" onClick={ongedaan}>
          Ongedaan maken
        </button>
      )}
      <button type="button" className="melding__sluit" onClick={sluit} aria-label="Sluiten">
        <XMarkIcon aria-hidden />
      </button>
      <span className="melding__tijd" style={{ animationDuration: `${MELDING_DUUR}ms` }} aria-hidden />
    </div>
  )
}

export default Melding
