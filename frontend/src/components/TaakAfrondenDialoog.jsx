import { useState } from 'react'
import { completeTask } from '../api'
import { vandaagInput, vanInputDatum } from '../utils/datum'
import NogNietKlaar from './NogNietKlaar'

// Pop-up om een taak af te vinken.
// De backend (POST /tasks/{id}/done) doet daarna twee dingen:
//   1. een nieuw document in de "logs"-collectie (het logboek)
//   2. nextDue van de taak opschuiven met het interval (helpers.bereken_volgende)
function TaakAfrondenDialoog({ taak, onSluit, onKlaar }) {
  const [form, setForm] = useState({
    doneAt: vandaagInput(),
    performedBy: '',
    cost: '',
    notes: '',
  })
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  // Eén functie voor alle velden: het "name"-attribuut bepaalt welk veld wijzigt
  function wijzig(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function opslaan(e) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    try {
      // Lege velden sturen we als null, zodat ze in MongoDB netjes leeg zijn
      await completeTask(taak._id, {
        doneAt: vanInputDatum(form.doneAt),
        performedBy: form.performedBy || null,
        cost: form.cost === '' ? null : Number(form.cost),
        notes: form.notes || null,
      })
      onKlaar()
    } catch (err) {
      setFout(err.message)
      setBezig(false)
    }
  }

  return (
    <div className="overlay" onClick={onSluit}>
      {/* stopPropagation: klik ín de dialoog sluit hem niet */}
      <form className="dialoog" onClick={(e) => e.stopPropagation()} onSubmit={opslaan}>
        <h2>Afgerond: {taak.title}</h2>

        <label>
          Uitgevoerd op
          <input type="date" name="doneAt" value={form.doneAt} onChange={wijzig} required />
        </label>
        <label>
          Door wie
          <input name="performedBy" value={form.performedBy} onChange={wijzig} placeholder="Zelf, monteur, ..." />
        </label>
        <label>
          Kosten (hele euro's)
          <input type="number" min="0" step="1" name="cost" value={form.cost} onChange={wijzig} />
        </label>
        <label>
          Notities
          <textarea name="notes" value={form.notes} onChange={wijzig} rows={3} />
        </label>

        <NogNietKlaar uitleg="upload-endpoint voor foto's (attachments)">📷 Foto toevoegen</NogNietKlaar>

        {fout && <p className="foutmelding">{fout}</p>}

        <div className="knoppenrij">
          <button type="button" className="knop" onClick={onSluit}>Annuleren</button>
          <button type="submit" className="knop primair" disabled={bezig}>
            {bezig ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TaakAfrondenDialoog
