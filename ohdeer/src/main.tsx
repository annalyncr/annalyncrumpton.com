// The starting point: finds <div id="root"> in index.html and draws <App /> in it.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/tokens.css' // design tokens first, so index.css can use them
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
