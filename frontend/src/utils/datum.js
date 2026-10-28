// Hulpfuncties voor datums.
// De backend (MongoDB) bewaart datums als UTC en stuurt ze als tekst:
//   "2026-01-13T00:00:00Z"
// Een <input type="date"> werkt juist met "2026-01-13". Deze functies vertalen heen en weer.

const DAG = 24 * 60 * 60 * 1000

export function formatDatum(iso) {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// "2026-01-13T00:00:00Z" -> "2026-01-13" (voor in een datumveld)
export function naarInputDatum(iso) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

// "2026-01-13" -> "2026-01-13T00:00:00Z" (om naar de backend te sturen)
export function vanInputDatum(waarde) {
  if (!waarde) return null
  return `${waarde}T00:00:00Z`
}

export function vandaagInput() {
  return new Date().toISOString().slice(0, 10)
}

// Datumveld-waarde verschuiven: verschuif("2026-01-31", { maanden: 1 }) -> "2026-02-28".
// Rekent in UTC (net als vandaagInput), zodat zomertijd er niet tussen komt.
// Bij maanden: bestaat de dag niet (31 feb), dan de laatste dag van die maand,
// zoals relativedelta in de backend (helpers.bereken_volgende) ook doet.
export function verschuif(waarde, { dagen = 0, maanden = 0 } = {}) {
  const [jaar, maand, dag] = waarde.split('-').map(Number)
  const laatsteDag = new Date(Date.UTC(jaar, maand - 1 + maanden + 1, 0)).getUTCDate()
  const datum = new Date(Date.UTC(jaar, maand - 1 + maanden, Math.min(dag, laatsteDag) + dagen))
  return datum.toISOString().slice(0, 10)
}

// Hoeveel dagen tot de datum? Negatief = te laat.
export function dagenTot(iso) {
  if (!iso) return null
  const vandaag = new Date()
  vandaag.setHours(0, 0, 0, 0)
  const doel = new Date(iso)
  doel.setHours(0, 0, 0, 0)
  return Math.round((doel - vandaag) / DAG)
}

// Zet een taak in een "bakje" voor het overzicht
export function urgentie(iso) {
  const dagen = dagenTot(iso)
  if (dagen === null) return 'onbekend'
  if (dagen < 0) return 'telaat'
  if (dagen <= 7) return 'week'
  if (dagen <= 31) return 'maand'
  return 'later'
}

export function relatief(iso) {
  const dagen = dagenTot(iso)
  if (dagen === null) return 'geen datum'
  if (dagen === 0) return 'vandaag'
  if (dagen === 1) return 'morgen'
  if (dagen === -1) return 'gisteren'
  if (dagen < 0) return `${-dagen} dagen te laat`
  return `over ${dagen} dagen`
}

const EENHEDEN = {
  days: ['dag', 'dagen'],
  weeks: ['week', 'weken'],
  months: ['maand', 'maanden'],
  years: ['jaar', 'jaar'],
}

// every: 3, unit: "months" -> "elke 3 maanden"
export function interval(every, unit) {
  const [enkel, meervoud] = EENHEDEN[unit] ?? [unit, unit]
  if (every !== 1) return `elke ${every} ${meervoud}`
  return unit === 'years' ? 'elk jaar' : `elke ${enkel}` // "het jaar" -> "elk"
}

const WEEKDAG = new Intl.DateTimeFormat('nl-NL', { weekday: 'long' })
const KORT = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' })
const KORT_JAAR = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

// Zo kort mogelijk, maar zonder rekenwerk voor de lezer:
// "3 dagen te laat", "Vandaag", "Morgen", "vrijdag", "25 dec", "3 feb 2027"
export function datumLabel(iso) {
  const dagen = dagenTot(iso)
  if (dagen === null) return 'Geen datum'
  if (dagen < 0) return `${-dagen} ${dagen === -1 ? 'dag' : 'dagen'} te laat`
  if (dagen === 0) return 'Vandaag'
  if (dagen === 1) return 'Morgen'
  const datum = new Date(iso)
  if (dagen < 7) return WEEKDAG.format(datum)
  return (datum.getFullYear() === new Date().getFullYear() ? KORT : KORT_JAAR).format(datum)
}
