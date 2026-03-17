import React from 'react'
import ReactDOM from 'react-dom/client'
import FunnelCalculator from './FunnelCalculator'

// Якщо у вас є файл із загальними стилями (наприклад, index.css), 
// розкоментуйте наступний рядок:
// import './index.css' 

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <FunnelCalculator />
  </React.StrictMode>,
)
