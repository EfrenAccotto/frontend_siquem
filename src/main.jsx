import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './router/AppRouter'
import { ThemeProvider } from './context/ThemeContext'
import "@/assets/css/index.css"
// El tema se carga dinámicamente desde ThemeContext
// import 'primereact/resources/themes/lara-light-blue/theme.css' 
import 'primereact/resources/primereact.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AppRouter />
    </ThemeProvider>
  </StrictMode>,
)
