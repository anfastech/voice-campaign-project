'use client'

import { usePathname } from 'next/navigation'
import { Bell, Moon, Sun, Sparkles, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview of your voice campaigns' },
  '/campaigns/new': { title: 'New Campaign', subtitle: 'Launch an AI-powered outbound campaign' },
  '/campaigns': { title: 'Campaigns', subtitle: 'Manage and monitor your campaigns' },
  '/agents/new': { title: 'New Agent', subtitle: 'Configure an AI voice agent' },
  '/agents': { title: 'AI Agents', subtitle: 'Your configured voice agents' },
  '/contacts': { title: 'Contacts', subtitle: 'Manage your contact lists' },
  '/calls': { title: 'Call Logs', subtitle: 'Detailed call history and transcripts' },
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl animate-pulse"
        style={{ background: 'var(--muted)' }} />
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative w-9 h-9 rounded-xl flex items-center justify-center',
        'transition-all duration-300 hover:scale-105 active:scale-95',
        'border',
      )}
      style={{
        background: isDark ? 'oklch(1 0 0 / 6%)' : 'oklch(0 0 0 / 4%)',
        borderColor: isDark ? 'oklch(1 0 0 / 10%)' : 'oklch(0 0 0 / 8%)',
        color: 'var(--muted-foreground)',
      }}
      aria-label="Toggle theme"
    >
      <Sun
        className={cn(
          'absolute w-4 h-4 transition-all duration-300',
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        )}
      />
      <Moon
        className={cn(
          'absolute w-4 h-4 transition-all duration-300',
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        )}
      />
    </button>
  )
}

export function Header() {
  const pathname = usePathname()

  const meta =
    Object.entries(pageMeta)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => pathname.startsWith(path))?.[1] ?? {
      title: 'Voice Campaign',
      subtitle: 'AI-powered outbound calls',
    }

  return (
    <header
      className="h-16 flex items-center justify-between px-6 sticky top-0 z-40"
      style={{
        background: 'var(--background)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Left: breadcrumb + title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs mb-0.5" style={{ color: 'var(--muted-foreground)' }}>
            <Sparkles className="w-3 h-3 flex-shrink-0" style={{ color: 'oklch(0.68 0.22 281)' }} />
            <span>VoiceCampaign</span>
            <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-40" />
            <span className="truncate">{meta.title}</span>
          </div>
          <h1 className="text-lg font-bold leading-tight truncate" style={{ color: 'var(--foreground)' }}>
            {meta.title}
          </h1>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Subtitle pill — hidden on small screens */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mr-2"
          style={{
            background: 'oklch(0.49 0.263 281 / 8%)',
            color: 'oklch(0.49 0.263 281)',
            border: '1px solid oklch(0.49 0.263 281 / 15%)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
          {meta.subtitle}
        </div>

        <ThemeToggle />

        {/* Notification bell */}
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border"
          style={{
            background: 'oklch(1 0 0 / 4%)',
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)',
          }}
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2"
            style={{
              background: 'oklch(0.59 0.245 15)',
              borderColor: 'var(--background)',
            }}
          />
        </button>

        {/* User avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
            boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
          }}
        >
          A
        </div>
      </div>
    </header>
  )
}
