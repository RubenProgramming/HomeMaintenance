import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowsRightLeftIcon } from '@heroicons/react/20/solid'
import { createAsset, getAssets, getLabels, getTasks } from '../api'
import { useApi } from '../hooks/useApi'
import { ruimteNamen, zelfdeRuimte } from '../utils/ruimtes'
import Sheet from './Sheet'
import './Formulier.css'
import './Lijst.css'
import './Rondgang.css'

// "Apparaten toevoegen" als ronde door het huis: kies de ruimte waar je staat,
// tik namen in, één voor één. Alleen naam + ruimte; de rest vul je later aan.
// Op mobiel bijna schermvullend (vol), want je loopt er even mee rond.
function RondgangSheet({ onSluit }) {
  const navigate = useNavigate()
  const [ruimte, setRuimte] = useState(null)
  const { data, herlaad } = useApi(() =>
    Promise.all([getAssets(), getTasks(), getLabels('rooms')]).then(([apparaten, taken, ruimtes]) => ({
      apparaten,
      taken,
      ruimtes,
    })),
  )
  const apparaten = data?.apparaten ?? []
  const metTaak = new Set((data?.taken ?? []).map((t) => t.assetId))

  return (
    <Sheet
      titel="Apparaten toevoegen"
      onSluit={onSluit}
      vol
      focusVeld={false}
      voet={({ sluit }) =>
        ruimte ? (
          <button type="button" className="btn btn--primair" onClick={sluit}>Klaar</button>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={() => {
              sluit()
              navigate('/apparaten/nieuw')
            }}
          >
            Uitgebreid formulier
          </button>
        )
      }
    >
      {ruimte ? (
        <InRuimte
          ruimte={ruimte}
          apparaten={apparaten.filter((a) => zelfdeRuimte(a.location, ruimte)).reverse()}
          metTaak={metTaak}
          onToegevoegd={herlaad}
          onWissel={() => setRuimte(null)}
        />
      ) : (
        <RuimteKiezen apparaten={apparaten} ruimtes={data?.ruimtes ?? []} onKies={setRuimte} />
      )}
    </Sheet>
  )
}

function RuimteKiezen({ apparaten, ruimtes, onKies }) {
  const [eigen, setEigen] = useState('')

  return (
    <div className="rondgang">
      <p className="rondgang__vraag">In welke ruimte sta je?</p>
      <div className="ruimtes">
        {ruimteNamen(ruimtes, apparaten).map((r) => {
          const aantal = apparaten.filter((a) => zelfdeRuimte(a.location, r)).length
          return (
            <button key={r} type="button" className="ruimte" onClick={() => onKies(r)}>
              <span className="ruimte__naam">{r}</span>
              <span className="ruimte__aantal cijfers">{aantal || '–'}</span>
            </button>
          )
        })}
      </div>
      <form
        className="rondgang__invoer"
        onSubmit={(e) => {
          e.preventDefault()
          if (eigen.trim()) onKies(eigen.trim())
        }}
      >
        <input
          className="invoer"
          value={eigen}
          onChange={(e) => setEigen(e.target.value)}
          placeholder="Andere ruimte, bijv. Garage"
          aria-label="Andere ruimte"
        />
        <button type="submit" className="btn" disabled={!eigen.trim()}>Kies</button>
      </form>
    </div>
  )
}

function InRuimte({ ruimte, apparaten, metTaak, onToegevoegd, onWissel }) {
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
      invoer.current?.focus() // toetsenbord open houden voor het volgende apparaat
    }
  }

  return (
    <div className="rondgang">
      <div className="rondgang__ruimte">
        <h3>{ruimte}</h3>
        <button type="button" className="btn btn--stil" onClick={onWissel}>
          <ArrowsRightLeftIcon aria-hidden />
          Andere ruimte
        </button>
      </div>

      <form className="rondgang__invoer" onSubmit={toevoegen}>
        <input
          ref={invoer}
          className="invoer"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder="Welk apparaat zie je?"
          aria-label="Naam van het apparaat"
          autoFocus
          autoComplete="off"
          enterKeyHint="send"
        />
        <button type="submit" className="btn btn--primair" disabled={bezig || !naam.trim()}>
          Toevoegen
        </button>
      </form>
      {fout && <p className="formfout">{fout}</p>}

      {apparaten.length === 0 ? (
        <p className="rondgang__hint">Nog niets in deze ruimte. Merk, specificaties en taken vul je later aan.</p>
      ) : (
        <div className="lijst">
          {apparaten.map((a, i) => (
            <div key={a._id} className="rij-wrap" style={{ '--i': Math.min(i, 12) }}>
              <div className="rij-clip">
                <div className="rij">
                  <div className="rij__hoofd">
                    <span className="rij__titel">{a.name}</span>
                  </div>
                  {metTaak.has(a._id) ? (
                    <span className="rij__datum">Heeft taken</span>
                  ) : (
                    <span className="tag tag--amber">Onvolledig</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RondgangSheet
