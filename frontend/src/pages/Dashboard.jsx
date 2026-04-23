import { useQuery } from '@tanstack/react-query'
import { insightsAPI } from '../services/api'
import { useAuthStore } from '../context/authStore'
import { Loader2 } from 'lucide-react'

function StatCard({ label, value, color = '#8b5cf6', sub }) {
  return (
    <div style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:14, padding:'16px 18px' }}>
      <div style={{ fontSize:28, fontWeight:700, color }}>{value}</div>
      <div style={{ fontSize:13, fontWeight:500, marginTop:2 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const user = useAuthStore(s => s.user)
  const { data, isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => insightsAPI.weekly().then(r => r.data),
    refetchInterval: 60_000,
  })

  if (isLoading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
      <Loader2 size={28} style={{ animation:'spin 1s linear infinite', color:'var(--muted)' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const s = data?.stats || {}

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:24, fontWeight:700, margin:0 }}>
          Hey {user?.username} 👋
        </h1>
        <p style={{ color:'var(--muted)', fontSize:13, margin:'4px 0 0' }}>Here's your week at a glance</p>
      </div>

      {/* XP bar */}
      <div style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:14, padding:'16px 18px', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#8b5cf6,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#fff', flexShrink:0 }}>
            {s.user?.level || 1}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--muted)', marginBottom:6 }}>
              <span style={{ fontWeight:600, color:'var(--text)' }}>Level {s.user?.level || 1}</span>
              <span>{s.user?.xp || 0} XP total</span>
            </div>
            <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', background:'linear-gradient(90deg,#8b5cf6,#ec4899)', borderRadius:4, width:`${Math.min(100, ((s.user?.xp||0) % 100))}%`, transition:'width .5s' }} />
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:22, fontWeight:700, color:'#f59e0b' }}>{s.user?.streak || 0}🔥</div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>day streak</div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:24 }}>
        <StatCard label="Tasks done"    value={s.tasks?.done_count||0}  color='#22c55e' sub="this week" />
        <StatCard label="Overdue"       value={s.tasks?.overdue||0}     color='#ef4444' sub="need attention" />
        <StatCard label="Avg sleep"     value={`${(+s.sleep?.avg_hours||0).toFixed(1)}h`} color='#7dd3fc' sub={`${s.sleep?.nights||0} nights logged`} />
        <StatCard label="Workouts"      value={s.workouts?.count||0}    color='#f97316' sub={`${s.workouts?.total_mins||0} mins total`} />
        <StatCard label="XP this week"  value={`+${s.xp?.earned||0}`}  color='#8b5cf6' sub="earned" />
        <StatCard label="High-pri done" value={s.tasks?.high_done||0}   color='#ec4899' sub="completed" />
      </div>

      {/* Insights */}
      {data?.insights?.length > 0 && (
        <div>
          <h2 style={{ fontSize:16, fontWeight:600, marginBottom:12 }}>✨ AI Insights</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {data.insights.map((ins, i) => (
              <div key={i} style={{
                display:'flex', gap:12, padding:'12px 14px',
                background:'var(--surface)', borderRadius:12,
                border:'0.5px solid var(--border)',
                borderLeft:`3px solid ${ins.type==='success'?'#22c55e':ins.type==='warning'?'#f59e0b':'#8b5cf6'}`,
              }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{ins.icon}</span>
                <span style={{ fontSize:13, lineHeight:1.5, color:'var(--text)' }}>{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
