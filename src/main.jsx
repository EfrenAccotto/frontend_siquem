import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './router/AppRouter'
import "@/assets/css/index.css"
import 'primereact/resources/themes/lara-light-blue/theme.css' 
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'                                 
import 'primeflex/primeflex.css';                             

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>,
)
