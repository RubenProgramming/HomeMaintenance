// Een knop voor functionaliteit die de backend nog niet heeft.
// Zo zie je in de interface al waar het komt, en kun je in de code
// zoeken op "NogNietKlaar" om te zien wat er nog gebouwd moet worden.
function NogNietKlaar({ children, uitleg, klein = false }) {
  return (
    <button
      type="button"
      className={`knop nog-niet ${klein ? 'klein' : ''}`}
      disabled
      title={`Nog niet beschikbaar: ${uitleg}`}
    >
      {children}
      <span className="label-binnenkort">binnenkort</span>
    </button>
  )
}

export default NogNietKlaar
