import { useState } from 'react'
import { getAssets, getTasks } from '../api'
import { useApi } from '../hooks/useApi'
import { urgentie } from '../utils/datum'
import TaskCard from '../components/TaskCard'
import TaakAfrondenDialoog from '../components/TaakAfrondenDialoog'
import NogNietKlaar from '../components/NogNietKlaar'
import Toast from '../components/Toast'
import { useAfvinken } from '../hooks/useAfvinken'
import { Fout, Laden, Leeg } from '../components/Status'

const GROEPEN = [
  { sleutel: 'telaat', titel: 'Te laat' },
  { sleutel: 'week', titel: 'Deze week' },
  { sleutel: 'maand', titel: 'Komende maand' },
  { sleutel: 'later', titel: 'Later' },
  { sleutel: 'onbekend', titel: 'Zonder datum' },
]

function Taken() {
  const { data, laden, fout, herlaad } = useApi(() =>
    Promise.all([getAssets(), getTasks()]).then(([apparaten, taken]) => ({ apparaten, taken })),
  )
  const [afronden, setAfronden] = useState(null)
  const { afvinken, bezigMet, ...toast } = useAfvinken(herlaad)

  if (laden && !data) return <Laden />
  if (fout) return <Fout melding={fout} opnieuw={herlaad} />

  const { apparaten, taken } = data
  const apparaatPerId = Object.fromEntries(apparaten.map((a) => [a._id, a]))
  const gesorteerd = [...taken].sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))

  return (
    <>
      <header className="paginakop">
        <h1>Taken</h1>
        <div className="knoppenrij alleen-desktop">
          <NogNietKlaar uitleg="jaarplanning (MJOP) met kosten per jaar">Jaarplanning</NogNietKlaar>
          <NogNietKlaar uitleg="automatische herinneringen per e-mail/push">Herinneringen</NogNietKlaar>
        </div>
      </header>
      <p className="gedempt klein">Nieuwe taken voeg je toe op de pagina van een apparaat.</p>

      {taken.length === 0 && <Leeg>Nog geen taken.</Leeg>}

      {GROEPEN.map(({ sleutel, titel }) => {
        const inGroep = gesorteerd.filter((t) => urgentie(t.nextDue) === sleutel)
        if (inGroep.length === 0) return null
        return (
          <section key={sleutel} className="kaart">
            <h2>
              {titel} <span className="gedempt">({inGroep.length})</span>
            </h2>
            <div className="takenlijst">
              {inGroep.map((taak) => (
                <TaskCard
                  key={taak._id}
                  taak={taak}
                  apparaat={apparaatPerId[taak.assetId]}
                  onAfvinken={afvinken}
                  onDetails={setAfronden}
                  bezig={bezigMet === taak._id}
                />
              ))}
            </div>
          </section>
        )
      })}

      {afronden && (
        <TaakAfrondenDialoog
          taak={afronden}
          onSluit={() => setAfronden(null)}
          onKlaar={() => {
            setAfronden(null)
            herlaad()
          }}
        />
      )}
      <Toast {...toast} />
    </>
  )
}

export default Taken
