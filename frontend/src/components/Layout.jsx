import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../context/authStore'
import {
  CheckSquare, BookOpen, Flame, Moon, Dumbbell,
  Library, BarChart2, LayoutDashboard, LogOut, Sparkles
} from 'lucide-react'

const NAV = [
  { to: '/tasks',    icon: CheckSquare,   label: 'Tasks'    },
  { to: '/habits',   icon: Flame,         label: 'Habits'   },
  { to: '/journal',  icon: BookOpen,      label: 'Journal'  },
  { to: '/sleep',    icon: Moon,          label: 'Sleep'    },
  { to: '/workout',  icon: Dumbbell,      label: 'Workout'  },
  { to: '/books',    icon: Library,       label: 'Reading'  },
  { to: '/insights', icon: Sparkles,      label: 'Insights' },
  { to: '/dashboard',icon: LayoutDashboard,label: 'Dashboard'},
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)', color:'var(--text)' }}>

      {/* ── Sidebar ───────────────────────────── */}
      <aside style={{
        width: 220, flexShrink: 0, background:'var(--surface)',
        borderRight:'0.5px solid var(--border)', display:'flex',
        flexDirection:'column', padding:'0 0 16px',
        position:'sticky', top:0, height:'100vh',
      }}>
        {/* Logo */}
        <div style={{ padding:'20px 20px 16px', borderBottom:'0.5px solid var(--border)' }}>
          <div style={{ fontSize:20, fontWeight:700, background:'linear-gradient(135deg,#8b5cf6,#3b82f6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            ◈ Prism
          </div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:2 }}>task manager</div>
        </div>

        {/* Nav links */}
        <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10,
              padding:'9px 12px', borderRadius:10,
              fontSize:14, fontWeight:500, textDecoration:'none',
              color: isActive ? '#8b5cf6' : 'var(--text)',
              background: isActive ? 'rgba(139,92,246,.1)' : 'transparent',
              transition:'all .15s',
            })}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div style={{ padding:'12px 14px', borderTop:'0.5px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{
              width:32, height:32, borderRadius:'50%',
              background:'linear-gradient(135deg,#8b5cf6,#3b82f6)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:13, fontWeight:700, color:'#fff', flexShrink:0,
            }}>
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {user?.username}
              </div>
              <div style={{ fontSize:11, color:'var(--muted)' }}>Level {user?.level || 1}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display:'flex', alignItems:'center', gap:8,
            width:'100%', padding:'8px 12px', borderRadius:8,
            border:'none', background:'transparent', cursor:'pointer',
            fontSize:13, color:'var(--muted)',
          }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────── */}
      <main style={{ flex:1, padding:'24px 28px', maxWidth:860, overflowY:'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}
