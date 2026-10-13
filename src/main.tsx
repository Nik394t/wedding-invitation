import '@fontsource/great-vibes/cyrillic-400.css'
import '@fontsource/great-vibes/latin-400.css'
import '@fontsource/old-standard-tt/cyrillic-400.css'
import '@fontsource/old-standard-tt/cyrillic-400-italic.css'
import '@fontsource/old-standard-tt/cyrillic-700.css'
import '@fontsource/old-standard-tt/latin-400.css'
import '@fontsource/old-standard-tt/latin-400-italic.css'
import '@fontsource/old-standard-tt/latin-700.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
