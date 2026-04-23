import { create } from 'zustand'
import { tasksAPI } from '../services/api'
import toast from 'react-hot-toast'

export const useTaskStore = create((set, get) => ({
  tasks:   [],
  loading: false,
  filter:  'all',
  search:  '',

  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),

  fetch: async (params = {}) => {
    set({ loading: true })
    try {
      const res = await tasksAPI.list({ filter: get().filter, q: get().search, ...params })
      set({ tasks: res.data })
    } catch (e) {
      toast.error('Could not load tasks')
    } finally {
      set({ loading: false })
    }
  },

  add: async (data) => {
    const res = await tasksAPI.create(data)
    await get().fetch()
    toast.success('Task added!')
    return res.data
  },

  toggle: async (id) => {
    // Optimistic update
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }))
    try {
      await tasksAPI.toggle(id)
      await get().fetch()
    } catch {
      // Revert
      set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) }))
      toast.error('Could not update task')
    }
  },

  update: async (id, data) => {
    await tasksAPI.update(id, data)
    await get().fetch()
  },

  remove: async (id) => {
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))
    try {
      await tasksAPI.delete(id)
      toast.success('Task deleted')
    } catch {
      await get().fetch()
      toast.error('Could not delete task')
    }
  },

  // Derived
  active:  () => get().tasks.filter(t => !t.done),
  done:    () => get().tasks.filter(t => t.done),
  overdue: () => get().tasks.filter(t => !t.done && t.due_date && new Date(t.due_date) < new Date()),
}))
