import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SiteProvider } from './context/SiteContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { FavoriteProvider } from './context/FavoriteContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SiteProvider>
      <AuthProvider>
        <CartProvider>
          <FavoriteProvider>
            <App />
          </FavoriteProvider>
        </CartProvider>
      </AuthProvider>
    </SiteProvider>
  </React.StrictMode>,
)
