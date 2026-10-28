import { useEffect, useRef, useState } from 'react'
import { NoSymbolIcon } from '@heroicons/react/24/outline'
import { CATEGORIE_ICONEN } from './categorieIconen'
import ApparaatTegel from './ApparaatTegel'
import './IcoonKiezer.css'

// De tegel van een categorie als knop; klikken opent een rooster met iconen.
// onKies(sleutel | null): null = geen icoon (dan de eerste letter)
function IcoonKiezer({ icoon, naam, onKies }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function buiten(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    function toets(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', buiten)
    document.addEventListener('keydown', toets)
    return () => {
      document.removeEventListener('pointerdown', buiten)
      document.removeEventListener('keydown', toets)
    }
  }, [open])

  function kies(sleutel) {
    setOpen(false)
    if (sleutel !== icoon) onKies(sleutel)
  }

  return (
    <div className="icoonkiezer" ref={ref}>
      <button
        type="button"
        className="icoonkiezer__knop"
        onClick={() => setOpen(!open)}
        aria-label={`Icoon voor ${naam} kiezen`}
        aria-expanded={open}
      >
        <ApparaatTegel icoon={icoon} categorie={naam} />
      </button>
      {open && (
        <div className="icoonkiezer__rooster" role="listbox" aria-label="Iconen">
          {Object.entries(CATEGORIE_ICONEN).map(([sleutel, { icoon: Icoon, label }]) => (
            <button
              key={sleutel}
              type="button"
              role="option"
              aria-selected={sleutel === icoon}
              className="icoonkiezer__optie"
              onClick={() => kies(sleutel)}
              title={label}
              aria-label={label}
            >
              <Icoon aria-hidden />
            </button>
          ))}
          <button
            type="button"
            role="option"
            aria-selected={!icoon}
            className="icoonkiezer__optie"
            onClick={() => kies(null)}
            title="Geen icoon (eerste letter)"
            aria-label="Geen icoon"
          >
            <NoSymbolIcon aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}

export default IcoonKiezer
