import React, { useEffect, useState } from 'react'
import axios from 'axios'

const gateway = 'https://b34b1c97cd37.ngrok-free.app'

interface Category {
  id: string
  name: string
  base_price: number
  description: string
}

const CategoriesPage: React.FC = () => {
  const [list, setList] = useState<Category[]>([])
  const [form, setForm] = useState<Category>({ id: '', name: '', base_price: 0, description: '' })
  const token = localStorage.getItem('token')

  const load = async () => {
    const res = await axios.get(`${gateway}/api/admin/categories`, { headers: { Authorization: `Bearer ${token}` }})
    setList(res.data)
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.id || !form.name) return alert('Preencha id e nome')
    await axios.post(`${gateway}/api/admin/categories`, form, { headers: { Authorization: `Bearer ${token}` }})
    setForm({ id: '', name: '', base_price: 0, description: '' })
    await load()
  }

  const remove = async (id: string) => {
    await axios.delete(`${gateway}/api/admin/categories/${id}`, { headers: { Authorization: `Bearer ${token}` }})
    await load()
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Categorias</h1>
      <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        <input placeholder='id' value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}/>
        <input placeholder='nome' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}/>
        <input type='number' placeholder='preço base' value={form.base_price} onChange={e => setForm({ ...form, base_price: Number(e.target.value) })} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}/>
        <input placeholder='descrição' value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}/>
        <button onClick={save} style={{ padding: 12, background: '#2563EB', color: '#fff', border: 0, borderRadius: 10 }}>Salvar</button>
      </div>
      <table style={{ width: '100%', background: '#fff', borderRadius: 12, borderCollapse: 'collapse', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#F1F5F9' }}>
            <th style={{ textAlign: 'left', padding: 10 }}>ID</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Nome</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Preço base</th>
            <th style={{ textAlign: 'left', padding: 10 }}>Descrição</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map((c) => (
            <tr key={c.id}>
              <td style={{ padding: 10 }}>{c.id}</td>
              <td style={{ padding: 10 }}>{c.name}</td>
              <td style={{ padding: 10 }}>R$ {c.base_price.toFixed(2)}</td>
              <td style={{ padding: 10 }}>{c.description}</td>
              <td style={{ padding: 10 }}>
                <button onClick={() => remove(c.id)} style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 0, borderRadius: 8 }}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CategoriesPage


