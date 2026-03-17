import React from 'react'
import ReactDOM from 'react-dom/client'
import FunnelCalculator from './FunnelCalculator'

// Підключаємо стилі з файлу index.css
import './index.css' 

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <FunnelCalculator />
  </React.StrictMode>,
)
