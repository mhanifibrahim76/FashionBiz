'use client'

import { signOut, useSession } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function TopHeader() {
  const { data: session } = useSession()

  if (!session?.user) return null

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/80 bg-background/90 px-5 py-3 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <div className="lg:hidden">
          <span className="font-semibold">FashionBiz AI</span>
        </div>
        <div className="hidden md:block">
          <p className="eyebrow">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 border-l border-border pl-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {session.user.name?.charAt(0) || 'U'}
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold">{session.user.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {session.user.business?.name || session.user.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex h-8 items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 text-destructive transition-all hover:scale-105 hover:font-bold"
          aria-label="Logout"
          title="Logout"
        >
          <LogOut className="size-4" />
          <span className="hidden text-xs sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
