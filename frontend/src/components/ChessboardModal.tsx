import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { http } from '../services/http'

interface ChessboardModalProps {
  open: boolean
  onClose: () => void
}

const tabs = ['AI', '社区', '实用工具', '留言版', '通知中心'] as const
type TabKey = (typeof tabs)[number]

const aiModels = [
  { name: 'DeepSeek', logo: '/ai_logo/deepseek.png', desc: '深度求索 · 长文本推理', url: 'https://chat.deepseek.com', glow: 'rgba(59,130,246,0.3)', border: 'border-blue-400/30' },
  { name: '豆包', logo: '/ai_logo/doubao.png', desc: '字节跳动 · 多模态交互', url: 'https://www.doubao.com', glow: 'rgba(34,211,238,0.3)', border: 'border-cyan-400/30' },
  { name: 'Kimi', logo: '/ai_logo/kimi.png', desc: '月之暗面 · 超长记忆', url: 'https://kimi.moonshot.cn', glow: 'rgba(168,85,247,0.3)', border: 'border-purple-400/30' },
  { name: 'Qwen', logo: '/ai_logo/qwen.png', desc: '阿里 · 企业级覆盖', url: 'https://tongyi.aliyun.com', glow: 'rgba(249,115,22,0.3)', border: 'border-orange-400/30' },
  { name: 'Gemini', logo: '/ai_logo/gemini.png', desc: 'Google · 跨领域推理', url: 'https://gemini.google.com', glow: 'rgba(96,165,250,0.3)', border: 'border-sky-400/30' },
  { name: 'Claude', logo: '/ai_logo/Claude.png', desc: 'Anthropic · 安全对齐', url: 'https://claude.ai', glow: 'rgba(245,158,11,0.3)', border: 'border-amber-400/30' },
  { name: 'Grok', logo: '/ai_logo/grok.png', desc: 'xAI · 实时幽默交互', url: 'https://grok.com', glow: 'rgba(239,68,68,0.3)', border: 'border-red-400/30' },
  { name: 'YiYan', logo: '/ai_logo/yiyan.png', desc: '百度 · 中文深度优化', url: 'https://yiyan.baidu.com', glow: 'rgba(34,197,94,0.3)', border: 'border-green-400/30' },
  { name: 'ChatGPT', logo: '/ai_logo/chatgpt.jpg', desc: 'OpenAI · 通用生态', url: 'https://chat.openai.com', glow: 'rgba(14,165,233,0.3)', border: 'border-sky-400/30' },
]

const techCommunities = [
  { name: 'CSDN', url: 'https://www.csdn.net', desc: '中国最大开发者社区', color: 'from-red-500 to-orange-500' },
  { name: '掘金', url: 'https://juejin.cn', desc: '前端技术分享平台', color: 'from-blue-500 to-sky-500' },
  { name: 'SegmentFault', url: 'https://segmentfault.com', desc: '技术问答社区', color: 'from-green-500 to-teal-500' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', desc: '全球程序员问答', color: 'from-orange-400 to-amber-500' },
  { name: 'GitHub', url: 'https://github.com', desc: '开源代码托管平台', color: 'from-slate-500 to-slate-700' },
  { name: '知乎', url: 'https://www.zhihu.com', desc: '技术话题讨论', color: 'from-blue-600 to-indigo-600' },
]

const toolLinks = [
  { name: 'VS Code', url: 'https://code.visualstudio.com', icon: '💻', desc: '最强代码编辑器' },
  { name: 'PyCharm', url: 'https://www.jetbrains.com/pycharm/', icon: '🐍', desc: 'Python 开发利器' },
  { name: 'IntelliJ IDEA', url: 'https://www.jetbrains.com/idea/', icon: '☕', desc: 'Java 开发首选 IDE' },
  { name: 'Docker Desktop', url: 'https://www.docker.com/products/docker-desktop/', icon: '🐳', desc: '容器化开发环境' },
  { name: 'Postman', url: 'https://www.postman.com', icon: '📮', desc: 'API 调试测试工具' },
  { name: 'Navicat', url: 'https://www.navicat.com', icon: '🗄️', desc: '数据库可视化管理' },
  { name: 'Typora', url: 'https://typora.io', icon: '📝', desc: 'Markdown 写作神器' },
  { name: 'Obsidian', url: 'https://obsidian.md', icon: '📓', desc: '知识库笔记管理' },
  { name: 'Xshell', url: 'https://www.netsarang.com/xshell/', icon: '🖥️', desc: 'SSH 远程连接终端' },
  { name: 'GitHub Desktop', url: 'https://desktop.github.com', icon: '🔀', desc: 'Git 图形化管理' },
  { name: 'Chrome', url: 'https://www.google.com/chrome/', icon: '🌐', desc: '开发者首选浏览器' },
  { name: 'Snipaste', url: 'https://www.snipaste.com', icon: '✂️', desc: '截图贴图效率工具' },
]

interface Message {
  id: string
  username: string
  content: string
  createdAt: string
}

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return '刚刚'
  if (sec < 3600) return `${Math.floor(sec / 60)} 分钟前`
  if (sec < 86400) return `${Math.floor(sec / 3600)} 小时前`
  return `${Math.floor(sec / 86400)} 天前`
}

export function ChessboardModal({ open, onClose }: ChessboardModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('AI')
  const overlayRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [msgInput, setMsgInput] = useState('')
  const [sending, setSending] = useState(false)
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; content: string; createdAt: string }>>([])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await http.get('/notifications')
      setNotifications(res.data ?? [])
    } catch { setNotifications([]) }
  }, [])

  const fetchMessages = useCallback(async () => {
    try {
      const res = await http.get('/messages', { params: { page: 1 } })
      setMessages(res.data.items ?? [])
    } catch {
      setMessages([])
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setActiveTab('AI')
    fetchMessages()
    fetchNotifications()
    if (overlayRef.current) gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
    if (cardRef.current) gsap.fromTo(cardRef.current, { scale: 0.9, y: 28, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' })
  }, [open, fetchMessages])

  const handleClose = () => {
    if (cardRef.current) gsap.to(cardRef.current, { scale: 0.94, y: 12, opacity: 0, duration: 0.25, ease: 'power2.in' })
    if (overlayRef.current) gsap.to(overlayRef.current, { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: onClose })
    else onClose()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const handleSendMessage = async () => {
    const content = msgInput.trim()
    if (!content || sending) return
    setSending(true)
    try {
      await http.post('/messages', { username: '匿名用户', content })
      setMsgInput('')
      await fetchMessages()
    } catch {
      // fallback: show locally
      setMessages((prev) => [{ id: Date.now().toString(), username: '我', content, createdAt: new Date().toISOString() }, ...prev])
      setMsgInput('')
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2, 6, 23, 0.72)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        ref={cardRef}
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/20 mx-2 sm:mx-0"
        style={{
          background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.92) 0%, rgba(19, 27, 48, 0.84) 100%)',
          boxShadow: '0 28px 72px rgba(2, 6, 23, 0.68), inset 0 1px 0 rgba(255,255,255,0.08)',
          minHeight: '380px',
          maxHeight: '90vh',
        }}
      >
        {/* Glow */}
        <div className="pointer-events-none absolute -inset-1 opacity-30" style={{ background: 'radial-gradient(circle at 28% 20%, rgba(56,189,248,0.22), transparent 50%), radial-gradient(circle at 72% 78%, rgba(168,85,247,0.18), transparent 50%)' }} />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white/70 backdrop-blur transition hover:bg-white/20 hover:text-white"
          aria-label="关闭"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Tab Bar */}
        <div className="relative z-10 flex border-b border-white/10 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 whitespace-nowrap px-3 py-3.5 text-xs sm:text-sm font-medium tracking-wide transition-colors ${
                activeTab === tab ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #38bdf8, #a78bfa)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">

          {/* AI 模块 */}
          {activeTab === 'AI' && (
            <div>
              <h3 className="mb-1 text-lg font-semibold text-white">🤖 AI 模型集成</h3>
              <p className="mb-4 text-xs text-slate-400">星辰入梦化诗行，万象生辉笔墨间。</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {aiModels.map((model) => (
                  <a
                    key={model.name}
                    href={model.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    style={{ boxShadow: `0 0 0 0 ${model.glow}` }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 30px ${model.glow}, 0 0 0 1px ${model.glow}` }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 0 0 ${model.glow}` }}
                  >
                    <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white/10 transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110 group-hover:shadow-lg">
                      <div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: `radial-gradient(circle at center, ${model.glow}, transparent 70%)` }} />
                      <img src={model.logo} alt={model.name} className="relative z-10 h-12 w-12 rounded-xl object-cover drop-shadow-sm" loading="lazy" />
                    </div>
                    <span className="text-sm font-semibold text-white group-hover:text-sky-200 transition-colors">{model.name}</span>
                    <span className="text-[11px] text-slate-400 text-center leading-snug">{model.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 社区模块 */}
          {activeTab === '社区' && (
            <div>
              <h3 className="mb-1 text-lg font-semibold text-white">💬 推荐技术社区</h3>
              <p className="mb-4 text-xs text-slate-400">志合者不以山海为远，同道者共赴星河长路。</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {techCommunities.map((site) => (
                  <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer"
                    className={`group flex flex-col items-center gap-2 rounded-xl bg-gradient-to-br ${site.color} p-5 text-center transition-all hover:scale-[1.03] hover:shadow-xl`}>
                    <span className="text-lg font-semibold text-white">{site.name}</span>
                    <span className="text-xs text-white/75">{site.desc}</span>
                    <span className="mt-1 rounded-full bg-white/20 px-3 py-1 text-[10px] text-white/80 transition group-hover:bg-white/30">进入站点 →</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 实用工具模块 */}
          {activeTab === '实用工具' && (
            <div>
              <h3 className="mb-1 text-lg font-semibold text-white">🔧 常用软件</h3>
              <p className="mb-4 text-xs text-slate-400">善工者先利其器，妙手者独具匠心。</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {toolLinks.map((tool) => (
                  <a
                    key={tool.name}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-center transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/10 cursor-pointer"
                  >
                    <span className="text-2xl transition group-hover:scale-110">{tool.icon}</span>
                    <span className="text-xs font-medium text-slate-200">{tool.name}</span>
                    <span className="text-[10px] text-slate-400">{tool.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 留言版模块 */}
          {activeTab === '留言版' && (
            <div>
              <h3 className="mb-1 text-lg font-semibold text-white">📝 留言版</h3>
              <p className="mb-4 text-xs text-slate-400">清风拂纸寄心语，明月照人知我音。</p>

              {/* Input */}
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage() }}
                  placeholder="输入留言内容..."
                  className="flex-1 rounded-xl border border-white/30 bg-white/15 px-4 py-3 text-sm text-white placeholder-slate-300 outline-none ring-0 transition focus:border-sky-400/60 focus:bg-white/20 focus:shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition hover:from-sky-400 hover:to-indigo-400 active:scale-[0.98]"
                >
                  发送
                </button>
              </div>

              {/* Messages */}
              {messages.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-500">暂无留言，来说两句吧</p>
              )}
              <div className="flex flex-col gap-2">
                {messages.map((msg) => (
                  <div key={msg.id} className="rounded-xl border border-white/8 bg-white/4 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-sky-300">{msg.username}</span>
                      <span className="text-[10px] text-slate-500">{formatTime(msg.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 通知中心模块 */}
          {activeTab === '通知中心' && (
            <div>
              <h3 className="mb-1 text-lg font-semibold text-white">🔔 通知中心</h3>
              <p className="mb-4 text-xs text-slate-400">风起云涌知天下，一叶落而知秋至。</p>

              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-500">暂无通知</p>
                ) : (
                  notifications.map((item) => {
                    const colors: Record<string, string> = {
                      '系统': 'bg-red-500/20 text-red-300',
                      '互动': 'bg-sky-500/20 text-sky-300',
                      '提醒': 'bg-amber-500/20 text-amber-300',
                      '消息': 'bg-emerald-500/20 text-emerald-300',
                    }
                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3 transition-all hover:border-white/20 hover:bg-white/8">
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${colors[item.type] ?? 'bg-slate-500/20 text-slate-300'}`}>{item.type}</span>
                        <span className="flex-1 text-xs text-slate-300 truncate">{item.content}</span>
                        <span className="shrink-0 text-[10px] text-slate-500">{formatTime(item.createdAt)}</span>
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Close */}
        <div className="relative z-10 border-t border-white/10 px-6 py-3 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-white/20 bg-white/8 px-5 py-2 text-xs font-medium text-white/70 backdrop-blur transition hover:bg-white/14 hover:text-white"
          >
            关闭窗口
          </button>
        </div>
      </div>
    </div>
  )
}
