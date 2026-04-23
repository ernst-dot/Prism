import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  CheckSquare, LayoutDashboard, BookOpen, Flame,
  Moon, Dumbbell, BookMarked, User, LogOut
} from 'lucide-react'

const NAV = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks',   icon: CheckSquare,     label: 'Tasks'     },
  { to: '/journal', icon: BookOpen,        label: 'Journal'   },
  { to: '/habits',  icon: Flame,           label: 'Habits'    },
  { to: '/sleep',   icon: Moon,            label: 'Sleep'     },
  { to: '/workout', icon: Dumbbell,        label: 'Workout'   },
  { to: '/books',   icon: BookMarked,      label: 'Reading'   },
  { to: '/profile', icon: User,            label: 'Profile'   },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* ── Sidebar ── */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-800">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            ◈ Prism
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{user?.username}</p>
        </div>

        {/* XP bar */}
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Level {user?.level ?? 1}</span>
            <span>{user?.xp ?? 0} XP</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, ((user?.xp ?? 0) % 100))}%` }}
            />
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                 ${isActive
                   ? 'bg-purple-600/20 text-purple-300 font-medium'
                   : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-2 py-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-500
                       hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
