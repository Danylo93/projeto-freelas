import React, { useEffect, useState } from 'react'
import axios from 'axios'

const gateway =  'https://eedfd16e8f89.ngrok-free.app'

interface Config {
  platform_fee_percent: number
  surge_enabled: boolean
  surge_multiplier: number
}

const ConfigPage: React.FC = () => {
  const [cfg, setCfg] = useState<Config>({ platform_fee_percent: 10, surge_enabled: false, surge_multiplier: 1 })
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${gateway}/api/admin/config`, { headers: { Authorization: `Bearer ${token}` }})
        setCfg(res.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const save = async () => {
    try {
      await axios.put(`${gateway}/api/admin/config`, cfg, { headers: { Authorization: `Bearer ${token}` }})
      alert('Configurações salvas!')
    } catch (e) {
      alert('Erro ao salvar')
    }
  }

  if (loading) return <p>Carregando...</p>
  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Configurações</h1>
      <label>Taxa da plataforma (%)</label>
      <input type='number' value={cfg.platform_fee_percent} onChange={e => setCfg({ ...cfg, platform_fee_percent: Number(e.target.value) })} style={{ width: '100%', padding: 10, marginBottom: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}/>
      <label>Surge habilitado</label>
      <input type='checkbox' checked={cfg.surge_enabled} onChange={e => setCfg({ ...cfg, surge_enabled: e.target.checked })} style={{ marginBottom: 12 }}/>
      <label>Multiplicador de surge</label>
      <input type='number' step='0.1' value={cfg.surge_multiplier} onChange={e => setCfg({ ...cfg, surge_multiplier: Number(e.target.value) })} style={{ width: '100%', padding: 10, marginBottom: 20, borderRadius: 8, border: '1px solid #e5e7eb' }}/>
      <button onClick={save} style={{ padding: 12, background: '#2563EB', color: '#fff', border: 0, borderRadius: 10 }}>Salvar</button>
    </div>
  )
}

export default ConfigPage


