import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { DecisionsProvider } from './hooks/useDecisions'
import { ThemeProvider } from './hooks/useTheme'
import { registerServiceWorker } from './lib/pwa'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <DecisionsProvider>
          <App />
        </DecisionsProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>,
)

registerServiceWorker()
