import { useContext, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/20/solid'
import { getAssets, getLabels, getTasks } from '../api'
import { useApi } from '../hooks/useApi'
import { datumLabel, urgentie } from '../utils/datum'
import { ruimteNamen, zelfdeRuimte } from '../utils/ruimtes'
import { AppContext } from '../ui/appContext'
import Kop from '../ui/Kop'
import ApparaatSheet from '../ui/ApparaatSheet'
import { LijstFout, LijstLaden } from '../ui/LijstStatus'
import '../ui/Formulier.css'
import '../ui/Lijst.css'
import './Apparaten.css'

// Alle apparaten, gegroepeerd per ruimte (zo loop je ook door je huis).
// Zoeken filtert live op naam, merk, model en categorie.
// nieuw: op /apparaten/nieuw staat het formulier meteen open
function Apparaten({ nieuw = false }) {
  const navigate = useNavigate()
  const { versie } = useContext(AppContext)
  const [zoek, setZoek] = useState('')
  const [archief, setArchief] = useState(false)
  const [formulier, setFormulier] = useState(nieuw)

  // archief en versie zijn de "sleutel": verandert er een, dan wordt opnieuw geladen
  const { data, laden, fout, herlaad } = useApi(
    () =>
      Promise.all([getAssets(archief), getTasks(), getLabels('rooms')]).then(([apparaten, taken, ruimtes]) => ({
        apparaten,
        taken,
        ruimtes,
      })),
    `${archief}-${versie}`,
  )

  const kop = (
    <Kop titel="Apparaten" onder={data && `${data.apparaten.filter((a) => !a.archivedAt).length} apparaten`}>
      <button type="button" className="btn btn--primair alleen-breed" onClick={() => setFormulier(true)}>
        <PlusIcon aria-hidden />
        Apparaat
      </button>
    </Kop>
  )

  const sheet = formulier && (
    <ApparaatSheet
      onOpgeslagen={(a) => navigate(`/apparaten/${a._id}`)}
      onSluit={() => {
        setFormulier(false)
        if (nieuw) navigate('/apparaten', { replace: true })
      }}
    />
  )

  if (laden && !data) return <>{kop}<LijstLaden />{sheet}</>
  if (fout) return <>{kop}<LijstFout melding={fout} opnieuw={herlaad} /></>

  const { apparaten, taken, ruimtes } = data

  // Per apparaat de eerstvolgende taak (taken zijn een aparte collectie, gekoppeld via assetId)
  const volgende = {}
  for (const taak of taken) {
    const huidig = volgende[taak.assetId]
    if (!huidig || new Date(taak.nextDue) < new Date(huidig.nextDue)) volgende[taak.assetId] = taak
  }

  // Filteren in de browser; bij duizenden apparaten zou dit naar de backend gaan
  const tekst = zoek.trim().toLowerCase()
  const gefilterd = apparaten.filter((a) =>
    [a.name, a.brand, a.model, a.category, a.location].some((v) => v?.toLowerCase().includes(tekst)),
  )

  // Groepen in de volgorde van de ruimtelijst (Instellingen); lege ruimtes vallen weg
  const groepen = ruimteNamen(ruimtes, apparaten)
    .map((ruimte) => ({ ruimte, items: gefilterd.filter((a) => zelfdeRuimte(a.location, ruimte)) }))
    .filter((g) => g.items.length > 0)

  let volgnummer = 0

  return (
    <>
      {kop}

      <div className="werkbalk">
        <label className="zoekveld">
          <MagnifyingGlassIcon aria-hidden />
          <input
            type="search"
            className="invoer"
            placeholder="Zoeken"
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            aria-label="Zoeken"
          />
        </label>
        <button type="button" className="keuze" aria-pressed={archief} onClick={() => setArchief(!archief)}>
          Archief
        </button>
      </div>

      {groepen.length === 0 ? (
        <div className="lijst lijst-leeg">
          {tekst ? (
            <>
              <strong>Niets gevonden voor “{zoek.trim()}”</strong>
              Probeer een andere zoekterm.
            </>
          ) : (
            <>
              <strong>Nog geen apparaten</strong>
              Tik op + om je huis door te lopen en apparaten toe te voegen.
            </>
          )}
        </div>
      ) : (
        <div className="lijst">
          {groepen.map(({ ruimte, items }) => (
            <section key={ruimte} className="groep" aria-label={ruimte}>
              <h2 className="groep__kop">
                {ruimte}
                <span className="groep__aantal cijfers">{items.length}</span>
              </h2>
              {items.map((a) => {
                const taak = volgende[a._id]
                const meta = [[a.brand, a.model].filter(Boolean).join(' '), a.category].filter(Boolean)
                return (
                  <div key={a._id} className="rij-wrap" style={{ '--i': Math.min(volgnummer++, 12) }}>
                    <div className="rij-clip">
                      <div className={`rij ${a.archivedAt ? 'rij--uit' : ''}`}>
                        <div className="rij__hoofd">
                          <Link to={`/apparaten/${a._id}`} className="rij__titel rij__link">{a.name}</Link>
                          {meta.length > 0 && <span className="rij__meta">{meta.join(' · ')}</span>}
                        </div>
                        {a.archivedAt ? (
                          <span className="tag">Gearchiveerd</span>
                        ) : taak ? (
                          <span className="rij__volgende">
                            <span className="rij__meta alleen-breed">{taak.title}</span>
                            <span className={`rij__datum cijfers rij__datum--${urgentie(taak.nextDue)}`}>
                              {datumLabel(taak.nextDue)}
                            </span>
                          </span>
                        ) : (
                          <span className="tag tag--amber">Onvolledig</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      )}
      {sheet}
    </>
  )
}

export default Apparaten
