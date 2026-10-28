import { useState } from 'react'
import { Link } from 'react-router'
import { getAssets, getTasks } from '../api'
import { useApi } from '../hooks/useApi'
import { urgentie } from '../utils/datum'
import TaskCard from '../components/TaskCard'
import TaakAfrondenDialoog from '../components/TaakAfrondenDialoog'
import Toast from '../components/Toast'
import { useAfvinken } from '../hooks/useAfvinken'
import { Fout, Laden, Leeg } from '../components/Status'

function Dashboard() {
  // Twee verzoeken tegelijk: Promise.all wacht tot ze allebei klaar zijn
  const { data, laden, fout, herlaad } = useApi(() =>
    Promise.all([getAssets(), getTasks()]).then(([apparaten, taken]) => ({ apparaten, taken })),
  )
  const [afronden, setAfronden] = useState(null)
  const { afvinken, bezigMet, ...toast } = useAfvinken(herlaad)

  if (laden && !data) return <Laden />
  if (fout) return <Fout melding={fout} opnieuw={herlaad} />

  const { apparaten, taken } = data

  // Een "lookup": van assetId naar apparaat. Zo vinden we bij elke taak snel het apparaat.
  // Dit is wat $lookup in MongoDB ook doet (zie /tasks/upcoming), maar dan in de browser.
  const apparaatPerId = Object.fromEntries(apparaten.map((a) => [a._id, a]))

  const gesorteerd = [...taken].sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))
  const telaat = gesorteerd.filter((t) => urgentie(t.nextDue) === 'telaat')
  const dezeWeek = gesorteerd.filter((t) => urgentie(t.nextDue) === 'week')
  const dezeMaand = gesorteerd.filter((t) => urgentie(t.nextDue) === 'maand')
  const eerstvolgend = [...telaat, ...dezeWeek, ...dezeMaand].slice(0, 8)

  // Apparaten zonder taken: daar word je nooit aan herinnerd, dus die zijn "onvolledig"
  const metTaak = new Set(taken.map((t) => t.assetId))
  const onvolledig = apparaten.filter((a) => !metTaak.has(a._id))

  return (
    <>
      <header className="paginakop">
        <h1>Overzicht</h1>
        <Link to="/rondgang" className="knop primair alleen-desktop">+ Apparaten toevoegen</Link>
      </header>

      <section className="tegels">
        <Link to="/apparaten" className="tegel">
          <span className="getal">{apparaten.length}</span>
          <span>apparaten</span>
        </Link>
        <Link to="/taken" className="tegel telaat">
          <span className="getal">{telaat.length}</span>
          <span>te laat</span>
        </Link>
        <Link to="/taken" className="tegel week">
          <span className="getal">{dezeWeek.length}</span>
          <span>deze week</span>
        </Link>
        <Link to="/taken" className="tegel">
          <span className="getal">{dezeMaand.length}</span>
          <span>komende maand</span>
        </Link>
      </section>

      <section className="kaart">
        <div className="kaart-kop">
          <h2>Eerstvolgende taken</h2>
          <Link to="/taken" className="klein">Alle taken →</Link>
        </div>
        {eerstvolgend.length === 0 ? (
          <Leeg>Niets te doen de komende maand. 🎉</Leeg>
        ) : (
          <div className="takenlijst">
            {eerstvolgend.map((taak) => (
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
        )}
      </section>

      {onvolledig.length > 0 && (
        <section className="kaart">
          <div className="kaart-kop">
            <h2>
              Onvolledig <span className="gedempt">({onvolledig.length})</span>
            </h2>
          </div>
          <p className="klein gedempt">
            Deze apparaten hebben nog geen onderhoudstaak, dus je krijgt er nooit een seintje voor.
          </p>
          <ul className="onvolledig-lijst">
            {onvolledig.map((a) => (
              <li key={a._id}>
                <Link to={`/apparaten/${a._id}`}>
                  <span>{a.name}</span>
                  <span className="klein gedempt">{a.location}</span>
                  <span className="klein actie">+ taak</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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

export default Dashboard
