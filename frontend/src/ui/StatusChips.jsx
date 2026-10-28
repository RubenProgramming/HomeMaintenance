import './StatusChips.css'

// Rij compacte status-chips onder de paginatitel: "● 2 Te laat  ● 3 Deze week".
// Een tik scrollt naar de groep met hetzelfde id (zie GroepKop).
// items: [{ sleutel, titel, toon, icoon, aantal }]
function StatusChips({ items }) {
  function naar(sleutel) {
    document.getElementById(`groep-${sleutel}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="chips">
      {items.map(({ sleutel, titel, toon, icoon: Icoon, aantal }) => (
        <button key={sleutel} type="button" className={`chip ${toon ? `chip--${toon}` : ''}`} onClick={() => naar(sleutel)}>
          <Icoon aria-hidden />
          <strong className="cijfers">{aantal}</strong>
          {titel}
        </button>
      ))}
    </div>
  )
}

export default StatusChips
