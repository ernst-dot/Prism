import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { AuthProvider, useAuth } from './context/AuthContext'
import { TasksProvider }         from './context/TasksContext'

import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TasksPage    from './pages/TasksPage'
import JournalPage  from './pages/JournalPage'
import HabitsPage   from './pages/HabitsPage'
import SleepPage    from './pages/SleepPage'
import WorkoutPage  from './pages/WorkoutPage'
import BooksPage    from './pages/BooksPage'
import ProfilePage  from './pages/ProfilePage'
import Layout       from './components/Layout'

const qc = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/" element={
        <PrivateRoute>
          <TasksProvider>
            <Layout />
          </TasksProvider>
        </PrivateRoute>
      }>
        <Route index           element={<DashboardPage />} />
        <Route path="tasks"    element={<TasksPage />} />
        <Route path="journal"  element={<JournalPage />} />
        <Route path="habits"   element={<HabitsPage />} />
        <Route path="sleep"    element={<SleepPage />} />
        <Route path="workout"  element={<WorkoutPage />} />
        <Route path="books"    element={<BooksPage />} />
        <Route path="profile"  element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="bottom-center" toastOptions={{
            style: { background: '#1a1a1a', color: '#fff', borderRadius: 12 }
          }} />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
