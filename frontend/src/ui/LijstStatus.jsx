import './Lijst.css'

// Wat een lijst toont terwijl hij laadt of als het misgaat.

// Grijze balkjes in de vorm van rijen (een "skelet"), zodat de pagina niet verspringt
export function LijstLaden({ rijen = 4 }) {
  const breedtes = [70, 55, 62, 48, 66, 52]
  return (
    <div className="lijst" aria-busy="true" aria-label="Laden">
      {Array.from({ length: rijen }, (_, i) => (
        <div key={i} className="rij">
          <div className="skelet" style={{ width: 18, height: 18, borderRadius: '50%' }} />
          <div className="skelet" style={{ width: `${breedtes[i % breedtes.length]}%`, height: 12 }} />
        </div>
      ))}
    </div>
  )
}

export function LijstFout({ melding, opnieuw }) {
  return (
    <div className="lijst lijst-leeg" role="alert">
      <strong>Kan de gegevens niet laden</strong>
      <span>{melding}. Draait de backend? (docker compose up -d)</span>
      {opnieuw && (
        <div>
          <button type="button" className="btn lijst-leeg__knop" onClick={opnieuw}>
            Opnieuw proberen
          </button>
        </div>
      )}
    </div>
  )
}
