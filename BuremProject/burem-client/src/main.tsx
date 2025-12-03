import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// Router'ı buradan çağırıyoruz (ÖNEMLİ)
import { BrowserRouter } from 'react-router-dom'
// Varsa CSS importlarınız (örn: 'antd/dist/reset.css' veya './index.css')
// import './index.css' 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
   
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <App />
  </BrowserRouter>
    
  </React.StrictMode>,
)