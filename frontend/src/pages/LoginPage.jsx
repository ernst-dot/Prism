import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [tab, setTab]     = useState('login')
  const [form, setForm]   = useState({ username:'', email:'', login:'', password:'' })
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuthStore()
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(form.login, form.password)
      } else {
        await register(form.username, form.email, form.password)
      }
      navigate('/tasks')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width:'100%', padding:'11px 14px', borderRadius:10, border:'0.5px solid #333',
    background:'rgba(255,255,255,.06)', color:'#fff', fontSize:14,
    outline:'none', fontFamily:'inherit', boxSizing:'border-box',
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0d1117,#1a1f35,#0d1117)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:380, background:'rgba(255,255,255,.05)', border:'0.5px solid rgba(255,255,255,.1)', borderRadius:20, padding:'36px 32px', backdropFilter:'blur(20px)' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>◈</div>
          <h1 style={{ fontSize:24, fontWeight:700, color:'#fff', margin:0, background:'linear-gradient(135deg,#8b5cf6,#3b82f6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Prism
          </h1>
          <p style={{ color:'#888', fontSize:13, margin:'4px 0 0' }}>Your AI-powered task manager</p>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', background:'rgba(255,255,255,.05)', borderRadius:10, marginBottom:24, overflow:'hidden', border:'0.5px solid rgba(255,255,255,.08)' }}>
          {['login','register'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, padding:'9px', border:'none', cursor:'pointer',
              fontSize:13, fontFamily:'inherit', fontWeight:500,
              background: tab===t ? 'rgba(255,255,255,.12)' : 'transparent',
              color: tab===t ? '#fff' : '#888',
            }}>
              {t === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {tab === 'register' && (
            <>
              <input style={inp} placeholder="Username" value={form.username}
                onChange={e => set('username', e.target.value)} />
              <input style={inp} placeholder="Email" type="email" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </>
          )}
          {tab === 'login' && (
            <input style={inp} placeholder="Username or email" value={form.login}
              onChange={e => set('login', e.target.value)} />
          )}
          <input style={inp} placeholder="Password" type="password" value={form.password}
            onChange={e => set('password', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} />

          <button onClick={submit} disabled={loading} style={{
            width:'100%', padding:'12px', borderRadius:12, border:'none',
            background:'linear-gradient(135deg,#8b5cf6,#3b82f6)',
            color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer',
            opacity: loading ? .7 : 1, fontFamily:'inherit', marginTop:4,
          }}>
            {loading ? '…' : tab === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  )
}
