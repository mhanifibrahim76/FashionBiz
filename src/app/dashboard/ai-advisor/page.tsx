import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

const dummyMessages = [
  {
    role: 'ai',
    text: 'Hi there. I analyze your store data to help you make sharper inventory and pricing decisions. Ask me anything about your business.',
  },
  {
    role: 'user',
    text: 'What should I restock this week?',
  },
  {
    role: 'ai',
    text: 'Based on your last 30 days of sales, I recommend prioritizing Kaos Oversize Hitam (size M) and Hoodie Basic Hitam. Celana Cargo Khaki is running low and has consistent demand. Avoid restocking Kemeja Casual Putih for now — stock is healthy at 18 units against estimated 8-unit monthly demand.',
  },
  {
    role: 'user',
    text: 'Why did profit drop last week?',
  },
  {
    role: 'ai',
    text: 'Profit margin dipped from 31% to 24% due to a 12% increase in fabric cost from your supplier. I suggest adjusting the selling price of Jaket Denim by 8-10% to protect margin, or negotiating a bulk order discount with your current supplier.',
  },
]

const prompts = [
  'What should I restock?',
  'Why did profit drop?',
  'Which products are most profitable?',
  'Will a 20% discount still be profitable?',
]

export default async function AIAdvisorPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const products = await prisma.product.findMany({
    where: { businessId: session.user.business.id },
    include: { variants: true },
  })

  const lowStock = products.filter(p => p.variants.some(v => v.stock <= p.minStock)).length

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-7">
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
          {dummyMessages.map((message, index) => (
            <div
              key={index}
              className={message.role === 'user' ? 'user-bubble' : 'ai-bubble'}
            >
              {message.role === 'ai' && <span className="mt-0.5 mr-2 text-accent-foreground">✨</span>}
              <p>{message.text}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              className="prompt-chip"
            >
              {prompt}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
          }}
          className="flex gap-2 border-t border-border p-4"
        >
          <input
            className="field"
            placeholder="Ask about your business..."
          />
          <button className="button-primary px-4" aria-label="Send question">
            <span>Send</span>
          </button>
        </form>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        AI recommendations are estimates based only on the data available in your workspace.
      </p>
    </div>
  )
}