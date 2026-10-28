import { useState } from 'react'
import { archiveTask, restoreTask, updateTask } from '../api'
import { formatDatum, vanInputDatum } from '../utils/datum'
import { useAfvinken } from './useAfvinken'

// Alles wat je met een taak in een lijst kunt doen, op één plek.
// Overzicht, Taken en de apparaatpagina gebruiken allemaal TaakRij; zonder deze hook
// zou elke pagina dezelfde sheets, handlers en melding opnieuw moeten bouwen.
//
// Gebruik:  const { acties, panelen } = useTaakActies(herlaad)
//           <TaakRij taak={taak} acties={acties} />
//           <TaakPanelen {...panelen} />       (de sheets en de melding onderin)
//
// acties (voor TaakRij):
// - afvinken(taak): één tik klaar (useAfvinken), geeft true/false terug
// - details(taak): sheet "Afronden" met datum, kosten en notitie
// - uitstellen(taak): sheet "Uitstellen"
// - bewerken(taak, apparaat?): sheet "Taak bewerken"
// - verwijderen(taak): archiveert direct, met "Ongedaan maken" in de melding
// Alles roept na afloop herlaad() aan, zodat de pagina de nieuwe stand toont.
export function useTaakActies(herlaad) {
  const { afvinken, toon, ...melding } = useAfvinken(herlaad)
  // Welke sheet is open? { soort: 'afronden' | 'uitstellen' | 'bewerken', taak, apparaat? }
  const [open, setOpen] = useState(null)

  // datum: "2026-01-13" uit UitstelSheet. Geeft true/false terug, net als afvinken.
  async function uitstellen(taak, datum) {
    try {
      const vorige = taak.nextDue
      const nieuw = vanInputDatum(datum)
      await updateTask(taak._id, { nextDue: nieuw })
      toon({
        tekst: `Uitgesteld tot ${formatDatum(nieuw)}: ${taak.title}`,
        // Terugdraaien = de oude datum terugzetten (zonder datum valt er niets terug te zetten)
        ongedaan: vorige
          ? async () => {
              await updateTask(taak._id, { nextDue: vorige })
              herlaad()
            }
          : undefined,
      })
      herlaad()
      return true
    } catch (err) {
      toon({ tekst: err.message, fout: true })
      return false
    }
  }

  // Geen "Weet je het zeker?": verwijderen is archiveren, dus "Ongedaan maken" zet hem terug
  async function verwijderen(taak) {
    try {
      await archiveTask(taak._id)
      toon({
        tekst: `Verwijderd: ${taak.title}`,
        ongedaan: async () => {
          await restoreTask(taak._id)
          herlaad()
        },
      })
      herlaad()
      return true
    } catch (err) {
      toon({ tekst: err.message, fout: true })
      return false
    }
  }

  const acties = {
    afvinken,
    details: (taak) => setOpen({ soort: 'afronden', taak }),
    uitstellen: (taak) => setOpen({ soort: 'uitstellen', taak }),
    bewerken: (taak, apparaat) => setOpen({ soort: 'bewerken', taak, apparaat }),
    verwijderen,
  }

  // Alles wat <TaakPanelen> nodig heeft om de juiste sheet en de melding te tonen
  const panelen = {
    open,
    sluitPaneel: () => setOpen(null),
    afvinken,
    uitstellen,
    opgeslagen: () => {
      toon({ tekst: 'Taak opgeslagen' })
      herlaad()
    },
    melding,
  }

  return { acties, panelen }
}
