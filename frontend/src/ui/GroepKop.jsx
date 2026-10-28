import './Lijst.css'

// Kop boven een groep rijen: icoon, titel, aantal (als badge) en eventueel tekst rechts.
// toon: '' | 'rood' | 'amber' | 'info' (zie status.js). Bij een toon kleuren icoon en badge mee.
// id: om er vanaf de status-chips naartoe te kunnen scrollen.
function GroepKop({ id, icoon: Icoon, titel, aantal, toon = '', rechts }) {
  return (
    <h2 id={id} className={`groep__kop ${toon ? `groep__kop--${toon}` : ''}`}>
      {Icoon && <Icoon className="groep__icoon" aria-hidden />}
      {titel}
      {aantal !== undefined && <span className="groep__aantal cijfers">{aantal}</span>}
      {rechts && <span className="groep__rechts">{rechts}</span>}
    </h2>
  )
}

export default GroepKop
