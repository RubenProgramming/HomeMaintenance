// Ruimtes: de lijst staat in de backend (GET /rooms) en beheer je via Instellingen.
// Een apparaat verwijst naar zijn ruimte met de naam (asset.location).

// Namen in de volgorde van de lijst, plus eventuele ruimtes die apparaten gebruiken
// maar (nog) niet in de lijst staan, zodat er nooit een apparaat "zoekraakt".
export function ruimteNamen(ruimtes = [], apparaten = []) {
  const namen = ruimtes.map((r) => r.name)
  for (const a of apparaten) {
    if (a.location && !namen.some((n) => zelfdeRuimte(n, a.location))) namen.push(a.location)
  }
  return namen
}

// Hoofdletterongevoelig, net als in de backend: "keuken" en "Keuken" zijn dezelfde ruimte
export function zelfdeRuimte(a, b) {
  return a?.trim().toLowerCase() === b?.trim().toLowerCase()
}
