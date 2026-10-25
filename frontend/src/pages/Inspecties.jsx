import NogNietKlaar from '../components/NogNietKlaar'

// Placeholder: inspectierondes bestaan nog niet in de backend.
// Idee voor later: een collectie "inspections" met per ronde een datum,
// een lijst gecontroleerde apparaten, per apparaat een conditiescore (1-6, NEN 2767),
// gebreken en foto's.
function Inspecties() {
  return (
    <>
      <header className="paginakop">
        <h1>Inspecties</h1>
        <NogNietKlaar uitleg="collectie en endpoints voor inspectierondes">+ Nieuwe inspectieronde</NogNietKlaar>
      </header>

      <section className="kaart">
        <h2>Hoe dit gaat werken</h2>
        <ol className="uitleg-lijst">
          <li>Je start een ronde op je telefoon en loopt het pand door.</li>
          <li>Per apparaat geef je een conditiescore en noteer je gebreken.</li>
          <li>Je maakt foto's van gebreken.</li>
          <li>Een gebrek kan direct een nieuwe taak worden.</li>
        </ol>
        <p className="gedempt klein">
          Hiervoor is in de backend nog nodig: een <code>inspections</code>-collectie, endpoints om een ronde
          aan te maken en bij te werken, en foto-upload.
        </p>
      </section>
    </>
  )
}

export default Inspecties
