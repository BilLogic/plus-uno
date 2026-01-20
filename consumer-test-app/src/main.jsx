import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@tutors.plus/design-system/styles'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
