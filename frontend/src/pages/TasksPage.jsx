import { useEffect, useState } from 'react'
import { useTaskStore } from '../context/taskStore'
import { Plus, Search, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const FILTERS = ['all','active','done','high','today','overdue']
const PRIORITIES = [{ v:'',label:'No priority' },{ v:'high',label:'🔴 High' },{ v:'medium',label:'🟡 Medium' },{ v:'low',label:'🟢 Low' }]

export default function TasksPage() {
  const { tasks, loading, filter, search, fetch, add, toggle, remove, setFilter, setSearch } = useTaskStore()
  const [text, setText]   = useState('')
  const [priority, setPriority] = useState('')
  const [due, setDue]     = useState('')
  const [tags, setTags]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [adding, setAdding] = useState(false)

  useEffect(() => { fetch() }, [filter, search])

  const handleAdd = async () => {
    if (!text.trim()) return
    setAdding(true)
    try {
      await add({
        text: text.trim(), priority, due_date: due || null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      })
      setText(''); setPriority(''); setDue(''); setTags('')
      setShowForm(false)
    } catch {
      toast.error('Could not add task')
    } finally {
      setAdding(false)
    }
  }

  const priorityColor = { high:'#ef4444', medium:'#f59e0b', low:'#22c55e', '':'#c0bfba' }
  const done = tasks.filter(t => t.done).length

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, margin:0 }}>Tasks</h1>
          <p style={{ color:'var(--muted)', fontSize:13, margin:'4px 0 0' }}>
            {done} of {tasks.length} complete
          </p>
        </div>
        <button onClick={() => setShowForm(s => !s)} style={{
          display:'flex', alignItems:'center', gap:6, padding:'9px 16px',
          borderRadius:10, background:'#8b5cf6', color:'#fff', border:'none',
          cursor:'pointer', fontSize:13, fontWeight:600,
        }}>
          <Plus size={16} /> Add task
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height:6, background:'var(--border)', borderRadius:3, marginBottom:20, overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:3, transition:'width .4s',
          width: tasks.length ? `${(done/tasks.length)*100}%` : '0%',
          background:'linear-gradient(90deg,#8b5cf6,#3b82f6)',
        }} />
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:14, padding:16, marginBottom:16 }}>
          <input
            autoFocus value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key==='Enter' && handleAdd()}
            placeholder='Task text… try "buy milk tomorrow high #errands"'
            style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:'0.5px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:14, outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:10 }}
          />
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <select value={priority} onChange={e => setPriority(e.target.value)} style={{ padding:'7px 10px', borderRadius:8, border:'0.5px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:13, cursor:'pointer' }}>
              {PRIORITIES.map(p => <option key={p.v} value={p.v}>{p.label}</option>)}
            </select>
            <input type="date" value={due} onChange={e => setDue(e.target.value)}
              style={{ padding:'7px 10px', borderRadius:8, border:'0.5px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:13, cursor:'pointer' }} />
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)"
              style={{ flex:1, minWidth:140, padding:'7px 10px', borderRadius:8, border:'0.5px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'inherit' }} />
            <button onClick={handleAdd} disabled={!text.trim()||adding} style={{ padding:'7px 18px', borderRadius:8, background:'#8b5cf6', color:'#fff', border:'none', cursor:'pointer', fontSize:13, fontWeight:600, opacity:adding?.7:1 }}>
              {adding ? '…' : 'Add'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding:'7px 12px', borderRadius:8, border:'0.5px solid var(--border)', background:'transparent', color:'var(--muted)', cursor:'pointer', fontSize:13 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search + filters */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:180 }}>
          <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…"
            style={{ width:'100%', padding:'8px 10px 8px 30px', borderRadius:10, border:'0.5px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontSize:13, outline:'none', fontFamily:'inherit', boxSizing:'border-box' }} />
        </div>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'7px 14px', borderRadius:20, border:'0.5px solid var(--border)',
            background: filter===f ? '#8b5cf6' : 'transparent',
            color: filter===f ? '#fff' : 'var(--muted)',
            cursor:'pointer', fontSize:12, fontWeight:500, textTransform:'capitalize',
          }}>
            {f}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
          <Loader2 size={24} style={{ animation:'spin 1s linear infinite', color:'var(--muted)' }} />
        </div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--muted)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
          <div style={{ fontSize:16, fontWeight:500, marginBottom:6 }}>No tasks here!</div>
          <div style={{ fontSize:13 }}>Click "Add task" to get started.</div>
        </div>
      ) : (
        <div style={{ background:'var(--surface)', borderRadius:14, border:'0.5px solid var(--border)', overflow:'hidden' }}>
          {tasks.map((task, i) => (
            <div key={task.id} style={{
              display:'flex', alignItems:'flex-start', gap:12, padding:'13px 16px',
              borderBottom: i < tasks.length-1 ? '0.5px solid var(--border)' : 'none',
              opacity: task.done ? .6 : 1, transition:'opacity .2s',
            }}>
              {/* Checkbox */}
              <button onClick={() => toggle(task.id)} style={{
                width:20, height:20, borderRadius:'50%', flexShrink:0, marginTop:2,
                border:`1.5px solid ${task.done ? '#22c55e' : priorityColor[task.priority||'']}`,
                background: task.done ? '#d1fae5' : 'transparent', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {task.done && <span style={{ color:'#16a34a', fontSize:11 }}>✓</span>}
              </button>

              {/* Content */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:500, textDecoration: task.done ? 'line-through' : 'none', wordBreak:'break-word', lineHeight:1.4 }}>
                  {task.text}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:5 }}>
                  {task.priority && (
                    <span style={{ fontSize:11, padding:'1px 7px', borderRadius:20, background: task.priority==='high'?'#fee2e2':task.priority==='medium'?'#fef3c7':'#dcfce7', color: task.priority==='high'?'#dc2626':task.priority==='medium'?'#d97706':'#16a34a', fontWeight:500 }}>
                      {task.priority}
                    </span>
                  )}
                  {task.due_date && (
                    <span style={{ fontSize:11, padding:'1px 7px', borderRadius:20, background:'#eff6ff', color:'#2563eb' }}>
                      📅 {task.due_date}
                    </span>
                  )}
                  {(task.tags||[]).map(tag => (
                    <span key={tag} style={{ fontSize:11, padding:'1px 7px', borderRadius:20, background:'#f3f4f6', color:'#6b7280' }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Delete */}
              <button onClick={() => remove(task.id)} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--muted)', padding:'2px 4px', borderRadius:4, fontSize:14, opacity:.5, flexShrink:0 }}
                onMouseEnter={e => e.target.style.opacity=1} onMouseLeave={e => e.target.style.opacity=.5}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
