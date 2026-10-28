import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { createAsset, createTask, getAssets } from '../api'
import { useApi } from '../hooks/useApi'
import { vandaagInput, vanInputDatum } from '../utils/datum'
import { rijenNaarSpecs } from '../utils/specs'
import { alleRuimtes } from '../utils/ruimtes'
import SpecsEditor from '../components/SpecsEditor'
import NogNietKlaar from '../components/NogNietKlaar'

const LEEG_APPARAAT = { name: '', category: '', location: '', brand: '', model: '', installedAt: '' }
const LEGE_TAAK = { title: '', every: 1, unit: 'years', nextDue: vandaagInput() }

function ApparaatNieuw() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [apparaat, setApparaat] = useState({ ...LEEG_APPARAAT, location: params.get('ruimte') ?? '' })
  const [specs, setSpecs] = useState([])
  const [metTaak, setMetTaak] = useState(false)
  const [taak, setTaak] = useState(LEGE_TAAK)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [melding, setMelding] = useState(null)

  // Bestaande apparaten ophalen, alleen om categorieën en locaties voor te stellen
  const { data: bestaande } = useApi(() => getAssets())
  const categorieen = [...new Set((bestaande ?? []).map((a) => a.category).filter(Boolean))].sort()
  const locaties = alleRuimtes(bestaande ?? [])

  function wijzigApparaat(e) {
    setApparaat({ ...apparaat, [e.target.name]: e.target.value })
  }
  function wijzigTaak(e) {
    setTaak({ ...taak, [e.target.name]: e.target.value })
  }

  // Welke knop is ingedrukt? Dat lezen we uit e.nativeEvent.submitter
  async function opslaan(e) {
    e.preventDefault()
    const nogEen = e.nativeEvent.submitter?.name === 'nogEen'
    setBezig(true)
    setFout(null)

    try {
      // Stap 1: het apparaat aanmaken. Lege tekstvelden worden null.
      const nieuw = await createAsset({
        name: apparaat.name.trim(),
        category: apparaat.category.trim() || null,
        location: apparaat.location.trim(),
        brand: apparaat.brand.trim() || null,
        model: apparaat.model.trim() || null,
        installedAt: vanInputDatum(apparaat.installedAt),
        specs: rijenNaarSpecs(specs),
      })

      // Stap 2: optioneel meteen een eerste taak. Die heeft het _id van stap 1 nodig.
      if (metTaak && taak.title.trim()) {
        await createTask({
          assetId: nieuw._id,
          title: taak.title.trim(),
          every: Number(taak.every),
          unit: taak.unit,
          nextDue: vanInputDatum(taak.nextDue),
        })
      }

      if (nogEen) {
        // Categorie en locatie laten staan: handig als je een ruimte afloopt
        setApparaat({ ...LEEG_APPARAAT, category: apparaat.category, location: apparaat.location })
        setSpecs([])
        setTaak(LEGE_TAAK)
        setMelding(`"${nieuw.name}" opgeslagen. Volgende!`)
        setBezig(false)
      } else {
        navigate(`/apparaten/${nieuw._id}`)
      }
    } catch (err) {
      setFout(err.message)
      setBezig(false)
    }
  }

  return (
    <>
      <header className="paginakop">
        <div>
          <Link to="/apparaten" className="klein">← Apparaten</Link>
          <h1>Nieuw apparaat</h1>
        </div>
      </header>

      <form className="kaart formulier" onSubmit={opslaan}>
        {melding && <p className="succesmelding">{melding}</p>}

        <div className="velden-raster">
          <label>
            Naam *
            <input name="name" value={apparaat.name} onChange={wijzigApparaat} required autoFocus placeholder="CV-ketel" />
          </label>
          <label>
            Categorie
            {/* datalist: vrij typen, maar met suggesties uit bestaande apparaten */}
            <input name="category" list="categorieen" value={apparaat.category} onChange={wijzigApparaat} placeholder="Installaties" />
            <datalist id="categorieen">
              {categorieen.map((c) => <option key={c} value={c} />)}
            </datalist>
          </label>
          <label>
            Ruimte *
            <input name="location" list="locaties" value={apparaat.location} onChange={wijzigApparaat} required placeholder="Keuken" />
            <datalist id="locaties">
              {locaties.map((l) => <option key={l} value={l} />)}
            </datalist>
          </label>
          <label>
            Merk
            <input name="brand" value={apparaat.brand} onChange={wijzigApparaat} />
          </label>
          <label>
            Model
            <input name="model" value={apparaat.model} onChange={wijzigApparaat} />
          </label>
          <label>
            Geplaatst op
            <input type="date" name="installedAt" value={apparaat.installedAt} onChange={wijzigApparaat} />
          </label>
        </div>

        <fieldset>
          <legend>Specificaties</legend>
          <p className="klein gedempt">Vrije velden, verschillend per apparaat: voltage, serienummer, filtertype…</p>
          <SpecsEditor rijen={specs} onChange={setSpecs} />
        </fieldset>

        <fieldset>
          <legend>
            <label className="vinkje">
              <input type="checkbox" checked={metTaak} onChange={(e) => setMetTaak(e.target.checked)} />
              Meteen een onderhoudstaak toevoegen
            </label>
          </legend>
          {metTaak && (
            <div className="velden-raster">
              <label>
                Taak
                <input name="title" value={taak.title} onChange={wijzigTaak} required placeholder="Jaarlijks onderhoud" />
              </label>
              <label>
                Elke
                <div className="interval-invoer">
                  <input type="number" min="1" name="every" value={taak.every} onChange={wijzigTaak} required />
                  <select name="unit" value={taak.unit} onChange={wijzigTaak}>
                    <option value="days">dagen</option>
                    <option value="weeks">weken</option>
                    <option value="months">maanden</option>
                    <option value="years">jaar</option>
                  </select>
                </div>
              </label>
              <label>
                Eerste keer
                <input type="date" name="nextDue" value={taak.nextDue} onChange={wijzigTaak} required />
              </label>
            </div>
          )}
        </fieldset>

        <div className="knoppenrij">
          <NogNietKlaar uitleg="foto-upload bestaat nog niet in de backend">📷 Foto typeplaatje</NogNietKlaar>
          <span className="vulling" />
          <button type="submit" name="nogEen" className="knop" disabled={bezig}>
            Opslaan & nog een
          </button>
          <button type="submit" className="knop primair" disabled={bezig}>
            {bezig ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
        {fout && <p className="foutmelding">{fout}</p>}
      </form>
    </>
  )
}

export default ApparaatNieuw
