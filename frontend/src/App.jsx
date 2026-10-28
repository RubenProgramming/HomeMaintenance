import { Route, Routes } from 'react-router'
import AppShell from './ui/AppShell'
import Overzicht from './pages/Overzicht'
import Apparaten from './pages/Apparaten'
import ApparaatNieuw from './pages/ApparaatNieuw'
import ApparaatDetail from './pages/ApparaatDetail'
import Taken from './pages/Taken'
import Rondgang from './pages/Rondgang'

// De "routekaart" van de app: welke URL toont welke pagina.
// Alle routes staan binnen <AppShell>, dus de navigatie is overal zichtbaar.
// :id is een variabel stuk van de URL, uit te lezen met useParams().
function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Overzicht />} />
        <Route path="/apparaten" element={<Apparaten />} />
        <Route path="/apparaten/nieuw" element={<ApparaatNieuw />} />
        <Route path="/apparaten/:id" element={<ApparaatDetail />} />
        <Route path="/taken" element={<Taken />} />
        <Route path="/rondgang" element={<Rondgang />} />
        <Route path="*" element={<p>Pagina niet gevonden.</p>} />
      </Route>
    </Routes>
  )
}

export default App
