import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { authApi } from '../services/auth'
import { tokenStorage } from '../utils/token'
import type { DashboardData, UserManagementItem } from '../types/auth'
import type { Group } from 'three'
import { mediaApi, type MediaImage, type MediaVideo } from '../services/media'
import { useToast } from '../components/Toast'

function useCounter(value: number, duration = 500) {
  const [display, setDisplay] = useState(value)
  useEffect(() => {
    const start = display
    const delta = value - start
    const beginAt = performance.now()
    let frame = 0
    const render = (now: number) => {
      const progress = Math.min(1, (now - beginAt) / duration)
      setDisplay(Math.round(start + delta * progress))
      if (progress < 1) frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return display
}

function SparkField() {
  const [nodes] = useState(() => Array.from({ length: 36 }, () => [Math.random() * 8 - 4, Math.random() * 5 - 2.5, Math.random() * 6 - 3]))
  const groupRef = useState<{ current: Group | null }>({ current: null })[0]
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.08
  })
  return (
    <group ref={(node) => (groupRef.current = node)}>
      {nodes.map((item, index) => (
        <mesh key={index} position={[item[0], item[1], item[2]]}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshBasicMaterial color={index % 2 ? '#7dd3fc' : '#a78bfa'} />
        </mesh>
      ))}
    </group>
  )
}

function LineChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const option: EChartsOption = {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(148,163,184,0.2)', textStyle: { color: '#e2e8f0', fontSize: 12 } },
    grid: { left: 36, right: 16, top: 36, bottom: 24 },
    xAxis: { type: 'category', data: data.map(d => d.label), axisLabel: { color: '#94a3b8', fontSize: 10 }, axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } } },
    series: [{
      type: 'line', smooth: true, data: data.map(d => d.value),
      lineStyle: { color: '#38bdf8', width: 2.5, shadowBlur: 8, shadowColor: 'rgba(56,189,248,0.4)' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(56,189,248,0.3)' }, { offset: 1, color: 'rgba(56,189,248,0.02)' }] } },
      symbolSize: 0,
      itemStyle: { color: '#38bdf8' },
    }],
  }
  return <div className="viz-card"><h3>📈 日访问趋势</h3><ReactECharts option={option} style={{ height: 180 }} notMerge lazyUpdate /></div>
}

function BarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const sampled = data.filter((_, i) => i % 2 === 0).slice(0, 12)
  const option: EChartsOption = {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(148,163,184,0.2)', textStyle: { color: '#e2e8f0', fontSize: 12 } },
    grid: { left: 36, right: 16, top: 36, bottom: 24 },
    xAxis: { type: 'category', data: sampled.map(d => d.label.slice(0, 2)), axisLabel: { color: '#94a3b8', fontSize: 10 }, axisLine: { lineStyle: { color: 'rgba(148,163,184,0.2)' } } },
    yAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } } },
    series: [{
      type: 'bar', data: sampled.map(d => d.value), barWidth: 14,
      itemStyle: { borderRadius: [6, 6, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#818cf8' }, { offset: 1, color: '#6366f1' }] } },
    }],
  }
  return <div className="viz-card"><h3>📊 时段访问量</h3><ReactECharts option={option} style={{ height: 180 }} notMerge lazyUpdate /></div>
}

function GeoMap({ data }: { data: Array<{ name: string; value: number }> }) {
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const option: EChartsOption = {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(148,163,184,0.2)', textStyle: { color: '#e2e8f0', fontSize: 12 } },
    grid: { left: 60, right: 16, top: 8, bottom: 16 },
    xAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.1)' } } },
    yAxis: { type: 'category', data: sorted.map(d => d.name).reverse(), axisLabel: { color: '#94a3b8', fontSize: 10 } },
    series: [{
      type: 'bar', data: sorted.map(d => d.value).reverse(), barWidth: 12,
      itemStyle: { borderRadius: [0, 6, 6, 0], color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#3b82f6' }] } },
    }],
  }
  return <div className="viz-card"><h3>🗺️ 访客地区分布</h3><ReactECharts option={option} style={{ height: 220 }} notMerge lazyUpdate /></div>
}

function PieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const option: EChartsOption = {
    tooltip: { trigger: 'item', backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(148,163,184,0.2)', textStyle: { color: '#e2e8f0', fontSize: 12 } },
    legend: { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 10 } },
    series: [{
      type: 'pie', radius: ['40%', '68%'], center: ['50%', '43%'],
      label: { color: '#cbd5e1', fontSize: 10 },
      emphasis: { label: { fontSize: 14, fontWeight: 'bold' }, itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.4)' } },
      data: data.map(d => ({ ...d, itemStyle: { borderRadius: 4, borderColor: 'rgba(15,23,42,0.6)', borderWidth: 2 } })),
    }],
  }
  return <div className="viz-card"><h3>🍩 地区占比</h3><ReactECharts option={option} style={{ height: 180 }} notMerge lazyUpdate /></div>
}

export function DashboardPage() {
  const { toast } = useToast()
  const rejectOptions = ['资料不完整', '邮箱不符合要求', '疑似测试/无效账号', '其他原因（自定义）'] as const
  const navigate = useNavigate()
  const [clock, setClock] = useState(new Date())
  const [currentUserId, setCurrentUserId] = useState('')
  const [name, setName] = useState('用户')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [users, setUsers] = useState<UserManagementItem[]>([])
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [rejectReasonByUser, setRejectReasonByUser] = useState<Record<string, string>>({})
  const [rejectCustomByUser, setRejectCustomByUser] = useState<Record<string, string>>({})
  const [adminImages, setAdminImages] = useState<MediaImage[]>([])
  const [adminVideos, setAdminVideos] = useState<MediaVideo[]>([])
  const [imgForm, setImgForm] = useState({ title: '', sortOrder: 0 })
  const [vidForm, setVidForm] = useState({ title: '', description: '', duration: '', sortOrder: 0 })
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [vidFile, setVidFile] = useState<File | null>(null)
  const [editingImgId, setEditingImgId] = useState<string | null>(null)
  const [editingVidId, setEditingVidId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; content: string; createdAt: string }>>([])
  const [notiForm, setNotiForm] = useState({ type: '系统', content: '' })

  const loadData = async () => {
    let currentRole = 'member'
    try {
      const profile = await authApi.profile()
      setCurrentUserId(profile.id)
      setName(profile.name)
      setEmail(profile.email)
      setRole(profile.role)
      currentRole = profile.role
    } catch {
      tokenStorage.clear()
      navigate('/login', { replace: true })
      return
    }
    try {
      const panelData = await authApi.dashboard()
      setDashboard(panelData)
      setTheme(panelData.profile.theme)
      document.documentElement.setAttribute('data-theme', panelData.profile.theme)
      if (currentRole === 'admin') {
        const managed = await authApi.users()
        setUsers(managed)
      } else {
        setUsers([])
      }
    } catch {
      setDashboard(null)
    }
  }

  useEffect(() => {
    let cancelled = false
    void loadData()
    const timer = window.setInterval(() => {
      if (!cancelled) {
        void loadData()
      }
    }, 15000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [navigate])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const avatar = useMemo(() => (name?.trim()?.[0] || 'U').toUpperCase(), [name])

  const handleLogout = () => {
    void authApi.trackVisit({
      visitorId: localStorage.getItem('visitor_id_v1') ?? 'anonymous',
      eventType: 'LOGOUT',
      routePath: '/dashboard',
    }).catch(() => undefined)
    tokenStorage.clear()
    document.documentElement.setAttribute('data-theme', 'dark')
    navigate('/login', { replace: true })
  }

  const handleThemeToggle = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    try {
      await authApi.updateTheme(nextTheme)
      setDashboard((prev) => (prev ? { ...prev, profile: { ...prev.profile, theme: nextTheme } } : prev))
    } catch {
      setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
    }
  }

  const handleReviewUser = async (userId: string, status: 'approved' | 'rejected') => {
    const reason = rejectReasonByUser[userId] ?? rejectOptions[0]
    const note =
      status === 'rejected'
        ? reason === '其他原因（自定义）'
          ? (rejectCustomByUser[userId] ?? '').trim() || '其他原因'
          : reason
        : undefined
    await authApi.reviewUser({ userId, status, note })
    const managed = await authApi.users()
    setUsers(managed)
  }

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm('确定删除该账号？删除后不可恢复。')
    if (!confirmed) return
    await authApi.deleteUser(userId)
    const managed = await authApi.users()
    setUsers(managed)
  }

  const fetchMedia = useCallback(async () => {
    try {
      const [imgs, vids] = await Promise.all([mediaApi.listImages(), mediaApi.listVideos()])
      setAdminImages(imgs)
      setAdminVideos(vids)
    } catch { /* */ }
  }, [])

  const handleSaveImage = async () => {
    if (!imgForm.title.trim()) return
    if (!editingImgId && !imgFile) return
    try {
      if (editingImgId) await mediaApi.updateImage(editingImgId, imgFile, imgForm.title)
      else await mediaApi.createImage(imgFile!, imgForm.title)
      setImgForm({ title: '', sortOrder: 0 })
      setImgFile(null)
      setEditingImgId(null)
      await fetchMedia()
      toast('图片保存成功', 'success')
    } catch { toast('图片保存失败', 'error') }
  }

  const handleSaveVideo = async () => {
    if (!vidForm.title.trim()) return
    if (!editingVidId && !vidFile) return
    try {
      if (editingVidId) await mediaApi.updateVideo(editingVidId, vidFile, { title: vidForm.title, description: vidForm.description, duration: vidForm.duration })
      else await mediaApi.createVideo(vidFile!, vidForm.title, vidForm.duration, vidForm.description)
      setVidForm({ title: '', description: '', duration: '', sortOrder: 0 })
      setVidFile(null)
      setEditingVidId(null)
      await fetchMedia()
      toast('视频保存成功', 'success')
    } catch { toast('视频保存失败', 'error') }
  }

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } })
      setNotifications(await res.json())
    } catch { /* */ }
  }, [])

  const handleAddNotification = async () => {
    if (!notiForm.content.trim()) return
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenStorage.getAccessToken()}` },
        body: JSON.stringify(notiForm),
      })
      setNotiForm({ type: '系统', content: '' })
      await fetchNotifications()
      toast('通知发送成功', 'success')
    } catch { toast('发送失败', 'error') }
  }

  const handleDeleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenStorage.getAccessToken()}` } })
      await fetchNotifications()
    } catch { /* */ }
  }

  useEffect(() => { fetchMedia(); fetchNotifications() }, [fetchMedia, fetchNotifications])

  const stats = dashboard?.bigScreenStats
  const totalVisitors = useCounter(stats?.totalVisitors ?? 0)
  const todayVisitors = useCounter(stats?.todaysVisitors ?? 0)
  const yesterdayVisitors = useCounter(stats?.yesterdaysVisitors ?? 0)
  const onlineVisitors = useCounter(stats?.onlineVisitors ?? 0)
  const avgStay = useCounter(stats?.avgStaySeconds ?? 0)
  const realtimeLogs = useMemo(() => {
    const raw = dashboard?.operationLogs ?? []
    return [...raw, ...raw]
  }, [dashboard?.operationLogs])

  return (
    <main className="screen-page">
      <header className="screen-header">
        <div>
          <h1>网站访问可视化大屏</h1>
          <p>{clock.toLocaleString()}</p>
        </div>
        <div className="user-menu">
          <button className="user-chip" type="button" aria-label="用户菜单">
            <span className="user-avatar">{avatar}</span>
            <span className="user-name">{name}</span>
          </button>
          <div className="user-popover">
            <p className="user-popover-name">{name}</p>
            <p className="user-popover-email">{email}</p>
            <button type="button" onClick={() => navigate('/change-password')}>
              修改密码
            </button>
            <button type="button" onClick={handleThemeToggle}>
              主题：{theme === 'dark' ? '深色' : '首页同款浅色'}
            </button>
            <button type="button" onClick={handleLogout}>
              退出登录
            </button>
          </div>
        </div>
      </header>
      <section className="screen-grid">
        <aside className="screen-left">
          <LineChart data={dashboard?.charts.dailyVisits ?? []} />
          <BarChart data={dashboard?.charts.hourlyVisits ?? []} />
          <GeoMap data={dashboard?.charts.regionDistribution ?? []} />
          <PieChart data={dashboard?.charts.regionDistribution ?? []} />
        </aside>
        <section className="screen-center">
          <div className="center-3d">
            <Canvas camera={{ position: [0, 0, 5], fov: 55 }}>
              <ambientLight intensity={0.8} />
              <SparkField />
            </Canvas>
          </div>
          <div className="core-metrics">
            <article className="group">
              <h4>👥 总访问人数</h4>
              <strong>{totalVisitors.toLocaleString()}</strong>
              <span className="text-[10px] text-sky-400/60 mt-1 block">累计注册用户数</span>
            </article>
            <article className="group">
              <h4>📅 今日访客</h4>
              <strong>{todayVisitors.toLocaleString()}</strong>
              <span className="text-[10px] text-emerald-400/60 mt-1 block">今日新增访问</span>
            </article>
            <article className="group">
              <h4>📆 昨日访问</h4>
              <strong>{yesterdayVisitors.toLocaleString()}</strong>
              <span className="text-[10px] text-slate-400/60 mt-1 block">昨日访问总量</span>
            </article>
            <article className="group">
              <h4>🟢 实时在线</h4>
              <strong>{onlineVisitors.toLocaleString()}</strong>
              <span className="text-[10px] text-green-400/60 mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />在线中</span>
            </article>
            <article className="group">
              <h4>⏱️ 平均停留</h4>
              <strong>{avgStay.toLocaleString()}s</strong>
              <span className="text-[10px] text-amber-400/60 mt-1 block">每次访问时长</span>
            </article>
          </div>
        </section>
        <aside className="screen-right">
          <div className="viz-card">
            <h3>系统操作日志</h3>
            <div className="log-marquee">
              <ul>
                {realtimeLogs.map((item, index) => (
                  <li key={`${item.id}-${index}`}>
                    <span>{item.action}</span>
                    <span>{item.detail ?? '-'}</span>
                    <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="viz-card">
            <h3>📱 访客行为监控</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-slate-400 mb-2">设备类型</p>
                {(dashboard?.behavior.devices ?? []).map((item) => (
                  <div key={`d-${item.name}`} className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-slate-300 w-16">{item.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-500" style={{ width: `${item.ratio}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 w-8 text-right">{item.ratio}%</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-2">浏览器</p>
                {(dashboard?.behavior.browsers ?? []).map((item) => (
                  <div key={`b-${item.name}`} className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-slate-300 w-16">{item.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-500" style={{ width: `${item.ratio}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 w-8 text-right">{item.ratio}%</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-2">流量来源</p>
                {(dashboard?.behavior.sources ?? []).map((item) => (
                  <div key={`s-${item.name}`} className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-slate-300 w-16">{item.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500" style={{ width: `${item.ratio}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 w-8 text-right">{item.ratio}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {role === 'admin' && (
            <>
            <div className="viz-card">
              <h3>🖼️ 图片管理</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <input className="flex-1 min-w-[80px] h-8 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400/50" placeholder="标题" value={imgForm.title} onChange={e => setImgForm(p => ({ ...p, title: e.target.value }))} />
                <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files?.[0] ?? null)} className="flex-1 min-w-[100px] h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-sky-500/20 file:px-2 file:py-0.5 file:text-xs file:text-sky-200" />
                <button className="h-8 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-3 text-xs font-medium text-white hover:from-sky-400 hover:to-indigo-400" onClick={handleSaveImage}>{editingImgId ? '更新' : '添加'}</button>
                {editingImgId && <button className="h-8 rounded-lg border border-white/20 bg-white/5 px-3 text-xs text-slate-300 hover:bg-white/10" onClick={() => { setEditingImgId(null); setImgFile(null); setImgForm({ title: '', sortOrder: 0 }) }}>取消</button>}
              </div>
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 custom-scrollbar">
                {adminImages.map(img => (
                  <div key={img.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <img src={img.fileUrl} alt={img.title} className="h-8 w-8 shrink-0 rounded object-cover" />
                    <span className="flex-1 truncate text-xs text-slate-300">{img.title}</span>
                    <button className="text-[10px] text-sky-400 hover:text-sky-300" onClick={() => { setImgForm({ title: img.title, sortOrder: img.sortOrder }); setEditingImgId(img.id) }}>编辑</button>
                    <button className="text-[10px] text-red-400 hover:text-red-300" onClick={() => { if (window.confirm('删除？')) mediaApi.deleteImage(img.id).then(fetchMedia) }}>删除</button>
                  </div>
                ))}
                {adminImages.length === 0 && <p className="py-3 text-center text-xs text-slate-500">暂无图片</p>}
              </div>
            </div>

            <div className="viz-card">
              <h3>🎬 视频管理</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <input className="flex-1 min-w-[80px] h-8 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400/50" placeholder="标题" value={vidForm.title} onChange={e => setVidForm(p => ({ ...p, title: e.target.value }))} />
                <input type="file" accept="video/*" onChange={e => setVidFile(e.target.files?.[0] ?? null)} className="flex-1 min-w-[100px] h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-sky-500/20 file:px-2 file:py-0.5 file:text-xs file:text-sky-200" />
                <input className="w-16 h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400/50" placeholder="时长" value={vidForm.duration} onChange={e => setVidForm(p => ({ ...p, duration: e.target.value }))} />
                <button className="h-8 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-3 text-xs font-medium text-white hover:from-sky-400 hover:to-indigo-400" onClick={handleSaveVideo}>{editingVidId ? '更新' : '添加'}</button>
                {editingVidId && <button className="h-8 rounded-lg border border-white/20 bg-white/5 px-3 text-xs text-slate-300 hover:bg-white/10" onClick={() => { setEditingVidId(null); setVidFile(null); setVidForm({ title: '', description: '', duration: '', sortOrder: 0 }) }}>取消</button>}
              </div>
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 custom-scrollbar">
                {adminVideos.map(vid => (
                  <div key={vid.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-xs shrink-0">▶</span>
                    <span className="flex-1 truncate text-xs text-slate-300">{vid.title}</span>
                    {vid.duration && <span className="text-[10px] text-slate-500 shrink-0">{vid.duration}</span>}
                    <button className="text-[10px] text-sky-400 hover:text-sky-300" onClick={() => { setVidForm({ title: vid.title, description: vid.description ?? '', duration: vid.duration ?? '', sortOrder: vid.sortOrder }); setEditingVidId(vid.id) }}>编辑</button>
                    <button className="text-[10px] text-red-400 hover:text-red-300" onClick={() => { if (window.confirm('删除？')) mediaApi.deleteVideo(vid.id).then(fetchMedia) }}>删除</button>
                  </div>
                ))}
                {adminVideos.length === 0 && <p className="py-3 text-center text-xs text-slate-500">暂无视频</p>}
              </div>
            </div>

            <div className="viz-card">
              <h3>🔔 通知管理</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <select value={notiForm.type} onChange={e => setNotiForm(p => ({ ...p, type: e.target.value }))} className="w-[70px] h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs text-slate-300 outline-none focus:border-sky-400/50">
                  <option>系统</option><option>互动</option><option>提醒</option><option>消息</option>
                </select>
                <input className="flex-[2] min-w-[140px] h-8 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-400/50" placeholder="通知内容" value={notiForm.content} onChange={e => setNotiForm(p => ({ ...p, content: e.target.value }))} />
                <button className="h-8 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-3 text-xs font-medium text-white hover:from-sky-400 hover:to-indigo-400" onClick={handleAddNotification}>发送</button>
              </div>
              <div className="max-h-[180px] overflow-y-auto space-y-1.5 custom-scrollbar">
                {notifications.map(item => {
                  const typeColors: Record<string, string> = { '系统': 'bg-red-500/15 text-red-300', '互动': 'bg-sky-500/15 text-sky-300', '提醒': 'bg-amber-500/15 text-amber-300', '消息': 'bg-emerald-500/15 text-emerald-300' }
                  return (
                    <div key={item.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColors[item.type] ?? 'bg-slate-500/15 text-slate-300'}`}>{item.type}</span>
                      <span className="flex-1 truncate text-xs text-slate-300">{item.content}</span>
                      <button className="text-[10px] text-red-400 hover:text-red-300" onClick={() => { if (window.confirm('删除？')) handleDeleteNotification(item.id) }}>删除</button>
                    </div>
                  )
                })}
                {notifications.length === 0 && <p className="py-3 text-center text-xs text-slate-500">暂无通知</p>}
              </div>
            </div>

            <div className="viz-card">
              <h3>人员管理（审批）</h3>
              <div className="user-admin-list">
                {users.map((item) => (
                  <div key={item.id} className="user-admin-item">
                    <p>{item.name} / {item.email}</p>
                    <p>状态：{item.approvalStatus}</p>
                    {item.approvalStatus !== 'approved' && (
                      <div className="user-admin-actions">
                        <button type="button" onClick={() => void handleReviewUser(item.id, 'approved')}>通过</button>
                        <select
                          value={rejectReasonByUser[item.id] ?? rejectOptions[0]}
                          onChange={(event) =>
                            setRejectReasonByUser((prev) => ({ ...prev, [item.id]: event.target.value }))
                          }
                        >
                          {rejectOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        {(rejectReasonByUser[item.id] ?? rejectOptions[0]) === '其他原因（自定义）' && (
                          <input
                            value={rejectCustomByUser[item.id] ?? ''}
                            onChange={(event) =>
                              setRejectCustomByUser((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                            placeholder="输入拒绝原因"
                          />
                        )}
                        <button type="button" onClick={() => void handleReviewUser(item.id, 'rejected')}>拒绝</button>
                      </div>
                    )}
                    {item.id !== currentUserId && item.role !== 'admin' && (
                      <div className="user-admin-actions">
                        <button type="button" className="danger-btn" onClick={() => void handleDeleteUser(item.id)}>
                          删除账号
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            </>
          )}
        </aside>
      </section>
    </main>
  )
}
