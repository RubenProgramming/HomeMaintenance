import { useState } from 'react'
import { dagenTot, formatDatum, naarInputDatum, vandaagInput, vanInputDatum, verschuif } from '../utils/datum'
import Sheet from './Sheet'
import './Formulier.css'
import './UitstelSheet.css'

// "Uitstellen": de taak schuift op zonder dat hij als gedaan in het logboek komt.
// Een snelkeuze slaat meteen op (één tik); voor een eigen datum is er het datumveld.
//
// Vanaf welke datum tellen we?
// - te laat (of vandaag): vanaf vandaag. "Over 1 week" = een week na vandaag.
// - nog niet aan de beurt: vanaf de huidige datum van de taak, dus "1 week later".
//   Daarom heten de knoppen dan anders, zodat er niet "Morgen" staat terwijl het
//   een dag na de geplande datum wordt.
//
// Props: taak, onUitstellen(taak, datum "2026-01-13") → Promise<boolean>, onSluit
function UitstelSheet({ taak, onUitstellen, onSluit }) {
  const dagen = dagenTot(taak.nextDue)
  const vanafVandaag = dagen === null || dagen <= 0
  const basis = vanafVandaag ? vandaagInput() : naarInputDatum(taak.nextDue)

  const keuzes = [
    { label: vanafVandaag ? 'Morgen' : '1 dag later', datum: verschuif(basis, { dagen: 1 }) },
    { label: vanafVandaag ? 'Over 1 week' : '1 week later', datum: verschuif(basis, { dagen: 7 }) },
    { label: vanafVandaag ? 'Over 1 maand' : '1 maand later', datum: verschuif(basis, { maanden: 1 }) },
  ]

  const [eigenDatum, setEigenDatum] = useState(keuzes[1].datum)
  const [bezig, setBezig] = useState(false)

  async function stelUit(datum, sluit) {
    if (bezig) return
    setBezig(true)
    const gelukt = await onUitstellen(taak, datum)
    if (gelukt) sluit()
    else setBezig(false) // de fout staat in de melding onderin
  }

  return (
    <Sheet
      titel="Uitstellen"
      onSluit={onSluit}
      focusVeld={false} // eerst de snelkeuzes, niet meteen het datumveld
      voet={({ sluit }) => (
        <>
          <button type="button" className="btn" onClick={sluit}>Annuleren</button>
          <button type="submit" form="uitstel-form" className="btn btn--primair" disabled={bezig || !eigenDatum}>
            {bezig ? 'Opslaan…' : 'Uitstellen'}
          </button>
        </>
      )}
    >
      {({ sluit }) => (
        <form
          id="uitstel-form"
          className="velden"
          onSubmit={(e) => {
            e.preventDefault()
            stelUit(eigenDatum, sluit)
          }}
        >
          <div>
            <p className="afronden__taak">{taak.title}</p>
            <p className="uitstel__uitleg">
              {taak.nextDue ? `Gepland op ${formatDatum(taak.nextDue)}` : 'Nog geen datum'}
              {dagen !== null && dagen < 0 && ', te laat: we rekenen vanaf vandaag'}
            </p>
          </div>

          <div className="uitstel__keuzes">
            {keuzes.map((k) => (
              <button
                key={k.label}
                type="button"
                className="keuze uitstel__keuze"
                disabled={bezig}
                onClick={() => stelUit(k.datum, sluit)}
              >
                <span>{k.label}</span>
                <span className="uitstel__datum cijfers">{formatDatum(vanInputDatum(k.datum))}</span>
              </button>
            ))}
          </div>

          <label className="veld">
            <span className="veld__label">Kies datum</span>
            <input
              className="invoer"
              type="date"
              value={eigenDatum}
              onChange={(e) => setEigenDatum(e.target.value)}
              required
            />
          </label>
        </form>
      )}
    </Sheet>
  )
}

export default UitstelSheet
