'use client'

import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Moon, Sun, RefreshCw, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const pageTitles: Record<string, string> = {
  '/campaigns/new': 'New Campaign',
  '/campaigns': 'Campaigns',
  '/agents/new': 'New Agent',
  '/agents': 'AI Agents',
  '/contacts': 'Contacts',
  '/conversations': 'Conversations',
  '/analytics': 'Analytics',
  '/knowledge-base': 'Knowledge Base',
  '/settings': 'Settings',
  '/account': 'Account',
}

export function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const title =
    Object.entries(pageTitles)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => pathname.startsWith(path))?.[1] ?? 'Voice Campaign'

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background sticky top-0 z-40">
      {/* Left: title */}
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>

      {/* Right: date + actions */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground hidden md:block">
          Updated {dateStr}
        </span>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.location.reload()}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>

        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    </header>
  )
}
