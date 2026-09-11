'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, RefreshCw, TrendingUp, Package, HelpCircle } from 'lucide-react'

type Message = {
  role: 'ai' | 'user'
  text: string
  timestamp: Date
}

type AIInsight = {
  type: string
  priority: string
  icon: string
  title: string
  description: string
  recommendation: string
  reasoning?: string
  impact?: string
}

const quickActions = [
  { label: 'AI Business Insight', icon: Sparkles, prompt: 'Berikan insight bisnis terbaru dari data saya.' },
  { label: 'Rekomendasi restock', icon: Package, prompt: 'Produk apa saja yang perlu di-restok dan seberapa banyak?' },
  { label: 'Analisis profit', icon: TrendingUp, prompt: 'Analisis profit dan margin kami. Produk mana yang paling menguntungkan?' },
  { label: 'Tanya kondisi bisnis', icon: HelpCircle, prompt: 'Bagaimana kondisi bisnis saya bulan ini?' },
]

export default function AIAdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [insightsLoading, setInsightsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchInsights() {
    setInsightsLoading(true)
    try {
      const res = await fetch('/api/ai-insights')
      if (res.ok) {
        const data = await res.json()
        setInsights(data.insights || [])
      }
    } catch (err) {
      console.error('Failed to fetch AI insights:', err)
    } finally {
      setInsightsLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendMessage(text: string) {
    if (!text.trim()) return

    const userMessage: Message = { role: 'user', text, timestamp: new Date() }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      const res = await fetch('/api/ai-advisor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({ role: m.role, content: m.text })),
        }),
      })

      const data = await res.json()
      if (res.ok) {
        const aiMessage: Message = {
          role: 'ai',
          text: data.reply || 'Maaf, saya tidak dapat memproses permintaan Anda.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
      } else {
        const aiMessage: Message = {
          role: 'ai',
          text: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiMessage])
      }
    } catch (err) {
      const aiMessage: Message = {
        role: 'ai',
        text: 'Terjadi kesalahan jaringan. Periksa koneksi Anda dan coba lagi.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } finally {
      setLoading(false)
    }
  }

  function handleQuickAction(prompt: string) {
    sendMessage(prompt)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
    setInput('')
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Intelligence layer</p>
          <h1 className="page-title">AI Advisor</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your AI-powered business decision assistant.</p>
        </div>
        <span className="badge-lime">
          <span className="mr-1">✨</span> Context-aware
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AI Business Insights</p>
              <h2 className="section-title">Insights</h2>
            </div>
            <button
              onClick={fetchInsights}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
              aria-label="Refresh insights"
            >
              <RefreshCw className="size-3" />
              Refresh
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {insightsLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Menganalisis data bisnis...</div>
            ) : insights.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Belum ada insight tersedia.</div>
            ) : (
              insights.map((insight, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-xl border border-border p-3"
                >
                  <span className="text-lg">{insight.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{insight.title}</p>
                      <span
                        className={`text-[10px] font-semibold ${
                          insight.priority === 'CRITICAL' || insight.priority === 'HIGH'
                            ? 'text-destructive'
                            : insight.priority === 'MEDIUM'
                            ? 'text-amber-600'
                            : 'text-accent-foreground'
                        }`}
                      >
                        {insight.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-xs">{insight.description}</p>
                    {insight.recommendation && (
                      <p className="mt-1 text-xs italic">→ {insight.recommendation}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="advisor-shell">
          <div className="flex items-center gap-3 border-b border-border p-5">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-accent">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <p className="font-semibold">FashionBiz AI Advisor</p>
              <p className="text-xs text-muted-foreground">
                Analyzing your sales, inventory, and profit data
              </p>
            </div>
            <span className="ml-auto size-2 rounded-full bg-accent" />
          </div>

          <div className="flex min-h-[360px] flex-col gap-4 p-5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <p className="font-semibold">Hai! Saya AI Advisor FashionBiz.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Saya menganalisis data penjualan, stok, dan profit Anda untuk memberikan rekomendasi yang dipersonalisasi.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={message.role === 'user' ? 'user-bubble' : 'ai-bubble'}
                >
                  {message.role === 'ai' && <Sparkles className="mt-0.5 mr-2 size-4 text-accent" />}
                  <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                  <span className="ml-2 text-[10px] text-muted-foreground/50">
                    {message.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
            {loading && (
              <div className="ai-bubble">
                <Sparkles className="mt-0.5 mr-2 size-4 text-accent animate-pulse" />
                <p className="text-sm">Sedang menganalisis...</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="prompt-chip flex items-center gap-1.5"
                  disabled={loading}
                >
                  <Icon className="size-3" />
                  {action.label}
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="field flex-1"
              placeholder="Tanya tentang kondisi bisnis Anda..."
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="button-primary px-4"
              aria-label="Send question"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
