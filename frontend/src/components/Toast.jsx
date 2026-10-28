// Korte melding onderin het scherm, bijv. "Afgerond — Ongedaan maken".
// Werkt samen met useAfvinken: geef melding, ongedaan en sluit door.
function Toast({ melding, ongedaan, sluit }) {
  if (!melding) return null
  return (
    <div className={`toast ${melding.fout ? 'fout' : ''}`} role="status">
      <span>{melding.tekst}</span>
      {melding.logId && (
        <button className="toast-actie" onClick={ongedaan}>
          Ongedaan maken
        </button>
      )}
      <button className="toast-sluit" onClick={sluit} aria-label="Sluiten">
        ×
      </button>
    </div>
  )
}

export default Toast
