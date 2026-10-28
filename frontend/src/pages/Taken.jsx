import { useContext } from 'react'
import { getAssets, getTasks } from '../api'
import { useApi } from '../hooks/useApi'
import { useTaakActies } from '../hooks/useTaakActies'
import { urgentie } from '../utils/datum'
import { AppContext } from '../ui/appContext'
import Kop from '../ui/Kop'
import GroepKop from '../ui/GroepKop'
import StatusChips from '../ui/StatusChips'
import { STATUS } from '../ui/status'
import TaakRij from '../ui/TaakRij'
import TaakPanelen from '../ui/TaakPanelen'
import { LijstFout, LijstLaden } from '../ui/LijstStatus'
import '../ui/Lijst.css'

const GROEPEN = Object.entries(STATUS).map(([sleutel, s]) => ({ sleutel, ...s }))

// Alle onderhoudstaken, ook die van ver weg. Het Overzicht toont alleen wat binnen een maand moet.
// Nieuwe taken voeg je toe op de pagina van een apparaat.
function Taken() {
  const { versie } = useContext(AppContext)
  const { data, laden, fout, herlaad } = useApi(
    () => Promise.all([getAssets(), getTasks()]).then(([apparaten, taken]) => ({ apparaten, taken })),
    versie,
  )
  const { acties, panelen } = useTaakActies(herlaad)

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
  const perGroep = GROEPEN.map((g) => ({ ...g, taken: gesorteerd.filter((t) => urgentie(t.nextDue) === g.sleutel) }))
  // Chips alleen voor wat aandacht vraagt; "later" en "zonder datum" zie je in de lijst
  const chips = perGroep
    .filter((g) => g.toon && g.taken.length > 0)
    .map((g) => ({ ...g, aantal: g.taken.length }))

  return (
    <>
      {kop}
      {chips.length > 0 && <StatusChips items={chips} />}
      {taken.length === 0 ? (
        <div className="lijst lijst-leeg">
          <strong>Nog geen onderhoudstaken</strong>
          Open een apparaat en voeg daar een taak toe.
        </div>
      ) : (
        <div className="lijst">
          {perGroep.map((g) => {
            if (g.taken.length === 0) return null
            return (
              <section key={g.sleutel} className="groep" aria-label={g.titel}>
                <GroepKop id={`groep-${g.sleutel}`} icoon={g.icoon} titel={g.titel} toon={g.toon} aantal={g.taken.length} />
                {g.taken.map((taak) => (
                  <TaakRij
                    key={`${taak._id}-${taak.nextDue}`}
                    taak={taak}
                    apparaat={apparaatPerId[taak.assetId]}
                    index={volgnummer++}
                    acties={acties}
                  />
                ))}
              </section>
            )
          })}
        </div>
      )}

      <TaakPanelen {...panelen} />
    </>
  )
}

export default Taken
