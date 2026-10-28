import { useEffect, useState } from 'react'

// Thema-keuze: 'systeem' (volgt je apparaat), 'licht' of 'donker'.
// De keuze staat in localStorage en wordt als data-theme op <html> gezet;
// tokens.css doet de rest. index.html zet hem al vóór React start, tegen flitsen.
const SLEUTEL = 'thema'
export const VOLGORDE = ['systeem', 'licht', 'donker']

function leesKeuze() {
  try {
    const waarde = localStorage.getItem(SLEUTEL)
    return VOLGORDE.includes(waarde) ? waarde : 'systeem'
  } catch {
    return 'systeem' // bijv. privévenster waarin localStorage niet mag
  }
}

function pasToe(keuze) {
  const html = document.documentElement
  if (keuze === 'systeem') delete html.dataset.theme
  else html.dataset.theme = keuze === 'licht' ? 'light' : 'dark'
}

export function useThema() {
  const [thema, setThema] = useState(leesKeuze)

  useEffect(() => {
    pasToe(thema)
    try {
      localStorage.setItem(SLEUTEL, thema)
    } catch {
      // niet erg: dan geldt de keuze alleen voor deze sessie
    }
  }, [thema])

  // Systeem → Licht → Donker → Systeem
  function volgende() {
    setThema((huidig) => VOLGORDE[(VOLGORDE.indexOf(huidig) + 1) % VOLGORDE.length])
  }

  return { thema, volgende }
}
