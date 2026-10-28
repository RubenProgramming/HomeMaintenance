import { useState } from 'react'
import { vandaagInput, vanInputDatum } from '../utils/datum'
import Sheet from './Sheet'
import './Formulier.css'

// "Afronden met details": datum, wie, kosten en notitie.
// Voor de snelle weg is er het vinkje; dit is voor klussen die je wilt vastleggen
// (monteur geweest, onderdeel gekocht). Opslaan gaat via afvinken uit useAfvinken.
function AfrondenSheet({ taak, onAfvinken, onSluit }) {
  const [form, setForm] = useState({ doneAt: vandaagInput(), performedBy: '', cost: '', notes: '' })
  const [bezig, setBezig] = useState(false)

  function wijzig(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function opslaan(e, sluit) {
    e.preventDefault()
    setBezig(true)
    // Lege velden als null, zodat ze in MongoDB netjes leeg zijn
    const gelukt = await onAfvinken(taak, {
      doneAt: vanInputDatum(form.doneAt),
      performedBy: form.performedBy.trim() || null,
      cost: form.cost === '' ? null : Number(form.cost),
      notes: form.notes.trim() || null,
    })
    if (gelukt) sluit()
    else setBezig(false) // de fout staat in de melding onderin
  }

  return (
    <Sheet
      titel="Afronden"
      onSluit={onSluit}
      voet={({ sluit }) => (
        <>
          <button type="button" className="btn" onClick={sluit}>Annuleren</button>
          <button type="submit" form="afronden-form" className="btn btn--primair" disabled={bezig}>
            {bezig ? 'Opslaan…' : 'Afronden'}
          </button>
        </>
      )}
    >
      {({ sluit }) => (
        <form id="afronden-form" className="velden" onSubmit={(e) => opslaan(e, sluit)}>
          <p className="afronden__taak">{taak.title}</p>
          <div className="velden__rij">
            <label className="veld">
              <span className="veld__label">Uitgevoerd op</span>
              <input className="invoer" type="date" name="doneAt" value={form.doneAt} onChange={wijzig} required />
            </label>
            <label className="veld">
              <span className="veld__label">Kosten <small>hele euro's</small></span>
              <span className="invoer-groep">
                <span className="invoer-groep__voor" aria-hidden>€</span>
                <input className="invoer cijfers" type="number" inputMode="numeric" min="0" step="1" name="cost" value={form.cost} onChange={wijzig} />
              </span>
            </label>
          </div>
          <label className="veld">
            <span className="veld__label">Door wie</span>
            <input className="invoer" name="performedBy" value={form.performedBy} onChange={wijzig} placeholder="Zelf, monteur, …" />
          </label>
          <label className="veld">
            <span className="veld__label">Notitie</span>
            <textarea className="invoer" name="notes" value={form.notes} onChange={wijzig} rows={3} />
          </label>
          <button type="button" className="btn" disabled>
            Foto toevoegen <span className="binnenkort">Binnenkort</span>
          </button>
        </form>
      )}
    </Sheet>
  )
}

export default AfrondenSheet
