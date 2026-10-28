import { useEffect, useRef, useState } from 'react'
import { completeTask, undoLog } from '../api'
import { vandaagInput, vanInputDatum } from '../utils/datum'

export const TOAST_DUUR = 5000 // ms dat "Ongedaan maken" zichtbaar blijft

// Taak afvinken met één tik, met 5 seconden de kans om het terug te draaien.
//
// Gebruik:  const { afvinken, bezigMet, melding, ongedaan, sluit } = useAfvinken(herlaad)
// - afvinken(taak, details?): rondt de taak af op vandaag, optioneel met kosten/notitie
// - bezigMet: _id van de taak die nu wordt opgeslagen (om de knop uit te zetten)
// - melding: { tekst, logId?, fout? } voor de <Toast>, of null
export function useAfvinken(herlaad) {
  const [bezigMet, setBezigMet] = useState(null)
  const [melding, setMelding] = useState(null)
  const timer = useRef(null)

  function toon(nieuweMelding) {
    clearTimeout(timer.current)
    setMelding({ ...nieuweMelding, id: Date.now() }) // id: nieuwe melding = timerbalk opnieuw
    timer.current = setTimeout(() => setMelding(null), TOAST_DUUR)
  }

  // Timer opruimen als de pagina verdwijnt
  useEffect(() => () => clearTimeout(timer.current), [])

  // details: optioneel { doneAt, performedBy, cost, notes } ("afronden met details")
  // Geeft true terug als het gelukt is, zodat een rij zijn animatie kan terugdraaien bij een fout.
  async function afvinken(taak, details = {}) {
    setBezigMet(taak._id)
    try {
      const log = await completeTask(taak._id, { doneAt: vanInputDatum(vandaagInput()), ...details })
      toon({ tekst: `Afgerond: ${taak.title}`, logId: log._id })
      herlaad()
      return true
    } catch (err) {
      toon({ tekst: err.message, fout: true })
      return false
    } finally {
      setBezigMet(null)
    }
  }

  async function ongedaan() {
    const logId = melding?.logId
    if (!logId) return
    setMelding(null)
    try {
      await undoLog(logId)
      herlaad()
    } catch (err) {
      toon({ tekst: err.message, fout: true })
    }
  }

  function sluit() {
    clearTimeout(timer.current)
    setMelding(null)
  }

  return { afvinken, bezigMet, melding, ongedaan, sluit }
}
