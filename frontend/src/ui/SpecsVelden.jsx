import { PlusIcon, XMarkIcon } from '@heroicons/react/20/solid'

// Het vrije "specs"-object van een apparaat bewerken, als lijst met rijen.
// De vertaling object <-> rijen staat in utils/specs.js.
//
// Bewaart zelf geen state: de ouder geeft "rijen" mee en krijgt via onChange
// de nieuwe lijst terug (een "controlled component").
//
// bestaandeVastzetten: de PATCH in de backend doet "specs.voltage = ..." per veld
// (zie routers/assets.py). Toevoegen/wijzigen kan, maar een bestaand veld
// verwijderen of hernoemen nog niet. Die rijen zetten we dus vast.
const UITLEG_VAST = 'Verwijderen of hernoemen kan nog niet (backend mist $unset)'

function SpecsVelden({ rijen, onChange, bestaandeVastzetten = false }) {
  function wijzigRij(index, veld, waarde) {
    onChange(rijen.map((rij, i) => (i === index ? { ...rij, [veld]: waarde } : rij)))
  }

  return (
    <div className="specs">
      {rijen.map((rij, index) => {
        const vast = bestaandeVastzetten && rij.bestaand
        return (
          <div className="specs__rij" key={index}>
            <input
              className="invoer"
              placeholder="Naam, bijv. filtertype"
              aria-label="Naam van de specificatie"
              value={rij.sleutel}
              readOnly={vast}
              title={vast ? UITLEG_VAST : undefined}
              onChange={(e) => wijzigRij(index, 'sleutel', e.target.value)}
            />
            <input
              className="invoer"
              placeholder="Waarde"
              aria-label="Waarde"
              value={rij.waarde}
              onChange={(e) => wijzigRij(index, 'waarde', e.target.value)}
            />
            <button
              type="button"
              className="btn btn--stil btn--icoon"
              onClick={() => onChange(rijen.filter((_, i) => i !== index))}
              disabled={vast}
              aria-label="Specificatie verwijderen"
              title={vast ? UITLEG_VAST : 'Verwijderen'}
            >
              <XMarkIcon aria-hidden />
            </button>
          </div>
        )
      })}
      <button type="button" className="btn btn--stil specs__toevoegen" onClick={() => onChange([...rijen, { sleutel: '', waarde: '' }])}>
        <PlusIcon aria-hidden />
        Specificatie toevoegen
      </button>
    </div>
  )
}

export default SpecsVelden
