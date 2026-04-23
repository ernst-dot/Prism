import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('prism_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('prism_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  me:       ()      => api.get('/auth/me'),
  logout:   ()      => api.post('/auth/logout'),
}

// ── Tasks ─────────────────────────────────────────────────────
export const tasksAPI = {
  list:    (params) => api.get('/tasks', { params }),
  create:  (data)   => api.post('/tasks', data),
  update:  (id, data) => api.put(`/tasks/${id}`, data),
  patch:   (id, data) => api.patch(`/tasks/${id}`, data),
  delete:  (id)     => api.delete(`/tasks/${id}`),
  reorder: (ids)    => api.patch('/tasks/reorder', { ids }),
}

// ── Habits ────────────────────────────────────────────────────
export const habitsAPI = {
  list:   ()        => api.get('/habits'),
  create: (data)    => api.post('/habits', data),
  toggle: (id, date) => api.post(`/habits/${id}/log`, { date }),
  delete: (id)      => api.delete(`/habits/${id}`),
}

// ── Journals (MongoDB) ────────────────────────────────────────
export const journalsAPI = {
  list:   (params) => api.get('/journals', { params }),
  create: (data)   => api.post('/journals', data),
  get:    (id)     => api.get(`/journals/${id}`),
  update: (id, data) => api.put(`/journals/${id}`, data),
  delete: (id)     => api.delete(`/journals/${id}`),
}

// ── Sleep ─────────────────────────────────────────────────────
export const sleepAPI = {
  list:   ()     => api.get('/sleep'),
  log:    (data) => api.post('/sleep', data),
  delete: (id)   => api.delete(`/sleep/${id}`),
}

// ── Workouts ──────────────────────────────────────────────────
export const workoutsAPI = {
  list:   ()     => api.get('/workouts'),
  log:    (data) => api.post('/workouts', data),
  delete: (id)   => api.delete(`/workouts/${id}`),
}

// ── Books ─────────────────────────────────────────────────────
export const booksAPI = {
  list:   ()        => api.get('/books'),
  create: (data)    => api.post('/books', data),
  update: (id, data) => api.patch(`/books/${id}`, data),
  delete: (id)      => api.delete(`/books/${id}`),
}

// ── XP ────────────────────────────────────────────────────────
export const xpAPI = {
  award:  (amount, reason) => api.post('/xp', { amount, reason }),
  leaderboard: ()          => api.get('/xp/leaderboard'),
}

// ── Messages ──────────────────────────────────────────────────
export const messagesAPI = {
  list:   (roomId) => api.get(`/messages/${roomId}`),
  send:   (roomId, body) => api.post(`/messages/${roomId}`, { body }),
}

// ── Bills ─────────────────────────────────────────────────────
export const billsAPI = {
  list:   ()     => api.get('/bills'),
  create: (data) => api.post('/bills', data),
  delete: (id)   => api.delete(`/bills/${id}`),
}
