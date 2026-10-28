import { useContext, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
  ChevronLeftIcon,
  ClockIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  PuzzlePieceIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/20/solid'
import { archiveAsset, getAsset, getLabels, getLogs, getTasks, restoreAsset } from '../api'
import { useApi } from '../hooks/useApi'
import { useTaakActies } from '../hooks/useTaakActies'
import { formatDatum } from '../utils/datum'
import { AppContext } from '../ui/appContext'
import Kop from '../ui/Kop'
import ApparaatTegel from '../ui/ApparaatTegel'
import { iconenPerCategorie } from '../ui/categorieIconen'
import Popmenu from '../ui/Popmenu'
import TaakRij from '../ui/TaakRij'
import TaakPanelen from '../ui/TaakPanelen'
import ApparaatSheet from '../ui/ApparaatSheet'
import TaakSheet from '../ui/TaakSheet'
import { LijstFout, LijstLaden } from '../ui/LijstStatus'
import '../ui/Lijst.css'
import './ApparaatDetail.css'

// Eén apparaat. Wat je hier komt doen staat bovenaan: de taken.
// Desktop: taken en logboek links, gegevens rechts. Mobiel: alles onder elkaar.
function ApparaatDetail() {
  const { id } = useParams() // het :id uit de URL /apparaten/:id
  const { versie } = useContext(AppContext)

  // Drie collecties, drie verzoeken. De backend heeft (nog) geen /assets/{id}/tasks,
  // dus we halen alle taken op en filteren.
  const { data, laden, fout, herlaad } = useApi(
    () =>
      Promise.all([getAsset(id), getTasks(), getLogs(id), getLabels('categories')]).then(
        ([apparaat, taken, logs, categorieen]) => ({
          apparaat,
          taken: taken.filter((t) => t.assetId === id),
          logs,
          categorieen,
        }),
      ),
    `${id}-${versie}`,
  )
  const { acties, panelen } = useTaakActies(herlaad) // afvinken, uitstellen, bewerken, … (⋯-menu per taak)
  const [open, setOpen] = useState(null) // 'bewerken' (apparaat) | 'taak' (nieuwe taak)
  const [actieFout, setActieFout] = useState(null)

  const terug = (
    <Link to="/apparaten" className="terug">
      <ChevronLeftIcon aria-hidden />
      Apparaten
    </Link>
  )

  if (laden && !data) return <>{terug}<Kop titel=" " /><LijstLaden rijen={3} /></>
  if (fout) return <>{terug}<Kop titel="Apparaat" /><LijstFout melding={fout} opnieuw={herlaad} /></>

  const { apparaat, taken, logs, categorieen } = data
  const icoon = iconenPerCategorie(categorieen)[apparaat.category?.toLowerCase()]
  const gearchiveerd = apparaat.archivedAt !== null
  const takenPerId = Object.fromEntries(taken.map((t) => [t._id, t]))
  const gesorteerd = [...taken].sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))

  // Archiveren vraagt niet om bevestiging: de pagina blijft staan met een knop "Terugzetten"
  async function actie(functie) {
    setActieFout(null)
    try {
      await functie(id)
      herlaad()
    } catch (err) {
      setActieFout(err.message)
    }
  }

  return (
    <>
      {terug}
      <Kop
        voor={<ApparaatTegel groot icoon={icoon} categorie={apparaat.category} naam={apparaat.name} />}
        titel={apparaat.name}
        onder={[apparaat.location, apparaat.category].filter(Boolean).join(' · ')}
      >
        {!gearchiveerd && (
          <>
            <button type="button" className="btn" onClick={() => setOpen('bewerken')}>
              <PencilSquareIcon aria-hidden />
              <span className="alleen-breed">Bewerken</span>
            </button>
            <Popmenu
              label="Meer acties voor dit apparaat"
              items={[{ label: 'Archiveren', icoon: ArchiveBoxIcon, onKies: () => actie(archiveAsset) }]}
            />
          </>
        )}
      </Kop>

      {gearchiveerd && (
        <div className="banner">
          <span>Gearchiveerd op {formatDatum(apparaat.archivedAt)}. De taken staan stil.</span>
          <button type="button" className="btn" onClick={() => actie(restoreAsset)}>
            <ArrowUturnLeftIcon aria-hidden />
            Terugzetten
          </button>
        </div>
      )}
      {actieFout && <p className="formfout apparaat__fout">{actieFout}</p>}

      <div className="apparaat">
        <div className="apparaat__hoofd">
          <section className="sectie" aria-labelledby="kop-taken">
            <div className="sectie__kop">
              <h2 id="kop-taken"><WrenchScrewdriverIcon aria-hidden />Onderhoud</h2>
              {!gearchiveerd && (
                <button type="button" className="btn btn--stil" onClick={() => setOpen('taak')}>
                  <PlusIcon aria-hidden />
                  Taak
                </button>
              )}
            </div>
            {taken.length === 0 ? (
              <div className="lijst lijst-leeg">
                {gearchiveerd ? (
                  'Geen taken.'
                ) : (
                  <>
                    <strong>
                      <span className="tag tag--info">
                        <PuzzlePieceIcon aria-hidden />
                        Onvolledig
                      </span>{' '}
                      Nog geen onderhoudstaak
                    </strong>
                    Zonder taak krijg je voor dit apparaat nooit een seintje.
                    <div>
                      <button type="button" className="btn btn--primair lijst-leeg__knop" onClick={() => setOpen('taak')}>
                        <PlusIcon aria-hidden />
                        Taak toevoegen
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="lijst">
                {gesorteerd.map((taak, i) => (
                  <TaakRij
                    key={`${taak._id}-${taak.nextDue}`}
                    taak={taak}
                    index={i}
                    opApparaat
                    uit={gearchiveerd}
                    acties={acties}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="sectie" aria-labelledby="kop-logboek">
            <div className="sectie__kop">
              <h2 id="kop-logboek"><ClockIcon aria-hidden />Logboek</h2>
            </div>
            {logs.length === 0 ? (
              <p className="sectie__leeg">Nog niets uitgevoerd.</p>
            ) : (
              <ol className="logboek">
                {logs.map((log) => {
                  const extra = [log.performedBy, log.cost !== null && log.cost !== undefined && `€ ${log.cost}`].filter(Boolean)
                  return (
                    <li key={log._id} className="logboek__regel">
                      <span className="logboek__datum cijfers">{formatDatum(log.doneAt)}</span>
                      <div className="logboek__tekst">
                        <span className="logboek__titel">{takenPerId[log.taskId]?.title ?? 'Onderhoud'}</span>
                        {extra.length > 0 && <span className="logboek__extra cijfers">{extra.join(' · ')}</span>}
                        {log.notes && <p className="logboek__notitie">{log.notes}</p>}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </div>

        <aside className="apparaat__zij">
          <section className="sectie" aria-labelledby="kop-gegevens">
            <div className="sectie__kop">
              <h2 id="kop-gegevens"><InformationCircleIcon aria-hidden />Gegevens</h2>
            </div>
            <dl className="gegevens">
              <Gegeven label="Merk" waarde={apparaat.brand} />
              <Gegeven label="Model" waarde={apparaat.model} />
              <Gegeven label="Geplaatst" waarde={apparaat.installedAt && formatDatum(apparaat.installedAt)} />
              {Object.entries(apparaat.specs ?? {}).map(([sleutel, waarde]) => (
                <Gegeven key={sleutel} label={sleutel} waarde={String(waarde)} />
              ))}
            </dl>
          </section>

          <section className="sectie" aria-labelledby="kop-bestanden">
            <div className="sectie__kop">
              <h2 id="kop-bestanden"><PhotoIcon aria-hidden />Bestanden</h2>
              <span className="binnenkort">Binnenkort</span>
            </div>
            <p className="sectie__leeg">Typeplaatje, handleiding en garantiebewijs bij elkaar.</p>
          </section>
        </aside>
      </div>

      {open === 'bewerken' && (
        <ApparaatSheet apparaat={apparaat} onOpgeslagen={herlaad} onSluit={() => setOpen(null)} />
      )}
      {open === 'taak' && <TaakSheet apparaat={apparaat} onOpgeslagen={herlaad} onSluit={() => setOpen(null)} />}
      <TaakPanelen {...panelen} />
    </>
  )
}

function Gegeven({ label, waarde }) {
  return (
    <div className="gegevens__rij">
      <dt>{label}</dt>
      <dd className={waarde ? '' : 'zwak-tekst'}>{waarde || '—'}</dd>
    </div>
  )
}

export default ApparaatDetail
