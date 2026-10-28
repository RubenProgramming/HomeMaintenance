import { useContext } from 'react'
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { ThemaContext } from './themaContext'

const WEERGAVE = {
  systeem: { icoon: ComputerDesktopIcon, label: 'Thema: systeem' },
  licht: { icoon: SunIcon, label: 'Thema: licht' },
  donker: { icoon: MoonIcon, label: 'Thema: donker' },
}

// metLabel: tekst naast het icoon (uitgeklapte zijbalk)
function ThemaKnop({ className = '', metLabel = false }) {
  const { thema, volgende } = useContext(ThemaContext)
  const { icoon: Icoon, label } = WEERGAVE[thema]

  return (
    <button
      type="button"
      className={className}
      onClick={volgende}
      aria-label={`${label}. Klik om te wisselen.`}
      data-tip={label}
    >
      <Icoon aria-hidden />
      {metLabel && <span>{label}</span>}
    </button>
  )
}

export default ThemaKnop
