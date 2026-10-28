import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource-variable/inter'
import './index.css' // oude stijl: verdwijnt zodra alle schermen zijn omgebouwd
import './ui/tokens.css'
import './ui/basis.css'
import App from './App.jsx'

// BrowserRouter laat React de URL in de adresbalk lezen en veranderen,
// zonder dat de pagina opnieuw van de server geladen wordt.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
