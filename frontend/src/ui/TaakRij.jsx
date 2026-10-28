import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowTopRightOnSquareIcon, CheckCircleIcon, CheckIcon, PencilSquareIcon } from '@heroicons/react/20/solid'
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
// opApparaat: de rij staat op de pagina van het apparaat zelf (geen link, geen "Naar apparaat")
// uit: archief, alleen tonen (geen vinkje of menu)
function TaakRij({ taak, apparaat, onAfvinken, onDetails, index = 0, opApparaat = false, uit = false }) {
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

  // Apparaat iets sterker dan de rest: "welk ding" is belangrijker dan "waar" en "hoe vaak"
  const meta = [apparaat?.location, taak.every && interval(taak.every, taak.unit)].filter(Boolean)

  return (
    <div
      className={`rij-wrap ${fase === 'weg' ? 'rij-wrap--weg' : ''}`}
      style={{ '--i': Math.min(index, 12) }}
    >
      <div className="rij-clip">
        <div className={`rij taakrij taakrij--${niveau}`}>
          <button
            type="button"
            disabled={uit}
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
            {opApparaat ? (
              <span className="rij__titel">{taak.title}</span>
            ) : (
              <Link to={naarApparaat} className="rij__titel rij__link">
                {taak.title}
              </Link>
            )}
            {(apparaat || meta.length > 0) && (
              <span className="rij__meta">
                {apparaat && <span className="rij__meta-sterk">{apparaat.name}</span>}
                {apparaat && meta.length > 0 && ' · '}
                {meta.join(' · ')}
              </span>
            )}
          </div>

          <span className={`rij__datum cijfers rij__datum--${niveau}`} title={formatDatum(taak.nextDue)}>
            {datumLabel(taak.nextDue)}
          </span>

          {!uit && (
            <Popmenu
              label={`Meer acties voor ${taak.title}`}
              items={[
                { label: 'Afronden met details…', icoon: CheckCircleIcon, onKies: () => onDetails(taak) },
                opApparaat
                  ? { label: 'Taak bewerken', icoon: PencilSquareIcon, binnenkort: true }
                  : { label: 'Naar apparaat', icoon: ArrowTopRightOnSquareIcon, onKies: () => navigate(naarApparaat) },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function wacht(ms) {
  return new Promise((klaar) => setTimeout(klaar, ms))
}

export default TaakRij
