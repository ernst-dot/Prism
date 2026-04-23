import { createContext, useContext, useReducer, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksAPI } from '../api'
import toast from 'react-hot-toast'

const TasksContext = createContext(null)

export function TasksProvider({ children }) {
  const qc = useQueryClient()

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksAPI.list().then(r => r.data),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tasks'] })

  // ── Create ──────────────────────────────────────────────────
  const createTask = useMutation({
    mutationFn: tasksAPI.create,
    onSuccess: () => { invalidate(); toast.success('Task added!') },
    onError:   () => toast.error('Failed to add task'),
  })

  // ── Toggle done ─────────────────────────────────────────────
  const toggleTask = useMutation({
    mutationFn: ({ id, done }) => tasksAPI.patch(id, { done }),
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const prev = qc.getQueryData(['tasks'])
      qc.setQueryData(['tasks'], old =>
        old.map(t => t.id === id ? { ...t, done } : t)
      )
      return { prev }
    },
    onError: (_, __, ctx) => qc.setQueryData(['tasks'], ctx.prev),
    onSettled: invalidate,
  })

  // ── Update ──────────────────────────────────────────────────
  const updateTask = useMutation({
    mutationFn: ({ id, ...data }) => tasksAPI.update(id, data),
    onSuccess: () => { invalidate(); toast.success('Task updated') },
  })

  // ── Delete ──────────────────────────────────────────────────
  const deleteTask = useMutation({
    mutationFn: tasksAPI.delete,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tasks'] })
      const prev = qc.getQueryData(['tasks'])
      qc.setQueryData(['tasks'], old => old.filter(t => t.id !== id))
      return { prev }
    },
    onError: (_, __, ctx) => qc.setQueryData(['tasks'], ctx.prev),
    onSettled: invalidate,
  })

  // ── Reorder ─────────────────────────────────────────────────
  const reorderTasks = useMutation({
    mutationFn: (ids) => tasksAPI.reorder(ids),
    onMutate: async (ids) => {
      const prev = qc.getQueryData(['tasks'])
      const map  = Object.fromEntries(prev.map(t => [t.id, t]))
      qc.setQueryData(['tasks'], ids.map(id => map[id]).filter(Boolean))
      return { prev }
    },
    onError: (_, __, ctx) => qc.setQueryData(['tasks'], ctx.prev),
  })

  return (
    <TasksContext.Provider value={{
      tasks, isLoading,
      createTask: createTask.mutate,
      toggleTask:  toggleTask.mutate,
      updateTask:  updateTask.mutate,
      deleteTask:  deleteTask.mutate,
      reorderTasks: reorderTasks.mutate,
    }}>
      {children}
    </TasksContext.Provider>
  )
}

export const useTasks = () => useContext(TasksContext)
