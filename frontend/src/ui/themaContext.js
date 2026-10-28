import { createContext } from 'react'

// De thema-state woont in AppShell (via useThema) en wordt hiermee gedeeld,
// zodat Instellingen de keuze kan lezen en wijzigen.
export const ThemaContext = createContext({ thema: 'systeem', setThema: () => {} })
