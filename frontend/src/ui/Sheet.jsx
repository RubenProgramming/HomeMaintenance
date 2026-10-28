import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'
import './Sheet.css'

const SLUIT_DUUR = 200 // ms, gelijk aan de uit-animatie in Sheet.css

// Formulierlaag: op desktop een paneel dat van rechts inschuift,
// op mobiel een sheet die van onderen omhoog komt.
// - titel, onSluit: verplicht
// - vol: op mobiel bijna schermvullend (voor langere sessies, zoals de rondgang)
// - voet: knoppen onderin (blijven staan als de inhoud scrolt)
// - focusVeld: eerste veld focussen bij openen (uit als er eerst iets te kiezen is)
// - children: inhoud, of een functie ({ sluit }) => inhoud, om na opslaan netjes te sluiten
function Sheet({ titel, onSluit, vol = false, focusVeld = true, voet, children }) {
  const [sluitend, setSluitend] = useState(false)
  const paneel = useRef(null)

  // Eerst de uit-animatie, dan pas echt weg
  function sluit() {
    setSluitend(true)
    setTimeout(onSluit, SLUIT_DUUR)
  }
  const sluitRef = useRef(sluit)
  useEffect(() => {
    sluitRef.current = sluit
  })

  useEffect(() => {
    function toets(e) {
      if (e.key === 'Escape') sluitRef.current()
    }
    document.addEventListener('keydown', toets)
    // Pagina erachter niet laten scrollen
    const vorige = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Focus naar het eerste veld (of het paneel zelf)
    const eerste = focusVeld ? paneel.current?.querySelector('input, select, textarea') : null
    ;(eerste ?? paneel.current)?.focus()
    return () => {
      document.removeEventListener('keydown', toets)
      document.body.style.overflow = vorige
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- alleen bij openen
  }, [])

  return createPortal(
    <div className={`sheet ${sluitend ? 'sheet--sluitend' : ''}`}>
      <div className="sheet__achtergrond" onClick={sluit} />
      <section
        ref={paneel}
        className={`sheet__paneel ${vol ? 'sheet__paneel--vol' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={titel}
        tabIndex={-1}
      >
        <span className="sheet__greep" aria-hidden />
        <header className="sheet__kop">
          <h2>{titel}</h2>
          <button type="button" className="btn btn--stil btn--icoon" onClick={sluit} aria-label="Sluiten">
            <XMarkIcon aria-hidden />
          </button>
        </header>
        <div className="sheet__inhoud">{typeof children === 'function' ? children({ sluit }) : children}</div>
        {voet && <footer className="sheet__voet">{typeof voet === 'function' ? voet({ sluit }) : voet}</footer>}
      </section>
    </div>,
    document.body,
  )
}

export default Sheet
