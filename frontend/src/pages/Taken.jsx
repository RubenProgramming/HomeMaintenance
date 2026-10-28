import { useContext, useState } from 'react'
import { getAssets, getTasks } from '../api'
import { useApi } from '../hooks/useApi'
import { useAfvinken } from '../hooks/useAfvinken'
import { urgentie } from '../utils/datum'
import { AppContext } from '../ui/appContext'
import Kop from '../ui/Kop'
import TaakRij from '../ui/TaakRij'
import AfrondenSheet from '../ui/AfrondenSheet'
import Melding from '../ui/Melding'
import { LijstFout, LijstLaden } from '../ui/LijstStatus'
import '../ui/Lijst.css'

const GROEPEN = [
  { sleutel: 'telaat', titel: 'Te laat', stip: 'rood' },
  { sleutel: 'week', titel: 'Deze week', stip: 'amber' },
  { sleutel: 'maand', titel: 'Deze maand', stip: '' },
  { sleutel: 'later', titel: 'Later', stip: '' },
  { sleutel: 'onbekend', titel: 'Zonder datum', stip: '' },
]

// Alle onderhoudstaken, ook die van ver weg. Het Overzicht toont alleen wat binnen een maand moet.
// Nieuwe taken voeg je toe op de pagina van een apparaat.
function Taken() {
  const { versie } = useContext(AppContext)
  const { data, laden, fout, herlaad } = useApi(
    () => Promise.all([getAssets(), getTasks()]).then(([apparaten, taken]) => ({ apparaten, taken })),
    versie,
  )
  const { afvinken, ...melding } = useAfvinken(herlaad)
  const [details, setDetails] = useState(null)

  const kop = (
    <Kop titel="Taken" onder={data && `${data.taken.length} onderhoudstaken`}>
      <button type="button" className="btn alleen-breed" disabled>
        Jaarplanning <span className="binnenkort">Binnenkort</span>
      </button>
      <button type="button" className="btn alleen-breed" disabled>
        Herinneringen <span className="binnenkort">Binnenkort</span>
      </button>
    </Kop>
  )

  if (laden && !data) return <>{kop}<LijstLaden rijen={6} /></>
  if (fout) return <>{kop}<LijstFout melding={fout} opnieuw={herlaad} /></>

  const { apparaten, taken } = data
  const apparaatPerId = Object.fromEntries(apparaten.map((a) => [a._id, a]))
  const gesorteerd = [...taken].sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))
  let volgnummer = 0

  return (
    <>
      {kop}
      {taken.length === 0 ? (
        <div className="lijst lijst-leeg">
          <strong>Nog geen onderhoudstaken</strong>
          Open een apparaat en voeg daar een taak toe.
        </div>
      ) : (
        <div className="lijst">
          {GROEPEN.map((g) => {
            const inGroep = gesorteerd.filter((t) => urgentie(t.nextDue) === g.sleutel)
            if (inGroep.length === 0) return null
            return (
              <section key={g.sleutel} className="groep" aria-label={g.titel}>
                <h2 className="groep__kop">
                  <span className={`stip ${g.stip ? `stip--${g.stip}` : ''}`} aria-hidden />
                  {g.titel}
                  <span className="groep__aantal cijfers">{inGroep.length}</span>
                </h2>
                {inGroep.map((taak) => (
                  <TaakRij
                    key={`${taak._id}-${taak.nextDue}`}
                    taak={taak}
                    apparaat={apparaatPerId[taak.assetId]}
                    index={volgnummer++}
                    onAfvinken={afvinken}
                    onDetails={setDetails}
                  />
                ))}
              </section>
            )
          })}
        </div>
      )}

      {details && <AfrondenSheet taak={details} onAfvinken={afvinken} onSluit={() => setDetails(null)} />}
      <Melding {...melding} />
    </>
  )
}

export default Taken
