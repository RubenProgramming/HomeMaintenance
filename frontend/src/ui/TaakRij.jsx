import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowTopRightOnSquareIcon, CheckIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
import { datumLabel, formatDatum, interval, urgentie } from '../utils/datum'
import Popmenu from './Popmenu'
import './Lijst.css'

const TIJD_VINK = 280 // ms: vinkje vult zich
const TIJD_WEG = 260 // ms: rij klapt dicht (gelijk aan Lijst.css)

function minderBeweging() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// Eén taak als rij.
// - links het rondje: tik = klaar. Eerst animatie, dan pas het verzoek, zodat de rij
//   niet halverwege verdwijnt. Mislukt het, dan komt de rij gewoon terug.
// - de titel is een link naar het apparaat (de hele rij is klikbaar)
// - ⋯-menu: afronden met details, of naar het apparaat
//
// Props: taak, apparaat?, onAfvinken(taak) → Promise<boolean>, onDetails(taak), index (voor de inloop-animatie)
function TaakRij({ taak, apparaat, onAfvinken, onDetails, index = 0 }) {
  const [fase, setFase] = useState('rust') // rust → aan → weg
  const navigate = useNavigate()
  const niveau = urgentie(taak.nextDue)
  const naarApparaat = `/apparaten/${taak.assetId}`

  async function vink() {
    if (fase !== 'rust') return
    const snel = minderBeweging()
    setFase('aan')
    await wacht(snel ? 0 : TIJD_VINK)
    setFase('weg')
    await wacht(snel ? 0 : TIJD_WEG)
    const gelukt = await onAfvinken(taak)
    if (!gelukt) setFase('rust')
  }

  const meta = [apparaat?.name, apparaat?.location, taak.every && interval(taak.every, taak.unit)].filter(Boolean)

  return (
    <div
      className={`rij-wrap ${fase === 'weg' ? 'rij-wrap--weg' : ''}`}
      style={{ '--i': Math.min(index, 12) }}
    >
      <div className="rij-clip">
        <div className="rij taakrij">
          <button
            type="button"
            className={`vinkje ${fase !== 'rust' ? 'vinkje--aan' : ''}`}
            onClick={vink}
            aria-label={`${taak.title} afronden`}
            aria-pressed={fase !== 'rust'}
          >
            <span className="vinkje__rondje">
              <CheckIcon aria-hidden />
            </span>
          </button>

          <div className="rij__hoofd">
            <Link to={naarApparaat} className="rij__titel rij__link">
              {taak.title}
            </Link>
            {meta.length > 0 && <span className="rij__meta">{meta.join(' · ')}</span>}
          </div>

          <span className={`rij__datum cijfers rij__datum--${niveau}`} title={formatDatum(taak.nextDue)}>
            {datumLabel(taak.nextDue)}
          </span>

          <Popmenu
            label={`Meer acties voor ${taak.title}`}
            items={[
              { label: 'Afronden met details…', icoon: PencilSquareIcon, onKies: () => onDetails(taak) },
              { label: 'Naar apparaat', icoon: ArrowTopRightOnSquareIcon, onKies: () => navigate(naarApparaat) },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function wacht(ms) {
  return new Promise((klaar) => setTimeout(klaar, ms))
}

export default TaakRij
