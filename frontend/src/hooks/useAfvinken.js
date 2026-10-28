import { completeTask, deleteLog } from '../api'
import { vandaagInput, vanInputDatum } from '../utils/datum'
import { useMelding } from './useMelding'

// Taak afvinken met één tik, met een paar seconden de kans om het terug te draaien.
//
// Gebruik:  const { afvinken, ...melding } = useAfvinken(herlaad)
//           <Melding {...melding} />
// - afvinken(taak, details?): rondt de taak af op vandaag, optioneel met kosten/notitie.
//   Geeft true terug als het gelukt is, zodat een rij zijn animatie kan terugdraaien bij een fout.
// - melding, ongedaan, sluit: voor de <Melding>-component
export function useAfvinken(herlaad) {
  const { melding, toon, sluit } = useMelding()

  // details: optioneel { doneAt, performedBy, cost, notes } ("afronden met details")
  async function afvinken(taak, details = {}) {
    try {
      const log = await completeTask(taak._id, { doneAt: vanInputDatum(vandaagInput()), ...details })
      toon({ tekst: `Afgerond: ${taak.title}`, logId: log._id })
      herlaad()
      return true
    } catch (err) {
      toon({ tekst: err.message, fout: true })
      return false
    }
  }

  async function ongedaan() {
    const logId = melding?.logId
    if (!logId) return
    sluit()
    try {
      await deleteLog(logId)
      herlaad()
    } catch (err) {
      toon({ tekst: err.message, fout: true })
    }
  }

  return { afvinken, melding, ongedaan, sluit }
}
