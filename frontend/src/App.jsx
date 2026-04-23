import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './context/authStore'
import Layout      from './components/Layout'
import LoginPage   from './pages/LoginPage'
import Dashboard   from './pages/Dashboard'
import TasksPage   from './pages/TasksPage'
import JournalPage from './pages/JournalPage'
import HabitsPage  from './pages/HabitsPage'
import SleepPage   from './pages/SleepPage'
import WorkoutPage from './pages/WorkoutPage'
import BooksPage   from './pages/BooksPage'
import InsightsPage from './pages/InsightsPage'

function RequireAuth({ children }) {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn())
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={
        <RequireAuth><Layout /></RequireAuth>
      }>
        <Route index          element={<Navigate to="/tasks" replace />} />
        <Route path="tasks"   element={<TasksPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="habits"  element={<HabitsPage />} />
        <Route path="sleep"   element={<SleepPage />} />
        <Route path="workout" element={<WorkoutPage />} />
        <Route path="books"   element={<BooksPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  )
}
