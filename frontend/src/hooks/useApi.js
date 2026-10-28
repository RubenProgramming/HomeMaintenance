import { useEffect, useRef, useState } from 'react'

// Een eigen "hook": herbruikbare logica voor data ophalen.
// Elke pagina heeft dezelfde drie toestanden nodig: laden, fout, of data.
// In plaats van dat overal opnieuw te schrijven, staat het hier één keer.
//
// Gebruik:  const { data, laden, fout, herlaad } = useApi(() => getAsset(id), id)
//
// - laadFunctie: een functie die een Promise teruggeeft (uit api.js)
// - sleutel: als deze waarde verandert, wordt opnieuw geladen (bijv. het id uit de URL)
// - herlaad(): handmatig opnieuw ophalen, bijvoorbeeld na het opslaan
export function useApi(laadFunctie, sleutel = null) {
  const [data, setData] = useState(null)
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState(null)
  const [versie, setVersie] = useState(0) // +1 = "haal opnieuw op"

  // De nieuwste laadFunctie bewaren zonder dat het effect daardoor steeds opnieuw draait
  const laadRef = useRef(laadFunctie)
  useEffect(() => {
    laadRef.current = laadFunctie
  })

  useEffect(() => {
    // "actief" voorkomt dat een oud, traag antwoord een nieuwer antwoord overschrijft
    // (bijv. als je snel van apparaat A naar B klikt)
    let actief = true
    laadRef.current()
      .then((resultaat) => {
        if (!actief) return
        setData(resultaat)
        setFout(null)
      })
      .catch((err) => {
        if (actief) setFout(err.message)
      })
      .finally(() => {
        if (actief) setLaden(false)
      })
    // Deze "cleanup" draait als de sleutel verandert of de pagina verdwijnt
    return () => {
      actief = false
    }
  }, [sleutel, versie])

  function herlaad() {
    setLaden(true)
    setVersie((v) => v + 1)
  }

  return { data, laden, fout, herlaad }
}
