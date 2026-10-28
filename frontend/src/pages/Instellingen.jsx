import { useContext } from 'react'
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/20/solid'
import { useMelding } from '../hooks/useMelding'
import { ThemaContext } from '../ui/themaContext'
import Kop from '../ui/Kop'
import LabelBeheer from '../ui/LabelBeheer'
import Melding from '../ui/Melding'
import './Instellingen.css'

const THEMAS = [
  { waarde: 'systeem', label: 'Systeem', icoon: ComputerDesktopIcon },
  { waarde: 'licht', label: 'Licht', icoon: SunIcon },
  { waarde: 'donker', label: 'Donker', icoon: MoonIcon },
]

// Instellingen: thema, en de lijsten met ruimtes en categorieën.
// Hernoemen past de apparaten mee aan; verwijderen verplaatst ze eerst.
function Instellingen() {
  const { thema, setThema } = useContext(ThemaContext)
  const { melding, toon, sluit } = useMelding()

  return (
    <>
      <Kop titel="Instellingen" />

      <section className="instelling" aria-labelledby="kop-weergave">
        <div className="instelling__uitleg">
          <h2 id="kop-weergave">Weergave</h2>
          <p>Systeem volgt de instelling van je apparaat.</p>
        </div>
        <div className="segment" role="radiogroup" aria-labelledby="kop-weergave">
          {THEMAS.map(({ waarde, label, icoon: Icoon }) => (
            <button
              key={waarde}
              type="button"
              role="radio"
              aria-checked={thema === waarde}
              className="segment__optie"
              onClick={() => setThema(waarde)}
            >
              <Icoon aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="instelling" aria-labelledby="kop-ruimtes">
        <div className="instelling__uitleg">
          <h2 id="kop-ruimtes">Ruimtes</h2>
          <p>Tik op een naam om hem te hernoemen. Dezelfde naam als een andere ruimte voegt ze samen.</p>
        </div>
        <LabelBeheer soort="rooms" enkelvoud="ruimte" verplaatsenVerplicht toon={toon} />
      </section>

      <section className="instelling" aria-labelledby="kop-categorieen">
        <div className="instelling__uitleg">
          <h2 id="kop-categorieen">Categorieën</h2>
          <p>Optioneel per apparaat, handig om te groeperen en te zoeken.</p>
        </div>
        <LabelBeheer soort="categories" enkelvoud="categorie" verplaatsenVerplicht={false} toon={toon} />
      </section>

      <Melding melding={melding} sluit={sluit} />
    </>
  )
}

export default Instellingen
