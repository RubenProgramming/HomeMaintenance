import { useEffect, useRef, useState } from 'react'
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid'
import './Popmenu.css'

// Klein menu achter een ⋯-knop.
// items: [{ label, icoon?, onKies?, binnenkort? }]
// Sluit bij een klik ernaast of met Escape.
function Popmenu({ label = 'Meer acties', items }) {
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

  return (
    <div className="popmenu" ref={ref}>
      <button
        type="button"
        className="btn btn--stil btn--icoon popmenu__knop"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <EllipsisHorizontalIcon aria-hidden />
      </button>
      {open && (
        <div className="popmenu__lijst" role="menu">
          {items.map(({ label: tekst, icoon: Icoon, onKies, binnenkort }) => (
            <button
              key={tekst}
              type="button"
              role="menuitem"
              className="popmenu__item"
              disabled={binnenkort}
              onClick={() => {
                setOpen(false)
                onKies?.()
              }}
            >
              {Icoon && <Icoon aria-hidden />}
              <span>{tekst}</span>
              {binnenkort && <span className="binnenkort">Binnenkort</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Popmenu
