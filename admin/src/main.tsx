import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import App from './pages/App'
import Login from './pages/Login'
import Config from './pages/Config'
import Categories from './pages/Categories'

const Root = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<App />}> 
        <Route index element={<Navigate to="/config" />} />
        <Route path="/config" element={<Config />} />
        <Route path="/categories" element={<Categories />} />
      </Route>
    </Routes>
  </BrowserRouter>
)

createRoot(document.getElementById('root')!).render(<Root />)


