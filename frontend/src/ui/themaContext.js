import { createContext } from 'react'

// De thema-state woont in AppShell (via useThema) en wordt hiermee gedeeld,
// zodat de knop in de zijbalk en die in de paginakop (mobiel) gelijk lopen.
export const ThemaContext = createContext({ thema: 'systeem', volgende: () => {} })
