import { Link } from 'react-router'
import { formatDatum, interval, relatief, urgentie } from '../utils/datum'

// Eén taak als kaartje.
// - taak: het taak-document uit MongoDB (title, every, unit, nextDue, ...)
// - apparaat: optioneel; als je het meegeeft, tonen we naam + locatie met een link
// - onAfvinken: één tik = klaar (zie useAfvinken)
// - onDetails: afronden mét datum/kosten/notitie (opent TaakAfrondenDialoog)
// - bezig: true terwijl het afvinken wordt opgeslagen
// - children: extra knoppen, alles wat je tussen <TaskCard>...</TaskCard> zet
function TaskCard({ taak, apparaat, onAfvinken, onDetails, bezig = false, children }) {
  const niveau = urgentie(taak.nextDue)

  return (
    <div className={`taakkaart ${niveau}`}>
      <div className="taakkaart-tekst">
        <h3>{taak.title}</h3>
        {apparaat && (
          <p className="klein">
            <Link to={`/apparaten/${apparaat._id}`}>{apparaat.name}</Link> · {apparaat.location}
          </p>
        )}
        <p className="klein gedempt">
          {taak.every && interval(taak.every, taak.unit)} · volgende {formatDatum(taak.nextDue)}
        </p>
      </div>
      <div className="taakkaart-acties">
        <span className={`badge ${niveau}`}>{relatief(taak.nextDue)}</span>
        {children}
        {onDetails && (
          <button className="knop klein" onClick={() => onDetails(taak)} title="Afronden met datum, kosten of notitie">
            Details…
          </button>
        )}
        {onAfvinken && (
          <button
            className="knop afvinken"
            onClick={() => onAfvinken(taak)}
            disabled={bezig}
            aria-label={`${taak.title} afronden`}
          >
            ✓ Klaar
          </button>
        )}
      </div>
    </div>
  )
}

export default TaskCard
