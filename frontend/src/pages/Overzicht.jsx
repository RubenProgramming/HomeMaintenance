import { useContext, useState } from 'react'
import { Link } from 'react-router'
import { CheckCircleIcon } from '@heroicons/react/20/solid'
import { ChevronRightIcon } from '@heroicons/react/16/solid'
import { getAssets, getTasks } from '../api'
import { useApi } from '../hooks/useApi'
import { useAfvinken } from '../hooks/useAfvinken'
import { datumLabel, urgentie } from '../utils/datum'
import Kop from '../ui/Kop'
import TaakRij from '../ui/TaakRij'
import AfrondenSheet from '../ui/AfrondenSheet'
import Melding from '../ui/Melding'
import { LijstFout, LijstLaden } from '../ui/LijstStatus'
import { AppContext } from '../ui/appContext'
import '../ui/Lijst.css'
import './Overzicht.css'

const GROEPEN = [
  { sleutel: 'telaat', titel: 'Te laat', stip: 'rood' },
  { sleutel: 'week', titel: 'Deze week', stip: 'amber' },
  { sleutel: 'maand', titel: 'Deze maand', stip: '' },
]

const VANDAAG = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

// Het eerste scherm. Je opent de app alleen als er iets moet, dus:
// bovenaan meteen wat er nu moet, gegroepeerd op urgentie. Geen tegels of grafieken.
function Overzicht() {
  const { versie } = useContext(AppContext)
  const { data, laden, fout, herlaad } = useApi(
    () => Promise.all([getAssets(), getTasks()]).then(([apparaten, taken]) => ({ apparaten, taken })),
    versie, // na toevoegen via de "+" opnieuw laden
  )
  const { afvinken, ...melding } = useAfvinken(herlaad)
  const [details, setDetails] = useState(null) // taak waarvan het afrond-paneel open is

  const vandaag = VANDAAG.format(new Date())

  const kop = <Kop titel="Overzicht" onder={<span className="eerste-hoofdletter">{vandaag}</span>} />
  if (laden && !data) return <>{kop}<LijstLaden /></>
  if (fout) return <>{kop}<LijstFout melding={fout} opnieuw={herlaad} /></>

  const { apparaten, taken } = data
  const apparaatPerId = Object.fromEntries(apparaten.map((a) => [a._id, a]))
  const gesorteerd = [...taken].sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))
  const perGroep = Object.fromEntries(
    GROEPEN.map((g) => [g.sleutel, gesorteerd.filter((t) => urgentie(t.nextDue) === g.sleutel)]),
  )
  const binnenMaand = GROEPEN.reduce((som, g) => som + perGroep[g.sleutel].length, 0)
  const later = gesorteerd.filter((t) => urgentie(t.nextDue) === 'later').slice(0, 3)

  // Apparaten zonder taken: daar krijg je nooit een seintje voor
  const metTaak = new Set(taken.map((t) => t.assetId))
  const onvolledig = apparaten.filter((a) => !metTaak.has(a._id))

  // Doorlopende teller voor de gestaffelde inloop-animatie over alle groepen heen
  let volgnummer = 0
  const rij = (taak) => (
    <TaakRij
      // nextDue in de key: na afvinken is het een "nieuwe" rij (anders blijft hij dichtgeklapt)
      key={`${taak._id}-${taak.nextDue}`}
      taak={taak}
      apparaat={apparaatPerId[taak.assetId]}
      onAfvinken={afvinken}
      onDetails={setDetails}
      index={volgnummer++}
    />
  )

  return (
    <>
      {kop}

      <Samenvatting perGroep={perGroep} volgende={later[0]} />

      {binnenMaand > 0 ? (
        <div className="lijst">
          {GROEPEN.filter((g) => perGroep[g.sleutel].length > 0).map((g) => (
            <section key={g.sleutel} className="groep" aria-label={g.titel}>
              <h2 className="groep__kop">
                <span className={`stip ${g.stip ? `stip--${g.stip}` : ''}`} aria-hidden />
                {g.titel}
                <span className="groep__aantal cijfers">{perGroep[g.sleutel].length}</span>
              </h2>
              {perGroep[g.sleutel].map(rij)}
            </section>
          ))}
        </div>
      ) : (
        later.length > 0 && (
          <div className="lijst">
            <section className="groep" aria-label="Eerstvolgend">
              <h2 className="groep__kop">
                <span className="stip" aria-hidden />
                Eerstvolgend
              </h2>
              {later.map(rij)}
            </section>
          </div>
        )
      )}

      {taken.length === 0 && (
        <div className="lijst lijst-leeg">
          <strong>Nog geen onderhoudstaken</strong>
          Voeg een apparaat toe en geef het een taak, dan verschijnt die hier.
        </div>
      )}

      {onvolledig.length > 0 && (
        <div className="lijst">
          <section className="groep" aria-label="Onvolledig">
            <h2 className="groep__kop">
              <span className="stip stip--amber" aria-hidden />
              Onvolledig
              <span className="groep__aantal cijfers">{onvolledig.length}</span>
              <span className="groep__rechts">geen onderhoudstaak, dus nooit een seintje</span>
            </h2>
            {onvolledig.map((a, i) => (
              <div key={a._id} className="rij-wrap" style={{ '--i': Math.min(volgnummer + i, 12) }}>
                <div className="rij-clip">
                  <div className="rij">
                    <div className="rij__hoofd">
                      <Link to={`/apparaten/${a._id}`} className="rij__titel rij__link">{a.name}</Link>
                      <span className="rij__meta">{a.location}</span>
                    </div>
                    <span className="rij__actie">
                      Taak toevoegen <ChevronRightIcon aria-hidden />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {details && <AfrondenSheet taak={details} onAfvinken={afvinken} onSluit={() => setDetails(null)} />}
      <Melding {...melding} />
    </>
  )
}

// Eén regel die in een oogopslag zegt hoe je ervoor staat
function Samenvatting({ perGroep, volgende }) {
  const delen = GROEPEN.filter((g) => perGroep[g.sleutel].length > 0)

  if (delen.length === 0) {
    return (
      <p className="samenvatting samenvatting--bij">
        <CheckCircleIcon aria-hidden />
        <span>
          Alles bij.
          {volgende && (
            <span className="gedempt-tekst">
              {' '}Volgende: {volgende.title}, {datumLabel(volgende.nextDue).toLowerCase()}.
            </span>
          )}
        </span>
      </p>
    )
  }

  return (
    <p className="samenvatting cijfers">
      {delen.map((g) => (
        <span key={g.sleutel} className="samenvatting__deel">
          <span className={`stip ${g.stip ? `stip--${g.stip}` : ''}`} aria-hidden />
          <strong>{perGroep[g.sleutel].length}</strong> {g.titel.toLowerCase()}
        </span>
      ))}
    </p>
  )
}

export default Overzicht
