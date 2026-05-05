import { Component } from 'react'

interface Props { children: React.ReactNode; fallback?: React.ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() { return { hasError: true } }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl border border-red-300/40 bg-red-500/5 p-8">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm text-slate-500">组件加载失败，请刷新页面重试</p>
          <button className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50" onClick={() => this.setState({ hasError: false })}>重试</button>
        </div>
      )
    }
    return this.props.children
  }
}
