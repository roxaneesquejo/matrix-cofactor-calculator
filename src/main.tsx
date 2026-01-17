import React from 'react'
import ReactDOM from 'react-dom/client'
import MatrixCalculator from './matrixCalculator'
import './matrixCalculator.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MatrixCalculator />
  </React.StrictMode>,
)