import { Link, Route, Routes } from 'react-router'
import AppShell from './ui/AppShell'
import Kop from './ui/Kop'
import Overzicht from './pages/Overzicht'
import Apparaten from './pages/Apparaten'
import ApparaatDetail from './pages/ApparaatDetail'
import Taken from './pages/Taken'
import Instellingen from './pages/Instellingen'

// De "routekaart" van de app: welke URL toont welke pagina.
// Alle routes staan binnen <AppShell>, dus de navigatie is overal zichtbaar.
// :id is een variabel stuk van de URL, uit te lezen met useParams().
// Toevoegen (de "+") is geen pagina maar een sheet; die opent AppShell zelf.
function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Overzicht />} />
        <Route path="/apparaten" element={<Apparaten />} />
        {/* key: een andere key = nieuw component, zodat het formulier ook opent als je al op /apparaten was */}
        <Route path="/apparaten/nieuw" element={<Apparaten key="nieuw" nieuw />} />
        <Route path="/apparaten/:id" element={<ApparaatDetail />} />
        <Route path="/taken" element={<Taken />} />
        <Route path="/instellingen" element={<Instellingen />} />
        <Route
          path="*"
          element={
            <>
              <Kop titel="Pagina niet gevonden" />
              <Link to="/">Naar het overzicht</Link>
            </>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
