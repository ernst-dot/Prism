import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('prism_token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})

api.interceptors.response.use(
  res => res,
  err => Promise.reject(err)
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/me'),
}

export const tasksAPI = {
  list: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch('/tasks/' + id, data),
  toggle: (id) => api.patch('/tasks/' + id + '/toggle'),
  delete: (id) => api.delete('/tasks/' + id),
}

export const insightsAPI = {
  weekly: () => api.get('/insights'),
}

export default api
