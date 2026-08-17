import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { applySafariClass } from '@/lib/safari'
import '@/styles/globals.css'
import App from './App.tsx'

applySafariClass()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
