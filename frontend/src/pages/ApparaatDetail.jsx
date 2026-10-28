import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { archiveAsset, createTask, getAsset, getLogs, getTasks, restoreAsset, updateAsset } from '../api'
import { useApi } from '../hooks/useApi'
import { formatDatum, naarInputDatum, vandaagInput, vanInputDatum } from '../utils/datum'
import { rijenNaarSpecs, specsNaarRijen } from '../utils/specs'
import SpecsEditor from '../components/SpecsEditor'
import TaskCard from '../components/TaskCard'
import TaakAfrondenDialoog from '../components/TaakAfrondenDialoog'
import NogNietKlaar from '../components/NogNietKlaar'
import Toast from '../components/Toast'
import { useAfvinken } from '../hooks/useAfvinken'
import { Fout, Laden, Leeg } from '../components/Status'

function ApparaatDetail() {
  // Het :id uit de URL /apparaten/:id
  const { id } = useParams()
  const navigate = useNavigate()

  // Drie collecties, drie verzoeken: het apparaat, de taken, het logboek.
  // De backend heeft (nog) geen /assets/{id}/tasks, dus we halen alle taken op en filteren.
  const { data, laden, fout, herlaad } = useApi(
    () =>
      Promise.all([getAsset(id), getTasks(), getLogs(id)]).then(([apparaat, taken, logs]) => ({
        apparaat,
        taken: taken.filter((t) => t.assetId === id),
        logs,
      })),
    id,
  )

  const [bewerken, setBewerken] = useState(false)
  const [afronden, setAfronden] = useState(null)
  const [actieFout, setActieFout] = useState(null)
  const { afvinken, bezigMet, ...toast } = useAfvinken(herlaad)

  if (laden && !data) return <Laden />
  if (fout) return <Fout melding={fout} opnieuw={herlaad} />

  const { apparaat, taken, logs } = data
  const gearchiveerd = apparaat.archivedAt !== null
  const takenPerId = Object.fromEntries(taken.map((t) => [t._id, t]))

  async function archiveer() {
    if (!window.confirm(`"${apparaat.name}" archiveren? De taken worden ook gearchiveerd.`)) return
    try {
      await archiveAsset(id)
      navigate('/apparaten')
    } catch (err) {
      setActieFout(err.message)
    }
  }

  async function zetTerug() {
    try {
      await restoreAsset(id)
      herlaad()
    } catch (err) {
      setActieFout(err.message)
    }
  }

  return (
    <>
      <header className="paginakop">
        <div>
          <Link to="/apparaten" className="klein">← Apparaten</Link>
          <h1>{apparaat.name}</h1>
          <div className="chips">
            {apparaat.category && <span className="chip">{apparaat.category}</span>}
            <span className="chip">{apparaat.location}</span>
            {gearchiveerd && <span className="chip waarschuwing">gearchiveerd op {formatDatum(apparaat.archivedAt)}</span>}
          </div>
        </div>
        <div className="knoppenrij">
          {gearchiveerd ? (
            <button className="knop primair" onClick={zetTerug}>Terugzetten</button>
          ) : (
            <>
              {!bewerken && <button className="knop" onClick={() => setBewerken(true)}>Bewerken</button>}
              <button className="knop gevaar" onClick={archiveer}>Archiveren</button>
            </>
          )}
        </div>
      </header>
      {actieFout && <p className="foutmelding">{actieFout}</p>}

      <div className="detail-raster">
        <div className="kolom">
          {bewerken ? (
            <ApparaatBewerken
              apparaat={apparaat}
              onAnnuleer={() => setBewerken(false)}
              onOpgeslagen={() => {
                setBewerken(false)
                herlaad()
              }}
            />
          ) : (
            <ApparaatGegevens apparaat={apparaat} />
          )}

          <section className="kaart">
            <div className="kaart-kop">
              <h2>Foto's & documenten</h2>
            </div>
            <Leeg>Nog geen foto's of documenten.</Leeg>
            <div className="knoppenrij">
              <NogNietKlaar uitleg="foto-upload endpoint" klein>📷 Foto</NogNietKlaar>
              <NogNietKlaar uitleg="document-upload (handleiding, garantie)" klein>📄 Document</NogNietKlaar>
            </div>
          </section>
        </div>

        <div className="kolom">
          <section className="kaart">
            <h2>Onderhoudstaken</h2>
            {taken.length === 0 && gearchiveerd ? (
              <Leeg>Geen taken.</Leeg>
            ) : taken.length === 0 ? (
              <p className="hint-onvolledig">
                <span className="badge onvolledig">onvolledig</span> Voeg een onderhoudstaak toe, anders krijg je
                voor dit apparaat nooit een seintje.
              </p>
            ) : (
              <div className="takenlijst">
                {taken.map((taak) => (
                  <TaskCard
                    key={taak._id}
                    taak={taak}
                    onAfvinken={gearchiveerd ? null : afvinken}
                    onDetails={gearchiveerd ? null : setAfronden}
                    bezig={bezigMet === taak._id}
                  >
                    <NogNietKlaar uitleg="PATCH /tasks/{id} bestaat nog niet" klein>Bewerk</NogNietKlaar>
                  </TaskCard>
                ))}
              </div>
            )}
            {!gearchiveerd && <TaakToevoegen assetId={id} onToegevoegd={herlaad} startOpen={taken.length === 0} />}
          </section>

          <section className="kaart">
            <h2>Logboek</h2>
            {logs.length === 0 ? (
              <Leeg>Nog niets uitgevoerd.</Leeg>
            ) : (
              <ul className="logboek">
                {logs.map((log) => (
                  <li key={log._id}>
                    <div className="logboek-kop">
                      <strong>{takenPerId[log.taskId]?.title ?? 'Onderhoud'}</strong>
                      <span className="gedempt klein">{formatDatum(log.doneAt)}</span>
                    </div>
                    <p className="klein gedempt">
                      {log.performedBy && `door ${log.performedBy}`}
                      {log.performedBy && log.cost !== null && ' · '}
                      {log.cost !== null && `€ ${log.cost}`}
                    </p>
                    {log.notes && <p className="klein">{log.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

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

// ---------- Kleinere componenten, alleen gebruikt op deze pagina ----------

function ApparaatGegevens({ apparaat }) {
  const specs = Object.entries(apparaat.specs ?? {})
  return (
    <section className="kaart">
      <h2>Gegevens</h2>
      <dl className="gegevens">
        <dt>Merk</dt>
        <dd>{apparaat.brand ?? '–'}</dd>
        <dt>Model</dt>
        <dd>{apparaat.model ?? '–'}</dd>
        <dt>Geplaatst</dt>
        <dd>{formatDatum(apparaat.installedAt)}</dd>
      </dl>

      <h3>Specificaties</h3>
      {specs.length === 0 ? (
        <Leeg>Geen specificaties.</Leeg>
      ) : (
        <dl className="gegevens">
          {specs.map(([sleutel, waarde]) => (
            <div key={sleutel} className="gegevens-rij">
              <dt>{sleutel}</dt>
              <dd>{String(waarde)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

function ApparaatBewerken({ apparaat, onAnnuleer, onOpgeslagen }) {
  // De state begint als kopie van het apparaat; pas bij Opslaan gaat het naar de backend
  const [form, setForm] = useState({
    name: apparaat.name,
    category: apparaat.category ?? '',
    location: apparaat.location,
    brand: apparaat.brand ?? '',
    model: apparaat.model ?? '',
    installedAt: naarInputDatum(apparaat.installedAt),
  })
  const [specs, setSpecs] = useState(specsNaarRijen(apparaat.specs))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  function wijzig(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function opslaan(e) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    try {
      // PATCH = gedeeltelijke update. De backend zet alleen de velden die we sturen.
      await updateAsset(apparaat._id, {
        name: form.name.trim(),
        category: form.category.trim() || null,
        location: form.location.trim(),
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        installedAt: vanInputDatum(form.installedAt),
        specs: rijenNaarSpecs(specs),
      })
      onOpgeslagen()
    } catch (err) {
      setFout(err.message)
      setBezig(false)
    }
  }

  return (
    <form className="kaart formulier" onSubmit={opslaan}>
      <h2>Gegevens bewerken</h2>
      <div className="velden-raster">
        <label>Naam *<input name="name" value={form.name} onChange={wijzig} required /></label>
        <label>Categorie<input name="category" value={form.category} onChange={wijzig} /></label>
        <label>Locatie *<input name="location" value={form.location} onChange={wijzig} required /></label>
        <label>Merk<input name="brand" value={form.brand} onChange={wijzig} /></label>
        <label>Model<input name="model" value={form.model} onChange={wijzig} /></label>
        <label>Geplaatst op<input type="date" name="installedAt" value={form.installedAt} onChange={wijzig} /></label>
      </div>

      <fieldset>
        <legend>Specificaties</legend>
        <SpecsEditor rijen={specs} onChange={setSpecs} bestaandeVastzetten />
      </fieldset>

      {fout && <p className="foutmelding">{fout}</p>}
      <div className="knoppenrij">
        <span className="vulling" />
        <button type="button" className="knop" onClick={onAnnuleer}>Annuleren</button>
        <button type="submit" className="knop primair" disabled={bezig}>{bezig ? 'Opslaan…' : 'Opslaan'}</button>
      </div>
    </form>
  )
}

// startOpen: formulier meteen open tonen (bij een apparaat zonder taken)
function TaakToevoegen({ assetId, onToegevoegd, startOpen = false }) {
  const leeg = { title: '', every: 1, unit: 'years', nextDue: vandaagInput() }
  const [open, setOpen] = useState(startOpen)
  // Alleen focussen na een klik; bij startOpen zou je telefoon anders meteen het toetsenbord openen
  const [geklikt, setGeklikt] = useState(false)
  const [taak, setTaak] = useState(leeg)
  const [fout, setFout] = useState(null)

  function wijzig(e) {
    setTaak({ ...taak, [e.target.name]: e.target.value })
  }

  async function opslaan(e) {
    e.preventDefault()
    setFout(null)
    try {
      await createTask({
        assetId,
        title: taak.title.trim(),
        every: Number(taak.every),
        unit: taak.unit,
        nextDue: vanInputDatum(taak.nextDue),
      })
      setTaak(leeg)
      setOpen(false)
      onToegevoegd()
    } catch (err) {
      setFout(err.message)
    }
  }

  if (!open) {
    return <button className="knop klein" onClick={() => { setOpen(true); setGeklikt(true) }}>+ Taak toevoegen</button>
  }

  return (
    <form className="taak-toevoegen" onSubmit={opslaan}>
      <div className="velden-raster">
        <label>Taak<input name="title" value={taak.title} onChange={wijzig} required autoFocus={geklikt} placeholder="Filter vervangen" /></label>
        <label>
          Elke
          <div className="interval-invoer">
            <input type="number" min="1" name="every" value={taak.every} onChange={wijzig} required />
            <select name="unit" value={taak.unit} onChange={wijzig}>
              <option value="days">dagen</option>
              <option value="weeks">weken</option>
              <option value="months">maanden</option>
              <option value="years">jaar</option>
            </select>
          </div>
        </label>
        <label>Eerste keer<input type="date" name="nextDue" value={taak.nextDue} onChange={wijzig} required /></label>
      </div>
      {fout && <p className="foutmelding">{fout}</p>}
      <div className="knoppenrij">
        <span className="vulling" />
        <button type="button" className="knop klein" onClick={() => setOpen(false)}>Annuleren</button>
        <button type="submit" className="knop primair klein">Toevoegen</button>
      </div>
    </form>
  )
}

export default ApparaatDetail
