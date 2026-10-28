import { useState } from 'react'
import { createLog, deleteLog, updateLog } from '../api'
import { formatDatum, naarInputDatum, vandaagInput, vanInputDatum } from '../utils/datum'
import Sheet from './Sheet'
import './Formulier.css'

// Logregel vastleggen of bewerken. Eén sheet voor allebei:
// - log = null: los onderhoud vastleggen (reparatie, storing, klus zonder vaste taak).
//   Dan is "Wat is er gedaan" verplicht.
// - log = bestaande regel: corrigeren. Bij een afgevinkte taak (log.taskId) heeft de regel
//   geen eigen titel; dan tonen we de taaknaam (taakTitel) in plaats van het titelveld.
// - apparaatId: nodig bij nieuw (POST /assets/{id}/logs)
// - onOpgeslagen(): na opslaan, bijv. herlaad()
function LogSheet({ apparaatId, log = null, taakTitel, onOpgeslagen, onSluit }) {
  const nieuw = log === null
  const afvinkLog = !nieuw && Boolean(log.taskId)

  // Zo staat het in het formulier (allemaal tekst, want zo werken invoervelden)
  const begin = {
    title: log?.title ?? '',
    doneAt: nieuw ? vandaagInput() : naarInputDatum(log.doneAt),
    performedBy: log?.performedBy ?? '',
    cost: log?.cost === null || log?.cost === undefined ? '' : String(log.cost),
    notes: log?.notes ?? '',
  }
  const [form, setForm] = useState(begin)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  function wijzig(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Formulier -> wat de backend verwacht. Lege velden als null, zodat ze in MongoDB netjes leeg zijn.
  function naarBackend(f) {
    return {
      title: f.title.trim(),
      doneAt: vanInputDatum(f.doneAt),
      performedBy: f.performedBy.trim() || null,
      cost: f.cost === '' ? null : Number(f.cost),
      notes: f.notes.trim() || null,
    }
  }

  async function opslaan(e, sluit) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    const gegevens = naarBackend(form)
    if (afvinkLog) delete gegevens.title // afgevinkte taak: titel komt van de taak

    try {
      if (nieuw) {
        await createLog(apparaatId, gegevens)
      } else {
        // Alleen sturen wat echt veranderd is. Belangrijk voor de datum: een snelle afvinking
        // heeft ook een tijd, en die willen we niet zomaar op middernacht zetten
        // (dat zou ook de volgende datum van de taak laten verschuiven).
        const oud = naarBackend(begin)
        const wijzigingen = Object.fromEntries(
          Object.entries(gegevens).filter(([veld, waarde]) => waarde !== oud[veld]),
        )
        if (Object.keys(wijzigingen).length > 0) await updateLog(log._id, wijzigingen)
      }
      onOpgeslagen?.()
      sluit()
    } catch (err) {
      setFout(err.message)
      setBezig(false)
    }
  }

  return (
    <Sheet
      titel={nieuw ? 'Onderhoud vastleggen' : 'Logregel bewerken'}
      onSluit={onSluit}
      voet={({ sluit }) => (
        <>
          <button type="button" className="btn" onClick={sluit}>Annuleren</button>
          <button type="submit" form="log-form" className="btn btn--primair" disabled={bezig}>
            {bezig ? 'Opslaan…' : nieuw ? 'Vastleggen' : 'Opslaan'}
          </button>
        </>
      )}
    >
      {({ sluit }) => (
        <form id="log-form" className="velden" onSubmit={(e) => opslaan(e, sluit)}>
          {afvinkLog ? (
            <p className="afronden__taak">{taakTitel ?? 'Onderhoud'}</p>
          ) : (
            <label className="veld">
              <span className="veld__label">Wat is er gedaan</span>
              <input
                className="invoer"
                name="title"
                value={form.title}
                onChange={wijzig}
                placeholder="Pomp vervangen, storing verholpen, …"
                maxLength={120}
                required
              />
            </label>
          )}
          <div className="velden__rij">
            <label className="veld">
              <span className="veld__label">Datum</span>
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
          {fout && <p className="formfout">{fout}</p>}
        </form>
      )}
    </Sheet>
  )
}

// Verwijderen is definitief (geen prullenbak), dus eerst bevestigen.
// - titel: wat er in de regel staat (eigen titel of taaknaam)
// - onVerwijderd(): na verwijderen, bijv. herlaad()
export function LogVerwijderenSheet({ log, titel, onVerwijderd, onSluit }) {
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  async function verwijder(sluit) {
    setBezig(true)
    setFout(null)
    try {
      await deleteLog(log._id)
      onVerwijderd?.()
      sluit()
    } catch (err) {
      setFout(err.message)
      setBezig(false)
    }
  }

  return (
    <Sheet
      titel="Logregel verwijderen"
      onSluit={onSluit}
      voet={({ sluit }) => (
        <>
          <button type="button" className="btn" onClick={sluit}>Annuleren</button>
          <button type="button" className="btn btn--gevaar" disabled={bezig} onClick={() => verwijder(sluit)}>
            {bezig ? 'Verwijderen…' : 'Verwijderen'}
          </button>
        </>
      )}
    >
      <div className="velden">
        <p>
          <strong>{titel}</strong> van {formatDatum(log.doneAt)} verdwijnt definitief uit het logboek.
        </p>
        {log.taskId && (
          <p className="zwak-tekst">
            Was dit de laatste keer dat de taak is afgevinkt, dan springt de volgende datum van de taak
            terug naar wat hij daarvoor was.
          </p>
        )}
        {fout && <p className="formfout">{fout}</p>}
      </div>
    </Sheet>
  )
}

export default LogSheet
