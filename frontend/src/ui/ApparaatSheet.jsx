import { useState } from 'react'
import { getLabels } from '../api'
import { useApi } from '../hooks/useApi'
import { createAsset, updateAsset } from '../api'
import { naarInputDatum, vanInputDatum } from '../utils/datum'
import { rijenNaarSpecs, specsNaarRijen } from '../utils/specs'
import Sheet from './Sheet'
import SpecsVelden from './SpecsVelden'
import './Formulier.css'

// Apparaat toevoegen (apparaat = null) of bewerken.
// Alleen naam en ruimte zijn verplicht; de rest vul je aan wanneer je het weet.
// Ruimtes en categorieën komen uit de lijsten van Instellingen; een nieuwe naam intypen
// mag ook, die komt dan vanzelf in de lijst (zie routers/labels.py).
// - onOpgeslagen(apparaat): na opslaan (bij nieuw: om ernaartoe te gaan)
function ApparaatSheet({ apparaat = null, onOpgeslagen, onSluit }) {
  const nieuw = apparaat === null
  const [form, setForm] = useState({
    name: apparaat?.name ?? '',
    location: apparaat?.location ?? '',
    category: apparaat?.category ?? '',
    brand: apparaat?.brand ?? '',
    model: apparaat?.model ?? '',
    installedAt: naarInputDatum(apparaat?.installedAt),
  })
  const [specs, setSpecs] = useState(specsNaarRijen(apparaat?.specs))
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  const { data: lijsten } = useApi(() =>
    Promise.all([getLabels('rooms'), getLabels('categories')]).then(([r, c]) => ({ ruimtes: r, categorieen: c })),
  )
  const ruimtes = (lijsten?.ruimtes ?? []).map((r) => r.name)
  const categorieen = (lijsten?.categorieen ?? []).map((c) => c.name)

  function wijzig(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function opslaan(e, sluit) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    // Lege tekstvelden worden null, zodat ze in MongoDB netjes leeg zijn
    const gegevens = {
      name: form.name.trim(),
      location: form.location.trim(),
      category: form.category.trim() || null,
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      installedAt: vanInputDatum(form.installedAt),
      specs: rijenNaarSpecs(specs),
    }
    try {
      // PATCH = gedeeltelijke update; de backend zet alleen wat we sturen
      const resultaat = nieuw ? await createAsset(gegevens) : await updateAsset(apparaat._id, gegevens)
      onOpgeslagen?.(resultaat)
      sluit()
    } catch (err) {
      setFout(err.message)
      setBezig(false)
    }
  }

  return (
    <Sheet
      titel={nieuw ? 'Nieuw apparaat' : 'Apparaat bewerken'}
      onSluit={onSluit}
      voet={({ sluit }) => (
        <>
          <button type="button" className="btn" onClick={sluit}>Annuleren</button>
          <button type="submit" form="apparaat-form" className="btn btn--primair" disabled={bezig}>
            {bezig ? 'Opslaan…' : nieuw ? 'Toevoegen' : 'Opslaan'}
          </button>
        </>
      )}
    >
      {({ sluit }) => (
        <form id="apparaat-form" className="velden" onSubmit={(e) => opslaan(e, sluit)}>
          <label className="veld">
            <span className="veld__label">Naam</span>
            <input className="invoer" name="name" value={form.name} onChange={wijzig} required placeholder="Bijv. CV-ketel" />
          </label>
          <div className="velden__rij">
            <label className="veld">
              <span className="veld__label">Ruimte</span>
              {/* datalist: vrij typen, met de ruimtelijst als suggesties */}
              <input className="invoer" name="location" list="ruimtes" value={form.location} onChange={wijzig} required placeholder="Kies of typ" />
              <datalist id="ruimtes">
                {ruimtes.map((r) => <option key={r} value={r} />)}
              </datalist>
            </label>
            <label className="veld">
              <span className="veld__label">Categorie <small>optioneel</small></span>
              <input className="invoer" name="category" list="categorieen" value={form.category} onChange={wijzig} placeholder="Bijv. Installaties" />
              <datalist id="categorieen">
                {categorieen.map((c) => <option key={c} value={c} />)}
              </datalist>
            </label>
          </div>

          <fieldset className="veldgroep">
            <legend className="veldgroep__titel">Details</legend>
            <div className="velden__rij">
              <label className="veld">
                <span className="veld__label">Merk</span>
                <input className="invoer" name="brand" value={form.brand} onChange={wijzig} />
              </label>
              <label className="veld">
                <span className="veld__label">Model</span>
                <input className="invoer" name="model" value={form.model} onChange={wijzig} />
              </label>
            </div>
            <label className="veld">
              <span className="veld__label">Geplaatst op</span>
              <input className="invoer" type="date" name="installedAt" value={form.installedAt} onChange={wijzig} />
            </label>
          </fieldset>

          <fieldset className="veldgroep">
            <legend className="veldgroep__titel">Specificaties</legend>
            <SpecsVelden rijen={specs} onChange={setSpecs} bestaandeVastzetten={!nieuw} />
          </fieldset>

          {fout && <p className="formfout">{fout}</p>}
        </form>
      )}
    </Sheet>
  )
}

export default ApparaatSheet
