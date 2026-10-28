import { useState } from 'react'
import { createTask, updateTask } from '../api'
import { naarInputDatum, vandaagInput, vanInputDatum } from '../utils/datum'
import Sheet from './Sheet'
import './Formulier.css'

// Snelkeuzes voor het interval: de meeste onderhoudstaken zijn een van deze
const SNEL = [
  { label: 'Elke maand', every: 1, unit: 'months' },
  { label: 'Elk kwartaal', every: 3, unit: 'months' },
  { label: 'Elk half jaar', every: 6, unit: 'months' },
  { label: 'Elk jaar', every: 1, unit: 'years' },
  { label: 'Elke 2 jaar', every: 2, unit: 'years' },
]

// Onderhoudstaak toevoegen of bewerken, met hetzelfde formulier.
// - nieuw:    <TaakSheet apparaat={apparaat} … />
// - bewerken: <TaakSheet taak={taak} apparaat={apparaat?} … />  (apparaat alleen voor de naam erboven)
function TaakSheet({ apparaat, taak: bestaand, onOpgeslagen, onSluit }) {
  const bewerken = Boolean(bestaand)
  // Het formulier werkt met tekst zoals in de velden staat ("2026-01-13"), niet met de backendvorm
  const [taak, setTaak] = useState(
    bewerken
      ? { title: bestaand.title, every: bestaand.every, unit: bestaand.unit, nextDue: naarInputDatum(bestaand.nextDue) }
      : { title: '', every: 1, unit: 'years', nextDue: vandaagInput() },
  )
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  function wijzig(e) {
    setTaak({ ...taak, [e.target.name]: e.target.value })
  }

  async function opslaan(e, sluit) {
    e.preventDefault()
    setBezig(true)
    setFout(null)
    const velden = {
      title: taak.title.trim(),
      every: Number(taak.every),
      unit: taak.unit,
      nextDue: vanInputDatum(taak.nextDue),
    }
    try {
      if (bewerken) {
        // Alleen sturen wat echt anders is (PATCH). Niets veranderd? Dan gewoon sluiten.
        const oud = { ...bestaand, nextDue: vanInputDatum(naarInputDatum(bestaand.nextDue)) }
        const wijzigingen = Object.fromEntries(Object.entries(velden).filter(([veld, waarde]) => waarde !== oud[veld]))
        if (Object.keys(wijzigingen).length > 0) await updateTask(bestaand._id, wijzigingen)
      } else {
        await createTask({ assetId: apparaat._id, ...velden })
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
      titel={bewerken ? 'Taak bewerken' : 'Onderhoudstaak toevoegen'}
      onSluit={onSluit}
      voet={({ sluit }) => (
        <>
          <button type="button" className="btn" onClick={sluit}>Annuleren</button>
          <button type="submit" form="taak-form" className="btn btn--primair" disabled={bezig}>
            {bezig ? 'Opslaan…' : bewerken ? 'Opslaan' : 'Toevoegen'}
          </button>
        </>
      )}
    >
      {({ sluit }) => (
        <form id="taak-form" className="velden" onSubmit={(e) => opslaan(e, sluit)}>
          {apparaat && <p className="gedempt-tekst">{apparaat.name}</p>}
          <label className="veld">
            <span className="veld__label">Wat moet er gebeuren?</span>
            <input className="invoer" name="title" value={taak.title} onChange={wijzig} required placeholder="Bijv. Filter vervangen" />
          </label>

          <div className="veld">
            <span className="veld__label">Hoe vaak?</span>
            <div className="keuzes">
              {SNEL.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  className="keuze"
                  aria-pressed={Number(taak.every) === s.every && taak.unit === s.unit}
                  onClick={() => setTaak({ ...taak, every: s.every, unit: s.unit })}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="interval">
              <input className="invoer cijfers" type="number" min="1" name="every" value={taak.every} onChange={wijzig} required aria-label="Aantal" />
              <select className="invoer" name="unit" value={taak.unit} onChange={wijzig} aria-label="Eenheid">
                <option value="days">dagen</option>
                <option value="weeks">weken</option>
                <option value="months">maanden</option>
                <option value="years">jaar</option>
              </select>
            </div>
          </div>

          <label className="veld">
            <span className="veld__label">{bewerken ? 'Volgende keer' : 'Eerste keer'}</span>
            <input className="invoer" type="date" name="nextDue" value={taak.nextDue} onChange={wijzig} required />
          </label>

          {fout && <p className="formfout">{fout}</p>}
        </form>
      )}
    </Sheet>
  )
}

export default TaakSheet
