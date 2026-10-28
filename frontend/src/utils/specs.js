// Het vrije "specs"-object van een apparaat.
//
// Dit is precies waarom MongoDB hier goed past: een CV-ketel heeft andere
// specs dan een rookmelder. In de database is specs gewoon een object:
//   { "voltage": "220-240", "hertz": 50 }
// In het formulier is een lijst met rijen makkelijker: [{ sleutel, waarde }, ...]
// specsNaarRijen en rijenNaarSpecs vertalen tussen die twee vormen.

export function specsNaarRijen(specs = {}) {
  return Object.entries(specs).map(([sleutel, waarde]) => ({
    sleutel,
    waarde: waarde === null ? '' : String(waarde),
    bestaand: true, // komt al uit de database
  }))
}

export function rijenNaarSpecs(rijen) {
  const specs = {}
  for (const { sleutel, waarde } of rijen) {
    const naam = sleutel.trim()
    if (!naam) continue
    // "50" wordt het getal 50, zodat je later in Mongo op getallen kunt zoeken
    const isGetal = /^-?\d+(\.\d+)?$/.test(waarde.trim())
    specs[naam] = isGetal ? Number(waarde) : waarde
  }
  return specs
}
