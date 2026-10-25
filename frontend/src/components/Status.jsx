// Kleine componenten voor de toestanden die elke pagina heeft.

export function Laden() {
  return <p className="status">Laden…</p>
}

export function Fout({ melding, opnieuw }) {
  return (
    <div className="status fout">
      <p>Er ging iets mis: {melding}</p>
      <p className="klein">Draait de backend? (docker compose up -d)</p>
      {opnieuw && (
        <button className="knop" onClick={opnieuw}>
          Opnieuw proberen
        </button>
      )}
    </div>
  )
}

export function Leeg({ children }) {
  return <p className="status leeg">{children}</p>
}
