import AfrondenSheet from './AfrondenSheet'
import Melding from './Melding'
import TaakSheet from './TaakSheet'
import UitstelSheet from './UitstelSheet'

// De sheets achter het ⋯-menu van een TaakRij, plus de melding onderin.
// Alle props komen uit useTaakActies:  <TaakPanelen {...panelen} />
// Er is steeds hooguit één sheet open (open.soort zegt welke).
function TaakPanelen({ open, sluitPaneel, afvinken, uitstellen, opgeslagen, melding }) {
  return (
    <>
      {open?.soort === 'afronden' && <AfrondenSheet taak={open.taak} onAfvinken={afvinken} onSluit={sluitPaneel} />}
      {open?.soort === 'uitstellen' && (
        <UitstelSheet taak={open.taak} onUitstellen={uitstellen} onSluit={sluitPaneel} />
      )}
      {open?.soort === 'bewerken' && (
        <TaakSheet taak={open.taak} apparaat={open.apparaat} onOpgeslagen={opgeslagen} onSluit={sluitPaneel} />
      )}
      <Melding {...melding} />
    </>
  )
}

export default TaakPanelen
