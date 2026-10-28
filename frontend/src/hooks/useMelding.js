import { useEffect, useRef, useState } from 'react'

export const MELDING_DUUR = 5000 // ms dat een melding (en "Ongedaan maken") zichtbaar blijft

// Korte melding onderin, voor de <Melding>-component.
//
// Gebruik:  const { melding, toon, sluit } = useMelding()
//           toon({ tekst: 'Opgeslagen' })            gewone melding
//           toon({ tekst: err.message, fout: true })  foutmelding
//           toon({ tekst: 'Afgerond', logId })        met "Ongedaan maken" (zie useAfvinken)
export function useMelding() {
  const [melding, setMelding] = useState(null)
  const timer = useRef(null)

  function toon(nieuweMelding) {
    clearTimeout(timer.current)
    setMelding({ ...nieuweMelding, id: Date.now() }) // id: nieuwe melding = timerbalk opnieuw
    timer.current = setTimeout(() => setMelding(null), MELDING_DUUR)
  }

  function sluit() {
    clearTimeout(timer.current)
    setMelding(null)
  }

  // Timer opruimen als de pagina verdwijnt
  useEffect(() => () => clearTimeout(timer.current), [])

  return { melding, toon, sluit }
}
