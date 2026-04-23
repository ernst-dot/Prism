import { useState } from 'react'
import { useTasks } from '../context/TasksContext'
import { Plus, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react'
import dayjs from 'dayjs'

const PRIORITY_COLORS = {
  high:   'text-red-400 bg-red-400/10 border-red-400/30',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  low:    'text-green-400 bg-green-400/10 border-green-400/30',
  '':     'text-gray-500 bg-gray-800 border-gray-700',
}

const PRIORITY_BAR = {
  high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-green-500', '': 'bg-gray-700',
}

export default function TasksPage() {
  const { tasks, isLoading, createTask, toggleTask, deleteTask } = useTasks()
  const [filter, setFilter] = useState('active')
  const [input,  setInput]  = useState('')
  const [priority, setPriority] = useState('')
  const [dueDate,  setDueDate]  = useState('')
  const [showForm, setShowForm] = useState(false)

  const filtered = tasks.filter(t => {
    if (filter === 'active') return !t.done
    if (filter === 'done')   return  t.done
    if (filter === 'high')   return t.priority === 'high' && !t.done
    if (filter === 'today')  return t.due_date === dayjs().format('YYYY-MM-DD') && !t.done
    return true
  })

  const handleAdd = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    createTask({ text: input.trim(), priority, due_date: dueDate })
    setInput(''); setPriority(''); setDueDate(''); setShowForm(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white
                     px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add task
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-6 space-y-3">
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder='What needs doing? e.g. "dentist friday high"'
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm
                       placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex gap-3">
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm flex-1
                         focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">No priority</option>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm flex-1
                         focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-sm
                         font-semibold transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'all',    label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'done',   label: 'Done' },
          { key: 'high',   label: '🔴 High' },
          { key: 'today',  label: '📅 Today' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
              ${filter === f.key
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="text-gray-600 text-sm text-center py-12">Loading tasks…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-sm">{filter === 'done' ? 'No completed tasks yet' : 'All clear!'}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => toggleTask({ id: task.id, done: !task.done })}
              onDelete={() => deleteTask(task.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function TaskCard({ task, onToggle, onDelete }) {
  const [open, setOpen] = useState(false)
  const isOverdue = task.due_date && !task.done && dayjs(task.due_date).isBefore(dayjs(), 'day')

  return (
    <li className={`bg-gray-900 border rounded-xl overflow-hidden transition-all
      ${task.done ? 'border-gray-800 opacity-60' : 'border-gray-800 hover:border-gray-700'}
      border-l-4 ${PRIORITY_BAR[task.priority] || 'border-l-gray-700'}`}
      style={{ borderLeftColor: undefined }}
    >
      <div className={`flex items-start gap-3 px-4 py-3`}>
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
            ${task.done
              ? 'bg-green-500 border-green-500'
              : 'border-gray-600 hover:border-purple-400'}`}
        >
          {task.done && <Check size={10} strokeWidth={3} className="text-white" />}
        </button>

        {/* Text block */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-relaxed ${task.done ? 'line-through text-gray-600' : 'text-gray-100'}`}>
            {task.text}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {task.priority && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </span>
            )}
            {task.due_date && (
              <span className={`text-xs px-2 py-0.5 rounded-full
                ${isOverdue
                  ? 'text-red-400 bg-red-400/10'
                  : 'text-gray-500 bg-gray-800'}`}>
                {isOverdue ? '⚠ ' : '📅 '}
                {dayjs(task.due_date).format('MMM D')}
              </span>
            )}
            {task.tags?.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                #{tag}
              </span>
            ))}
          </div>

          {/* Notes preview */}
          {open && task.notes && (
            <p className="text-xs text-gray-500 mt-2 leading-relaxed whitespace-pre-wrap">{task.notes}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {task.notes && (
            <button onClick={() => setOpen(v => !v)} className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-gray-800">
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-400/10 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </li>
  )
}
