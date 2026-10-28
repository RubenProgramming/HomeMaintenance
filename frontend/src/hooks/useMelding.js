import { useEffect, useRef, useState } from 'react'

export const MELDING_DUUR = 5000 // ms dat een melding (en "Ongedaan maken") zichtbaar blijft

// Korte melding onderin, voor de <Melding>-component.
//
// Gebruik:  const { melding, toon, sluit, ongedaan } = useMelding()
//           toon({ tekst: 'Opgeslagen' })              gewone melding
//           toon({ tekst: err.message, fout: true })    foutmelding
//           toon({ tekst: 'Verwijderd', ongedaan: fn })  met "Ongedaan maken"
//
// ongedaan: een (async) functie die de actie terugdraait, bijv. de logregel weghalen
// (zie useAfvinken) of een taak terugzetten (zie useTaakActies). De melding "weet" zelf
// hoe hij ongedaan gemaakt wordt, zodat dezelfde <Melding> voor elke actie werkt.
// De functie ongedaan() hieronder voert hem uit voor de knop in <Melding>.
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

  // "Ongedaan maken": eerst de melding weg (geen dubbele klik), dan terugdraaien.
  // Mislukt het, dan komt er een foutmelding voor in de plaats.
  async function ongedaan() {
    const terugdraaien = melding?.ongedaan
    if (!terugdraaien) return
    sluit()
    try {
      await terugdraaien()
    } catch (err) {
      toon({ tekst: err.message, fout: true })
    }
  }

  // Timer opruimen als de pagina verdwijnt
  useEffect(() => () => clearTimeout(timer.current), [])

  return { melding, toon, sluit, ongedaan }
}
