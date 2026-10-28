import { useContext, useRef, useState } from 'react'
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/20/solid'
import { createLabel, deleteLabel, getLabels, updateLabel } from '../api'
import { useApi } from '../hooks/useApi'
import { AppContext } from './appContext'
import Popmenu from './Popmenu'
import IcoonKiezer from './IcoonKiezer'
import Sheet from './Sheet'
import { LijstFout, LijstLaden } from './LijstStatus'
import './Lijst.css'
import './Formulier.css'
import './LabelBeheer.css'

// Beheer van een lijst namen: ruimtes of categorieën.
// - soort: 'rooms' | 'categories' (het API-pad)
// - enkelvoud: 'ruimte' | 'categorie' (voor de teksten)
// - verplaatsenVerplicht: bij verwijderen moeten apparaten ergens heen (ruimte),
//   anders mogen ze ook "zonder" (categorie)
// - metIcoon: per naam een icoon kunnen kiezen (categorieën: de tegel bij apparaten)
// - toon: melding onderin tonen (de pagina heeft er één voor alle lijsten)
function LabelBeheer({ soort, enkelvoud, verplaatsenVerplicht, metIcoon = false, toon }) {
  const { ververs } = useContext(AppContext)
  const { data: labels, laden, fout, herlaad } = useApi(() => getLabels(soort))
  const [bewerkId, setBewerkId] = useState(null)
  const [verwijder, setVerwijder] = useState(null) // label waarvoor het verplaats-paneel open is
  const [nieuw, setNieuw] = useState('')

  if (laden && !labels) return <LijstLaden rijen={3} />
  if (fout) return <LijstFout melding={fout} opnieuw={herlaad} />

  // Na elke wijziging: deze lijst opnieuw, en de rest van de app ook (namen bij apparaten)
  function klaar(tekst) {
    herlaad()
    ververs()
    if (tekst) toon({ tekst })
  }

  async function toevoegen(e) {
    e.preventDefault()
    const naam = nieuw.trim()
    if (!naam) return
    try {
      await createLabel(soort, naam)
      setNieuw('')
      klaar()
    } catch (err) {
      toon({ tekst: err.message, fout: true })
    }
  }

  async function hernoem(label, naam) {
    setBewerkId(null)
    naam = naam.trim()
    if (!naam || naam === label.name) return
    try {
      const resultaat = await updateLabel(soort, label._id, { name: naam })
      // Ander _id terug = de naam bestond al, dus samengevoegd
      klaar(resultaat._id !== label._id ? `${label.name} samengevoegd met ${resultaat.name}` : null)
    } catch (err) {
      toon({ tekst: err.message, fout: true })
    }
  }

  async function kiesIcoon(label, icoon) {
    try {
      await updateLabel(soort, label._id, { icon: icoon })
      klaar()
    } catch (err) {
      toon({ tekst: err.message, fout: true })
    }
  }

  async function verwijderNu(label, naarId = null) {
    try {
      await deleteLabel(soort, label._id, naarId)
      klaar(`${label.name} verwijderd`)
      return true
    } catch (err) {
      toon({ tekst: err.message, fout: true })
      return false
    }
  }

  return (
    <>
      <div className="lijst">
        {labels.map((label, i) => (
          <div key={label._id} className="rij-wrap" style={{ '--i': Math.min(i, 12) }}>
            <div className="rij-clip">
              <div className="rij label-rij">
                {metIcoon && <IcoonKiezer icoon={label.icon} naam={label.name} onKies={(i) => kiesIcoon(label, i)} />}
                {bewerkId === label._id ? (
                  <NaamInvoer
                    begin={label.name}
                    onOpslaan={(naam) => hernoem(label, naam)}
                    onAnnuleer={() => setBewerkId(null)}
                  />
                ) : (
                  <button type="button" className="label-rij__naam" onClick={() => setBewerkId(label._id)} title="Hernoemen">
                    {label.name}
                  </button>
                )}
                <span className="rij__meta cijfers">
                  {label.assetCount === 0 ? 'leeg' : `${label.assetCount} ${label.assetCount === 1 ? 'apparaat' : 'apparaten'}`}
                </span>
                <Popmenu
                  label={`Acties voor ${label.name}`}
                  items={[
                    { label: 'Hernoemen', icoon: PencilSquareIcon, onKies: () => setBewerkId(label._id) },
                    {
                      label: 'Verwijderen…',
                      icoon: TrashIcon,
                      // Leeg = meteen weg (snel opnieuw toe te voegen); anders eerst kiezen waarheen
                      onKies: () => (label.totalCount === 0 ? verwijderNu(label) : setVerwijder(label)),
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        ))}
        <form className="rij label-nieuw" onSubmit={toevoegen}>
          <PlusIcon aria-hidden />
          <input
            className="label-nieuw__invoer"
            value={nieuw}
            onChange={(e) => setNieuw(e.target.value)}
            placeholder={`Nieuwe ${enkelvoud}`}
            aria-label={`Nieuwe ${enkelvoud}`}
            maxLength={60}
          />
          {nieuw.trim() && (
            <button type="submit" className="btn btn--primair">
              Toevoegen
            </button>
          )}
        </form>
      </div>

      {verwijder && (
        <VerplaatsSheet
          label={verwijder}
          anderen={labels.filter((l) => l._id !== verwijder._id)}
          enkelvoud={enkelvoud}
          verplaatsenVerplicht={verplaatsenVerplicht}
          onVerwijder={(naarId) => verwijderNu(verwijder, naarId)}
          onSluit={() => setVerwijder(null)}
        />
      )}
    </>
  )
}

// Naam bewerken op de plek zelf. Enter of wegklikken = opslaan, Escape = annuleren.
function NaamInvoer({ begin, onOpslaan, onAnnuleer }) {
  const [naam, setNaam] = useState(begin)
  const geannuleerd = useRef(false) // anders slaat de blur bij het verdwijnen alsnog op
  return (
    <input
      className="invoer label-rij__invoer"
      value={naam}
      onChange={(e) => setNaam(e.target.value)}
      onBlur={() => !geannuleerd.current && onOpslaan(naam)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          geannuleerd.current = true
          onAnnuleer()
        }
      }}
      autoFocus
      maxLength={60}
      aria-label="Nieuwe naam"
    />
  )
}

// Verwijderen terwijl er apparaten in staan: eerst kiezen waar ze heen gaan
function VerplaatsSheet({ label, anderen, enkelvoud, verplaatsenVerplicht, onVerwijder, onSluit }) {
  const [naar, setNaar] = useState(verplaatsenVerplicht ? (anderen[0]?._id ?? '') : '')
  const [bezig, setBezig] = useState(false)
  const n = label.totalCount // inclusief gearchiveerd: die moeten ook ergens heen

  async function bevestig(e, sluit) {
    e.preventDefault()
    setBezig(true)
    if (await onVerwijder(naar || null)) sluit()
    else setBezig(false)
  }

  return (
    <Sheet
      titel={`${enkelvoud[0].toUpperCase()}${enkelvoud.slice(1)} verwijderen`}
      onSluit={onSluit}
      voet={({ sluit }) => (
        <>
          <button type="button" className="btn" onClick={sluit}>Annuleren</button>
          <button
            type="submit"
            form="verplaats-form"
            className="btn btn--gevaar"
            disabled={bezig || (verplaatsenVerplicht && !naar)}
          >
            Verplaatsen en verwijderen
          </button>
        </>
      )}
    >
      {({ sluit }) => (
        <form id="verplaats-form" className="velden" onSubmit={(e) => bevestig(e, sluit)}>
          <p>
            In <strong>{label.name}</strong> {n === 1 ? 'staat nog 1 apparaat' : `staan nog ${n} apparaten`}
            {n > label.assetCount && ` (waarvan ${n - label.assetCount} gearchiveerd)`}. Waar{' '}
            {n === 1 ? 'moet het' : 'moeten ze'} heen?
          </p>
          <label className="veld">
            <span className="veld__label">Verplaatsen naar</span>
            <select className="invoer" value={naar} onChange={(e) => setNaar(e.target.value)}>
              {!verplaatsenVerplicht && <option value="">Geen {enkelvoud}</option>}
              {anderen.map((l) => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>
          </label>
          {verplaatsenVerplicht && anderen.length === 0 && (
            <p className="formfout">Er is geen andere {enkelvoud}. Voeg er eerst een toe.</p>
          )}
        </form>
      )}
    </Sheet>
  )
}

export default LabelBeheer
