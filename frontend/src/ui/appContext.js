import { createContext } from 'react'

// Gedeeld door AppShell met alle pagina's:
// - versie: telt op als er ergens iets is toegevoegd (bijv. via de rondgang-sheet).
//   Pagina's geven hem mee als sleutel aan useApi, dan laden ze vanzelf opnieuw.
// - ververs(): versie ophogen
// - openRondgang(): de sheet "Apparaten toevoegen" openen (de "+" knoppen)
export const AppContext = createContext({ versie: 0, ververs: () => {}, openRondgang: () => {} })
