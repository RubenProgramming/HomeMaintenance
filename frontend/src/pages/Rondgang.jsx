import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { createAsset, getAssets, getTasks } from '../api'
import { useApi } from '../hooks/useApi'
import { alleRuimtes, zelfdeRuimte } from '../utils/ruimtes'
import { Fout, Laden, Leeg } from '../components/Status'

// "Ronde door het huis": met je telefoon kamer voor kamer apparaten toevoegen.
// Stap 1: kies de ruimte waar je staat. Stap 2: tik namen in, één voor één.
// Alleen naam + ruimte; merk, specs en taken vul je later aan op de apparaatpagina.
//
// De gekozen ruimte staat in de URL (?ruimte=Keuken), zodat "terug" en verversen gewoon werken.
function Rondgang() {
  const [params, setParams] = useSearchParams()
  const ruimte = params.get('ruimte')

  const { data, laden, fout, herlaad } = useApi(() =>
    Promise.all([getAssets(), getTasks()]).then(([apparaten, taken]) => ({ apparaten, taken })),
  )

  if (laden && !data) return <Laden />
  if (fout) return <Fout melding={fout} opnieuw={herlaad} />

  const { apparaten, taken } = data

  if (!ruimte) {
    return <RuimteKiezen apparaten={apparaten} onKies={(r) => setParams({ ruimte: r })} />
  }

  return (
    <InRuimte
      ruimte={ruimte}
      // Nieuwste bovenaan, zodat je op je telefoon ziet dat het toevoegen gelukt is
      apparaten={apparaten.filter((a) => zelfdeRuimte(a.location, ruimte)).reverse()}
      metTaak={new Set(taken.map((t) => t.assetId))}
      onToegevoegd={herlaad}
      onTerug={() => setParams({})}
    />
  )
}

function RuimteKiezen({ apparaten, onKies }) {
  const [eigen, setEigen] = useState('')

  function telIn(ruimte) {
    return apparaten.filter((a) => zelfdeRuimte(a.location, ruimte)).length
  }

  return (
    <>
      <header className="paginakop">
        <div>
          <h1>Ronde door het huis</h1>
          <p className="gedempt">In welke ruimte sta je?</p>
        </div>
        <Link to="/apparaten/nieuw" className="knop alleen-desktop">Uitgebreid formulier</Link>
      </header>

      <div className="ruimte-raster">
        {alleRuimtes(apparaten).map((r) => {
          const aantal = telIn(r)
          return (
            <button key={r} className="ruimte-knop" onClick={() => onKies(r)}>
              <span>{r}</span>
              <span className="klein gedempt">{aantal === 0 ? 'leeg' : `${aantal} apparaat${aantal === 1 ? '' : 'en'}`}</span>
            </button>
          )
        })}
      </div>

      <form
        className="eigen-ruimte"
        onSubmit={(e) => {
          e.preventDefault()
          if (eigen.trim()) onKies(eigen.trim())
        }}
      >
        <input value={eigen} onChange={(e) => setEigen(e.target.value)} placeholder="Andere ruimte, bijv. Garage" />
        <button type="submit" className="knop" disabled={!eigen.trim()}>Kies</button>
      </form>
    </>
  )
}

function InRuimte({ ruimte, apparaten, metTaak, onToegevoegd, onTerug }) {
  const [naam, setNaam] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const invoer = useRef(null)

  async function toevoegen(e) {
    e.preventDefault()
    if (!naam.trim()) return
    setBezig(true)
    setFout(null)
    try {
      await createAsset({ name: naam.trim(), location: ruimte })
      setNaam('')
      onToegevoegd()
    } catch (err) {
      setFout(err.message)
    } finally {
      setBezig(false)
      // Toetsenbord open houden voor het volgende apparaat
      invoer.current?.focus()
    }
  }

  return (
    <>
      <header className="paginakop">
        <div>
          <button className="link-knop klein" onClick={onTerug}>← Andere ruimte</button>
          <h1>{ruimte}</h1>
        </div>
      </header>

      <form className="kaart snel-invoer" onSubmit={toevoegen}>
        <label htmlFor="snel-naam">Welk apparaat zie je?</label>
        <div className="snel-invoer-rij">
          <input
            id="snel-naam"
            ref={invoer}
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Bijv. Vaatwasser"
            autoFocus
            autoComplete="off"
            enterKeyHint="send"
          />
          <button type="submit" className="knop primair" disabled={bezig || !naam.trim()}>
            {bezig ? '…' : 'Toevoegen'}
          </button>
        </div>
        {fout && <p className="foutmelding">{fout}</p>}
        <p className="klein gedempt">Merk, foto's en onderhoudstaken voeg je later toe.</p>
      </form>

      <section className="kaart">
        <h2>
          In {ruimte.toLowerCase()} <span className="gedempt">({apparaten.length})</span>
        </h2>
        {apparaten.length === 0 ? (
          <Leeg>Nog niets toegevoegd in deze ruimte.</Leeg>
        ) : (
          <ul className="onvolledig-lijst">
            {apparaten.map((a) => (
              <li key={a._id}>
                <Link to={`/apparaten/${a._id}`}>
                  <span>{a.name}</span>
                  {metTaak.has(a._id) ? (
                    <span className="klein gedempt">✓ heeft taken</span>
                  ) : (
                    <span className="badge onvolledig">onvolledig</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="knoppenrij">
        <button className="knop" onClick={onTerug}>Klaar met {ruimte.toLowerCase()}</button>
      </div>
    </>
  )
}

export default Rondgang
