import React, { useState } from 'react'
import axios from 'axios'

const gateway = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8015'

const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.post(`${gateway}/api/auth/login`, { email, password })
      const token = res.data?.access_token
      localStorage.setItem('token', token)
      window.location.href = '/'
    } catch (e) {
      alert('Falha no login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <form onSubmit={handleLogin} style={{ width: 320, background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,.05)' }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Entrar</h1>
        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}/>
        <label>Senha</label>
        <input type='password' value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 16, borderRadius: 8, border: '1px solid #e5e7eb' }}/>
        <button disabled={loading} style={{ width: '100%', padding: 12, background: '#2563EB', color: '#fff', border: 0, borderRadius: 10 }}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </div>
  )
}

export default Login


