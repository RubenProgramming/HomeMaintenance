import { useContext } from 'react'
import { Link } from 'react-router'
import { CheckCircleIcon, PuzzlePieceIcon } from '@heroicons/react/20/solid'
import { ChevronRightIcon } from '@heroicons/react/16/solid'
import { getAssets, getLabels, getTasks } from '../api'
import { useApi } from '../hooks/useApi'
import { useTaakActies } from '../hooks/useTaakActies'
import { datumLabel, urgentie } from '../utils/datum'
import Kop from '../ui/Kop'
import ApparaatTegel from '../ui/ApparaatTegel'
import { iconenPerCategorie } from '../ui/categorieIconen'
import GroepKop from '../ui/GroepKop'
import StatusChips from '../ui/StatusChips'
import { STATUS } from '../ui/status'
import TaakRij from '../ui/TaakRij'
import TaakPanelen from '../ui/TaakPanelen'
import { LijstFout, LijstLaden } from '../ui/LijstStatus'
import { AppContext } from '../ui/appContext'
import '../ui/Lijst.css'
import './Overzicht.css'

// Het Overzicht toont alleen wat binnen een maand moet; de rest staat op Taken
const GROEPEN = ['telaat', 'week', 'maand'].map((sleutel) => ({ sleutel, ...STATUS[sleutel] }))

const VANDAAG = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })

// Het eerste scherm. Je opent de app alleen als er iets moet, dus:
// bovenaan meteen wat er nu moet, gegroepeerd op urgentie. Geen tegels of grafieken.
function Overzicht() {
  const { versie } = useContext(AppContext)
  const { data, laden, fout, herlaad } = useApi(
    () =>
      Promise.all([getAssets(), getTasks(), getLabels('categories')]).then(([apparaten, taken, categorieen]) => ({
        apparaten,
        taken,
        categorieen,
      })),
    versie, // na toevoegen via de "+" opnieuw laden
  )
  const { acties, panelen } = useTaakActies(herlaad) // afvinken, uitstellen, bewerken, … (⋯-menu)

  const vandaag = VANDAAG.format(new Date())

  const kop = <Kop titel="Overzicht" onder={<span className="eerste-hoofdletter">{vandaag}</span>} />
  if (laden && !data) return <>{kop}<LijstLaden /></>
  if (fout) return <>{kop}<LijstFout melding={fout} opnieuw={herlaad} /></>

  const { apparaten, taken, categorieen } = data
  const icoonVan = iconenPerCategorie(categorieen)
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
      acties={acties}
      index={volgnummer++}
    />
  )

  return (
    <>
      {kop}

      <Samenvatting perGroep={perGroep} volgende={later[0]} onvolledig={onvolledig.length} />

      {binnenMaand > 0 ? (
        <div className="lijst">
          {GROEPEN.filter((g) => perGroep[g.sleutel].length > 0).map((g) => (
            <section key={g.sleutel} className="groep" aria-label={g.titel}>
              <GroepKop id={`groep-${g.sleutel}`} icoon={g.icoon} titel={g.titel} toon={g.toon} aantal={perGroep[g.sleutel].length} />
              {perGroep[g.sleutel].map(rij)}
            </section>
          ))}
        </div>
      ) : (
        later.length > 0 && (
          <div className="lijst">
            <section className="groep" aria-label="Eerstvolgend">
              <GroepKop icoon={STATUS.later.icoon} titel="Eerstvolgend" />
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
            <GroepKop
              id="groep-onvolledig"
              icoon={PuzzlePieceIcon}
              titel="Onvolledig"
              toon="info"
              aantal={onvolledig.length}
              rechts="geen onderhoudstaak, dus nooit een seintje"
            />
            {onvolledig.map((a, i) => (
              <div key={a._id} className="rij-wrap" style={{ '--i': Math.min(volgnummer + i, 12) }}>
                <div className="rij-clip">
                  <div className="rij">
                    <ApparaatTegel icoon={icoonVan[a.category?.toLowerCase()]} categorie={a.category} naam={a.name} />
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

      <TaakPanelen {...panelen} />
    </>
  )
}

// In een oogopslag hoe je ervoor staat: chips per status, of "Alles bij"
function Samenvatting({ perGroep, volgende, onvolledig }) {
  const delen = GROEPEN.filter((g) => perGroep[g.sleutel].length > 0)
  const chips = delen.map((g) => ({ ...g, aantal: perGroep[g.sleutel].length }))
  if (onvolledig > 0) {
    chips.push({ sleutel: 'onvolledig', titel: 'Onvolledig', toon: 'info', icoon: PuzzlePieceIcon, aantal: onvolledig })
  }

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

  return <StatusChips items={chips} />
}

export default Overzicht
