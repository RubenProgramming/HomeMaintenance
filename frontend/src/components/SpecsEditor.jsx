// Bewerken van het vrije "specs"-object van een apparaat, als lijst met rijen.
// De vertaling object <-> rijen staat in utils/specs.js.

// Dit component bewaart zelf geen state: de ouder geeft "rijen" mee
// en krijgt via onChange de nieuwe lijst terug. Dat heet een "controlled component".
//
// bestaandeVastzetten: de PATCH in de backend doet "specs.voltage = ..." per veld
// (zie routers/assets.py). Daardoor kun je wel velden toevoegen/wijzigen, maar een
// bestaand veld verwijderen of hernoemen kan nog niet. Die rijen zetten we dus vast.
const UITLEG_VAST = 'Nog niet beschikbaar: backend kan specs-velden nog niet verwijderen ($unset)'

function SpecsEditor({ rijen, onChange, bestaandeVastzetten = false }) {
  function wijzigRij(index, veld, waarde) {
    const nieuw = rijen.map((rij, i) => (i === index ? { ...rij, [veld]: waarde } : rij))
    onChange(nieuw)
  }

  function verwijderRij(index) {
    onChange(rijen.filter((_, i) => i !== index))
  }

  return (
    <div className="specs-editor">
      {rijen.map((rij, index) => {
        const vast = bestaandeVastzetten && rij.bestaand
        return (
          <div className="specs-rij" key={index}>
            <input
              placeholder="naam (bijv. voltage)"
              value={rij.sleutel}
              readOnly={vast}
              title={vast ? UITLEG_VAST : undefined}
              onChange={(e) => wijzigRij(index, 'sleutel', e.target.value)}
            />
            <input
              placeholder="waarde"
              value={rij.waarde}
              onChange={(e) => wijzigRij(index, 'waarde', e.target.value)}
            />
            <button
              type="button"
              className="knop klein"
              onClick={() => verwijderRij(index)}
              disabled={vast}
              title={vast ? UITLEG_VAST : 'Verwijder'}
            >
              ✕
            </button>
          </div>
        )
      })}
      <button
        type="button"
        className="knop klein"
        onClick={() => onChange([...rijen, { sleutel: '', waarde: '' }])}
      >
        + Spec toevoegen
      </button>
    </div>
  )
}

export default SpecsEditor
