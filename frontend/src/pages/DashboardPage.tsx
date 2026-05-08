import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import { authApi } from '../services/auth'
import { tokenStorage } from '../utils/token'
import type { DashboardData, UserManagementItem } from '../types/auth'
import type { Group } from 'three'
import { mediaApi, type MediaImage, type MediaVideo } from '../services/media'
import { http } from '../services/http'
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
  const innerParticles = useMemo(() => Array.from({ length: 48 }, (_, i) => {
    const angle = (i / 48) * Math.PI * 2
    const radius = 1.4 + Math.random() * 0.25
    return { x: Math.cos(angle) * radius, y: (Math.random() - 0.5) * 0.5, z: Math.sin(angle) * radius, size: 0.025 + Math.random() * 0.022, color: i % 3 === 0 ? '#f0abfc' : i % 3 === 1 ? '#7dd3fc' : '#a78bfa' }
  }), [])
  const outerParticles = useMemo(() => Array.from({ length: 40 }, (_, i) => {
    const angle = (i / 40) * Math.PI * 2 + 0.3
    const radius = 2.2 + Math.random() * 0.4
    return { x: Math.cos(angle) * radius, y: (Math.random() - 0.5) * 1, z: Math.sin(angle) * radius, size: 0.018 + Math.random() * 0.018, color: '#67e8f9' }
  }), [])
  const scattered = useMemo(() => Array.from({ length: 40 }, () => ({
    x: (Math.random() - 0.5) * 4.5, y: (Math.random() - 0.5) * 3, z: (Math.random() - 0.5) * 3.5,
    size: 0.012 + Math.random() * 0.018, color: Math.random() > 0.5 ? '#818cf8' : '#38bdf8'
  })), [])
  const constellationLines = useMemo(() => {
    const count = 48
    const lines: Array<[number, number, number][]> = []
    for (let i = 0; i < count; i++) {
      const a = innerParticles[i]
      const b = innerParticles[(i + 1) % count]
      const c = innerParticles[(i + 3) % count]
      if (Math.random() > 0.5) lines.push([[a.x, a.y, a.z], [b.x, b.y, b.z]])
      if (Math.random() > 0.75) lines.push([[a.x, a.y, a.z], [c.x, c.y, c.z]])
    }
    return lines
  }, [innerParticles])

  const groupRef = useRef<Group>(null)
  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.rotation.y = t * 0.1
    groupRef.current.rotation.x = Math.sin(t * 0.25) * 0.05
    groupRef.current.rotation.z = Math.cos(t * 0.2) * 0.03
  })

  return (
    <group ref={groupRef}>
      {/* Constellation lines */}
      {constellationLines.map((pts, i) => (
        <Line key={`cl-${i}`} points={pts} color="#7dd3fc" lineWidth={0.6} transparent opacity={0.18} />
      ))}
      {/* Orbital rings */}
      <mesh rotation={[Math.PI / 2.1, 0, 0]}>
        <torusGeometry args={[1.5, 0.006, 12, 120]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.22} />
      </mesh>
      <mesh rotation={[Math.PI / 3, Math.PI / 5, 0]}>
        <torusGeometry args={[1.9, 0.005, 12, 100]} />
        <meshBasicMaterial color="#818cf8" transparent opacity={0.15} />
      </mesh>
      <mesh rotation={[Math.PI / 2.5, -Math.PI / 4, Math.PI / 3]}>
        <torusGeometry args={[2.3, 0.004, 10, 80]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.1} />
      </mesh>
      {/* Central glowing orb */}
      <mesh>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.95} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.2} />
      </mesh>
      {/* Particles */}
      {innerParticles.map((p, i) => (
        <mesh key={`i-${i}`} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.9} />
        </mesh>
      ))}
      {outerParticles.map((p, i) => (
        <mesh key={`o-${i}`} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.size, 6, 6]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.55} />
        </mesh>
      ))}
      {scattered.map((p, i) => (
        <mesh key={`s-${i}`} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[p.size, 4, 4]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

function LineChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const option: EChartsOption = {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(2,6,23,0.92)', borderColor: 'rgba(56,189,248,0.25)', borderWidth: 1, textStyle: { color: '#e2e8f0', fontSize: 11 }, axisPointer: { type: 'cross', crossStyle: { color: 'rgba(148,163,184,0.3)' } } },
    grid: { left: 32, right: 20, top: 28, bottom: 20 },
    xAxis: { type: 'category', data: data.map(d => d.label), axisLabel: { color: '#64748b', fontSize: 10 }, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.08)' } } },
    series: [{
      type: 'line', smooth: true, data: data.map(d => d.value), showSymbol: false,
      lineStyle: { color: '#38bdf8', width: 2, shadowBlur: 6, shadowColor: 'rgba(56,189,248,0.3)' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(56,189,248,0.25)' }, { offset: 1, color: 'rgba(56,189,248,0.01)' }] } },
      itemStyle: { color: '#38bdf8' },
    }],
    animationDuration: 800,
    animationEasing: 'cubicOut',
  }
  return <div className="viz-card"><h3>📈 日访问趋势</h3><ReactECharts option={option} style={{ height: 170 }} notMerge lazyUpdate /></div>
}

function BarChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const hours = data.map(d => ({ label: d.label.slice(0, 2), value: d.value }))
  const option: EChartsOption = {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(2,6,23,0.92)', borderColor: 'rgba(129,140,248,0.25)', borderWidth: 1, textStyle: { color: '#e2e8f0', fontSize: 11 } },
    grid: { left: 28, right: 12, top: 24, bottom: 18 },
    xAxis: { type: 'category', data: hours.map(d => d.label), axisLabel: { color: '#64748b', fontSize: 9, interval: 3 }, axisLine: { show: false }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLabel: { color: '#64748b', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.08)' } } },
    series: [{
      type: 'bar', data: hours.map(d => d.value), barWidth: '70%',
      itemStyle: { borderRadius: [5, 5, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#a78bfa' }, { offset: 1, color: '#7c3aed' }] } },
      emphasis: { itemStyle: { color: '#c4b5fd' } },
    }],
    animationDuration: 600,
    animationEasing: 'cubicOut',
  }
  return <div className="viz-card"><h3>📊 时段访问量</h3><ReactECharts option={option} style={{ height: 170 }} notMerge lazyUpdate /></div>
}

function shortName(name: string) {
  const parts = name.split('-')
  return parts.length > 2 ? parts.slice(1).join('-') : parts.length > 1 ? parts[parts.length - 1] : name
}

function GeoMap({ data }: { data: Array<{ name: string; value: number }> }) {
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const maxVal = sorted[0]?.value ?? 1
  const chartHeight = Math.max(200, sorted.length * 24 + 30)
  const option: EChartsOption = {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(2,6,23,0.92)', borderColor: 'rgba(6,182,212,0.25)', borderWidth: 1, textStyle: { color: '#e2e8f0', fontSize: 11 }, formatter: (params: any) => `${params[0].name}<br/>访问量：${params[0].value}` },
    grid: { left: 8, right: 38, top: 6, bottom: 14 },
    xAxis: { type: 'value', axisLabel: { color: '#64748b', fontSize: 9 }, splitLine: { lineStyle: { color: 'rgba(148,163,184,0.08)' } }, max: maxVal * 1.3 },
    yAxis: { type: 'category', data: sorted.map(d => shortName(d.name)).reverse(), axisLabel: { color: '#94a3b8', fontSize: 10, width: 68, overflow: 'truncate', ellipsis: '...' }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar', data: sorted.map(d => d.value).reverse(), barWidth: sorted.length > 10 ? 8 : 10,
      label: { show: true, position: 'right', color: '#94a3b8', fontSize: 9, formatter: '{c}' },
      itemStyle: { borderRadius: [0, 6, 6, 0], color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#0ea5e9' }] } },
    }],
    animationDuration: 700,
    animationEasing: 'cubicOut',
  }
  return <div className="viz-card"><h3>🗺️ 访客地区分布</h3><ReactECharts option={option} style={{ height: chartHeight }} notMerge lazyUpdate /></div>
}

function PieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const colors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#fb923c', '#34d399', '#fbbf24', '#f87171', '#2dd4bf', '#e879f9']
  const { topItems, otherItem } = useMemo(() => {
    if (data.length <= 8) return { topItems: data, otherItem: null }
    const sorted = [...data].sort((a, b) => b.value - a.value)
    const top8 = sorted.slice(0, 8)
    const otherVal = sorted.slice(8).reduce((s, d) => s + d.value, 0)
    if (otherVal === 0) return { topItems: top8, otherItem: null }
    return { topItems: top8, otherItem: { name: '其他地区', value: otherVal } }
  }, [data])
  const pieData = otherItem ? [...topItems, otherItem] : topItems
  const option: EChartsOption = {
    tooltip: { trigger: 'item', backgroundColor: 'rgba(2,6,23,0.92)', borderColor: 'rgba(148,163,184,0.2)', borderWidth: 1, textStyle: { color: '#e2e8f0', fontSize: 11 }, formatter: (params: any) => `${params.name}<br/>访问量：${params.value}（${params.percent}%）` },
    legend: { bottom: 0, textStyle: { color: '#94a3b8', fontSize: 9 }, itemWidth: 8, itemHeight: 8, itemGap: 6, formatter: (name: string) => shortName(name).length > 6 ? shortName(name).slice(0, 6) + '…' : shortName(name) },
    series: [{
      type: 'pie', radius: ['45%', '72%'], center: ['50%', '40%'],
      label: { color: '#94a3b8', fontSize: 9, formatter: (p: any) => p.percent > 3 ? `${shortName(p.name)}\n${p.percent}%` : '' },
      labelLine: { show: true, length: 14, length2: 10 },
      emphasis: { label: { fontSize: 13, fontWeight: 'bold' }, itemStyle: { shadowBlur: 16, shadowColor: 'rgba(0,0,0,0.5)' }, scaleSize: 8 },
      data: pieData.map((d, i) => ({ ...d, itemStyle: { borderRadius: 6, borderColor: 'rgba(15,23,42,0.5)', borderWidth: 2, color: colors[i % colors.length] } })),
    }],
    animationType: 'scale',
    animationEasing: 'elasticOut',
    animationDelay: (idx: number) => idx * 60,
  }
  return <div className="viz-card"><h3>🍩 地区占比</h3><ReactECharts option={option} style={{ height: 190 }} notMerge lazyUpdate /></div>
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
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
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
      const res = await http.get('/notifications')
      setNotifications(res.data ?? [])
    } catch { /* */ }
  }, [])

  const handleAddNotification = async () => {
    if (!notiForm.content.trim()) return
    try {
      await http.post('/notifications', notiForm)
      setNotiForm({ type: '系统', content: '' })
      await fetchNotifications()
      toast('通知发送成功', 'success')
    } catch { toast('发送失败', 'error') }
  }

  const handleDeleteNotification = async (id: string) => {
    try {
      await http.delete(`/notifications/${id}`)
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
  const scrollLogs = useMemo(() => {
    const raw = dashboard?.operationLogs ?? []
    if (raw.length === 0) return []
    return [...raw, ...raw]
  }, [dashboard?.operationLogs])

  const trendPct = useMemo(() => {
    const t = stats?.todaysVisitors ?? 0
    const y = stats?.yesterdaysVisitors ?? 0
    if (y === 0 && t === 0) return null
    if (y === 0) return { dir: 'up', pct: 100 }
    const pct = Math.round(((t - y) / y) * 100)
    return { dir: pct >= 0 ? 'up' : 'down' as 'up' | 'down', pct: Math.abs(pct) }
  }, [stats?.todaysVisitors, stats?.yesterdaysVisitors])

  const pStatus = dashboard?.projectStatus
  const uptimeStr = useMemo(() => {
    const s = pStatus?.uptimeSeconds ?? 0
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    if (d > 0) return `${d}天${h}时${m}分`
    if (h > 0) return `${h}时${m}分`
    return `${m}分`
  }, [pStatus?.uptimeSeconds])

  return (
    <main className="screen-page">
      <header className="screen-header">
        <div>
          <h1>网站访问可视化大屏</h1>
          <div className="screen-status">
            <span className="status-dot on" />
            <span>API {pStatus?.serverStatus === 'online' ? '在线' : '离线'}</span>
            <span className="status-dot on" style={{marginLeft: 8}} />
            <span>数据库 {pStatus?.dbStatus === 'connected' ? '已连接' : '未连接'}</span>
            <span style={{marginLeft: 8, color: '#64748b'}}>运行 {uptimeStr}</span>
            <span style={{marginLeft: 12, color: '#94a3b8'}}>{clock.toLocaleString()}</span>
          </div>
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
              主题：{theme === 'dark' ? '深色' : '浅色'}
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
            <article>
              <h4>👥 累计访客</h4>
              <strong>{totalVisitors.toLocaleString()}</strong>
              <span className="metric-sub">历史去重访客总数</span>
            </article>
            <article>
              <h4>📅 今日访客</h4>
              <strong>{todayVisitors.toLocaleString()}</strong>
              <span className="metric-sub">
                今日独立访客数
                {trendPct && (
                  <span className={trendPct.dir === 'up' ? 'text-emerald-400 ml-1' : 'text-red-400 ml-1'}>
                    {trendPct.dir === 'up' ? '↑' : '↓'}{trendPct.pct}%
                  </span>
                )}
              </span>
            </article>
            <article>
              <h4>📆 昨日访客</h4>
              <strong>{yesterdayVisitors.toLocaleString()}</strong>
              <span className="metric-sub">昨日独立访客数</span>
            </article>
            <article>
              <h4>🟢 在线用户</h4>
              <strong>{onlineVisitors.toLocaleString()}</strong>
              <span className="metric-sub"><span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse align-middle mr-1" />15分钟内活跃</span>
            </article>
            <article>
              <h4>⏱️ 平均停留</h4>
              <strong>{avgStay.toLocaleString()}s</strong>
              <span className="metric-sub">页面平均停留时长</span>
            </article>
          </div>
        </section>
        <aside className="screen-right">
          <div className="viz-card">
            <h3>📋 系统操作日志</h3>
            <div className="log-marquee">
              <ul>
                {scrollLogs.map((item, i) => {
                  const isSuccess = item.action.includes('SUCCESS') || item.action.includes('REGISTER')
                  const isFail = item.action.includes('FAIL') || item.action.includes('FAILED')
                  const badgeColor = isSuccess ? 'bg-emerald-500/20 text-emerald-300' : isFail ? 'bg-red-500/20 text-red-300' : 'bg-sky-500/20 text-sky-300'
                  return (
                    <li key={i}>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${badgeColor}`}>{item.action}</span>
                      <span className="truncate">{item.detail ?? '-'}</span>
                      <span className="shrink-0 text-[10px] text-slate-500 tabular-nums">{new Date(item.createdAt).toLocaleTimeString()}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
          <div className="viz-card">
            <h3>📱 访客行为监控</h3>
            <div className="space-y-3.5">
              <div>
                <p className="text-[11px] text-slate-400 mb-2.5 flex items-center gap-1.5">💻 设备类型</p>
                {(dashboard?.behavior.devices ?? []).map((item) => (
                  <div key={`d-${item.name}`} className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] text-slate-300 w-14 shrink-0">{item.name === 'desktop' ? '桌面端' : item.name === 'mobile' ? '移动端' : item.name}</span>
                    <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden relative">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 transition-all duration-700 relative" style={{ width: `${item.ratio}%` }}>
                        {item.ratio >= 15 && <span className="absolute inset-0 flex items-center justify-end pr-1.5 text-[9px] text-white/80 font-medium">{item.ratio}%</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 w-12 text-right tabular-nums">{item.value.toLocaleString()} 次</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-2.5 flex items-center gap-1.5">🌐 浏览器</p>
                {(dashboard?.behavior.browsers ?? []).map((item) => (
                  <div key={`b-${item.name}`} className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] text-slate-300 w-14 shrink-0">{item.name}</span>
                    <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-700 relative" style={{ width: `${item.ratio}%` }}>
                        {item.ratio >= 15 && <span className="absolute inset-0 flex items-center justify-end pr-1.5 text-[9px] text-white/80 font-medium">{item.ratio}%</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 w-12 text-right tabular-nums">{item.value.toLocaleString()} 次</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-2.5 flex items-center gap-1.5">📊 流量来源</p>
                {(dashboard?.behavior.sources ?? []).map((item) => (
                  <div key={`s-${item.name}`} className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] text-slate-300 w-14 shrink-0">{item.name === 'direct' ? '直接访问' : item.name}</span>
                    <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700 relative" style={{ width: `${item.ratio}%` }}>
                        {item.ratio >= 15 && <span className="absolute inset-0 flex items-center justify-end pr-1.5 text-[9px] text-white/80 font-medium">{item.ratio}%</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 w-12 text-right tabular-nums">{item.value.toLocaleString()} 次</span>
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
                <input className="flex-1 min-w-[80px] h-8 rounded-lg border border-slate-400 bg-white/90 px-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white" placeholder="标题" value={imgForm.title} onChange={e => setImgForm(p => ({ ...p, title: e.target.value }))} />
                <input type="file" accept="image/*" onChange={e => setImgFile(e.target.files?.[0] ?? null)} className="flex-1 min-w-[100px] h-8 rounded-lg border border-slate-400 bg-white/90 px-2 text-xs text-slate-700 file:mr-2 file:rounded file:border-0 file:bg-sky-500/20 file:px-2 file:py-0.5 file:text-xs file:text-sky-200" />
                <button className="h-8 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-3 text-xs font-medium text-white hover:from-sky-400 hover:to-indigo-400" onClick={handleSaveImage}>{editingImgId ? '更新' : '添加'}</button>
                {editingImgId && <button className="h-8 rounded-lg border border-slate-300 bg-white/70 px-3 text-xs text-slate-700 hover:bg-white hover:border-slate-400" onClick={() => { setEditingImgId(null); setImgFile(null); setImgForm({ title: '', sortOrder: 0 }) }}>取消</button>}
              </div>
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 custom-scrollbar">
                {adminImages.map(img => (
                  <div key={img.id} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white/70 px-3 py-2">
                    <img src={img.fileUrl} alt={img.title} className="h-8 w-8 shrink-0 rounded object-cover" />
                    <span className="flex-1 truncate text-xs text-slate-700">{img.title}</span>
                    <button className="text-[10px] text-sky-600 hover:text-sky-500" onClick={() => { setImgForm({ title: img.title, sortOrder: img.sortOrder }); setEditingImgId(img.id) }}>编辑</button>
                    <button className="text-[10px] text-red-600 hover:text-red-500" onClick={() => { if (window.confirm('删除？')) mediaApi.deleteImage(img.id).then(fetchMedia) }}>删除</button>
                  </div>
                ))}
                {adminImages.length === 0 && <p className="py-3 text-center text-xs text-slate-500">暂无图片</p>}
              </div>
            </div>

            <div className="viz-card">
              <h3>🎬 视频管理</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <input className="flex-1 min-w-[80px] h-8 rounded-lg border border-slate-400 bg-white/90 px-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white" placeholder="标题" value={vidForm.title} onChange={e => setVidForm(p => ({ ...p, title: e.target.value }))} />
                <input type="file" accept="video/*" onChange={e => setVidFile(e.target.files?.[0] ?? null)} className="flex-1 min-w-[100px] h-8 rounded-lg border border-slate-400 bg-white/90 px-2 text-xs text-slate-700 file:mr-2 file:rounded file:border-0 file:bg-sky-500/20 file:px-2 file:py-0.5 file:text-xs file:text-sky-200" />
                <input className="w-16 h-8 rounded-lg border border-slate-400 bg-white/90 px-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white" placeholder="时长" value={vidForm.duration} onChange={e => setVidForm(p => ({ ...p, duration: e.target.value }))} />
                <button className="h-8 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-3 text-xs font-medium text-white hover:from-sky-400 hover:to-indigo-400" onClick={handleSaveVideo}>{editingVidId ? '更新' : '添加'}</button>
                {editingVidId && <button className="h-8 rounded-lg border border-slate-300 bg-white/70 px-3 text-xs text-slate-700 hover:bg-white hover:border-slate-400" onClick={() => { setEditingVidId(null); setVidFile(null); setVidForm({ title: '', description: '', duration: '', sortOrder: 0 }) }}>取消</button>}
              </div>
              <div className="max-h-[160px] overflow-y-auto space-y-1.5 custom-scrollbar">
                {adminVideos.map(vid => (
                  <div key={vid.id} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white/70 px-3 py-2">
                    <span className="text-xs shrink-0 text-slate-700">▶</span>
                    <span className="flex-1 truncate text-xs text-slate-700">{vid.title}</span>
                    {vid.duration && <span className="text-[10px] text-slate-500 shrink-0">{vid.duration}</span>}
                    <button className="text-[10px] text-sky-600 hover:text-sky-500" onClick={() => { setVidForm({ title: vid.title, description: vid.description ?? '', duration: vid.duration ?? '', sortOrder: vid.sortOrder }); setEditingVidId(vid.id) }}>编辑</button>
                    <button className="text-[10px] text-red-600 hover:text-red-500" onClick={() => { if (window.confirm('删除？')) mediaApi.deleteVideo(vid.id).then(fetchMedia) }}>删除</button>
                  </div>
                ))}
                {adminVideos.length === 0 && <p className="py-3 text-center text-xs text-slate-500">暂无视频</p>}
              </div>
            </div>

            <div className="viz-card">
              <h3>🔔 通知管理</h3>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <select value={notiForm.type} onChange={e => setNotiForm(p => ({ ...p, type: e.target.value }))} className="w-[70px] h-8 rounded-lg border border-slate-400 bg-white/90 px-2 text-xs text-slate-700 outline-none focus:border-sky-500">
                  <option>系统</option><option>互动</option><option>提醒</option><option>消息</option>
                </select>
                <input className="flex-[2] min-w-[140px] h-8 rounded-lg border border-slate-400 bg-white/90 px-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white" placeholder="通知内容" value={notiForm.content} onChange={e => setNotiForm(p => ({ ...p, content: e.target.value }))} />
                <button className="h-8 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 px-3 text-xs font-medium text-white hover:from-sky-400 hover:to-indigo-400" onClick={handleAddNotification}>发送</button>
              </div>
              <div className="max-h-[180px] overflow-y-auto space-y-1.5 custom-scrollbar">
                {notifications.map(item => {
                  const typeColors: Record<string, string> = { '系统': 'bg-red-100 text-red-700', '互动': 'bg-sky-100 text-sky-700', '提醒': 'bg-amber-100 text-amber-700', '消息': 'bg-emerald-100 text-emerald-700' }
                  return (
                    <div key={item.id} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white/70 px-3 py-2">
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColors[item.type] ?? 'bg-slate-100 text-slate-600'}`}>{item.type}</span>
                      <span className="flex-1 truncate text-xs text-slate-700">{item.content}</span>
                      <button className="text-[10px] text-red-600 hover:text-red-500" onClick={() => { if (window.confirm('删除？')) handleDeleteNotification(item.id) }}>删除</button>
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
