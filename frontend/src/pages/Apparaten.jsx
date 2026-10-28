import { useState } from 'react'
import { Link } from 'react-router'
import { getAssets, getTasks } from '../api'
import { useApi } from '../hooks/useApi'
import { formatDatum, relatief, urgentie } from '../utils/datum'
import { Fout, Laden, Leeg } from '../components/Status'

function Apparaten() {
  const [zoek, setZoek] = useState('')
  const [categorie, setCategorie] = useState('')
  const [toonArchief, setToonArchief] = useState(false)

  // toonArchief is de "sleutel": als je het vinkje aanzet, wordt opnieuw geladen
  const { data, laden, fout, herlaad } = useApi(
    () => Promise.all([getAssets(toonArchief), getTasks()]).then(([apparaten, taken]) => ({ apparaten, taken })),
    toonArchief,
  )

  if (laden && !data) return <Laden />
  if (fout) return <Fout melding={fout} opnieuw={herlaad} />

  const { apparaten, taken } = data

  // Per apparaat: de eerstvolgende taak (taken zijn een aparte collectie,
  // die koppelen we hier via assetId — net als een foreign key in SQL)
  const volgendeTaak = {}
  for (const taak of taken) {
    const huidig = volgendeTaak[taak.assetId]
    if (!huidig || new Date(taak.nextDue) < new Date(huidig.nextDue)) {
      volgendeTaak[taak.assetId] = taak
    }
  }

  const categorieen = [...new Set(apparaten.map((a) => a.category).filter(Boolean))].sort()

  // Filteren gebeurt hier in de browser. Bij duizenden apparaten zou je dit
  // naar de backend verplaatsen (een query met $regex of een text index).
  const tekst = zoek.toLowerCase()
  const gefilterd = apparaten.filter(
    (a) =>
      (!categorie || a.category === categorie) &&
      [a.name, a.location, a.brand, a.model].some((v) => v?.toLowerCase().includes(tekst)),
  )

  return (
    <>
      <header className="paginakop">
        <h1>Apparaten</h1>
        <div className="knoppenrij">
          <Link to="/apparaten/nieuw" className="knop alleen-desktop">Uitgebreid formulier</Link>
          <Link to="/rondgang" className="knop primair alleen-desktop">+ Apparaten toevoegen</Link>
        </div>
      </header>

      <div className="filterbalk">
        <input
          type="search"
          placeholder="Zoek op naam, locatie, merk…"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
        />
        <select value={categorie} onChange={(e) => setCategorie(e.target.value)}>
          <option value="">Alle categorieën</option>
          {categorieen.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="vinkje">
          <input type="checkbox" checked={toonArchief} onChange={(e) => setToonArchief(e.target.checked)} />
          Toon gearchiveerd
        </label>
      </div>

      {gefilterd.length === 0 ? (
        <Leeg>Geen apparaten gevonden.</Leeg>
      ) : (
        <div className="apparaten-raster">
          {gefilterd.map((a) => {
            const taak = volgendeTaak[a._id]
            return (
              <Link
                to={`/apparaten/${a._id}`}
                key={a._id}
                className={`apparaatkaart ${a.archivedAt ? 'gearchiveerd' : ''}`}
              >
                <div className="apparaatkaart-kop">
                  {a.category && <span className="chip">{a.category}</span>}
                  {a.archivedAt && <span className="chip">gearchiveerd</span>}
                </div>
                <h3>{a.name}</h3>
                <p className="klein gedempt">
                  {a.location}
                  {a.brand && ` · ${a.brand}`}
                  {a.model && ` ${a.model}`}
                </p>
                <p className="klein gedempt">Geplaatst: {formatDatum(a.installedAt)}</p>
                <div className="apparaatkaart-voet">
                  {taak ? (
                    <>
                      <span className="klein">{taak.title}</span>
                      <span className={`badge ${urgentie(taak.nextDue)}`}>{relatief(taak.nextDue)}</span>
                    </>
                  ) : a.archivedAt ? (
                    <span className="klein gedempt">Geen taken</span>
                  ) : (
                    <>
                      <span className="klein gedempt">Nog geen onderhoudstaak</span>
                      <span className="badge onvolledig">onvolledig</span>
                    </>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}

export default Apparaten
