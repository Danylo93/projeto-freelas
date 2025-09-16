import React, { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'

const App: React.FC = () => {
  const navigate = useNavigate()
  const [token] = useState(() => localStorage.getItem('token'))

  useEffect(() => {
    if (!token) {
      navigate('/login')
    }
  }, [navigate, token])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, Arial' }}>
      <aside style={{ width: 240, background: '#0F172A', color: '#E2E8F0', padding: 16 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>Admin</h2>
        <nav style={{ display: 'grid', gap: 8 }}>
          <Link to="/config" style={{ color: '#93C5FD' }}>Config</Link>
          <Link to="/categories" style={{ color: '#93C5FD' }}>Categorias</Link>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 24, background: '#F8FAFC' }}>
        <Outlet />
      </main>
    </div>
  )
}

export default App


