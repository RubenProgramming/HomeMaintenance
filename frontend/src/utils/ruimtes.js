// De ruimtes in huis. "location" is in de backend gewoon tekst; hier maken we er
// een vaste lijst van, aangevuld met elke ruimte die je zelf al eens gebruikt hebt.
// Een nieuwe ruimte "bestaat" dus zodra er een apparaat in staat.

export const STANDAARD_RUIMTES = [
  'Keuken',
  'Woonkamer',
  'Badkamer',
  'Toilet',
  'Slaapkamer',
  'Hal',
  'Zolder',
  'Kelder',
  'Berging',
  'Meterkast',
  'Tuin',
  'Dak & gevel',
]

// Standaardlijst + eigen ruimtes uit bestaande apparaten, zonder dubbele
// (hoofdletterongevoelig: "keuken" en "Keuken" zijn dezelfde ruimte).
export function alleRuimtes(apparaten = []) {
  const gezien = new Map(STANDAARD_RUIMTES.map((r) => [r.toLowerCase(), r]))
  for (const a of apparaten) {
    const naam = a.location?.trim()
    if (naam && !gezien.has(naam.toLowerCase())) gezien.set(naam.toLowerCase(), naam)
  }
  return [...gezien.values()]
}

export function zelfdeRuimte(a, b) {
  return a?.trim().toLowerCase() === b?.trim().toLowerCase()
}
