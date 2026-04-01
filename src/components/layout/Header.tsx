'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Bell, Moon, Sun, Sparkles, ChevronRight, LogOut, User, Phone, Megaphone, CheckCircle2, XCircle, PhoneMissed, Settings } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/campaigns/new': { title: 'New Campaign', subtitle: 'Launch an AI-powered outbound campaign' },
  '/campaigns': { title: 'Campaigns', subtitle: 'Manage and monitor your campaigns' },
  '/agents/new': { title: 'New Agent', subtitle: 'Configure an AI voice agent' },
  '/agents': { title: 'AI Agents', subtitle: 'Your configured AI agents' },
  '/contacts': { title: 'Contacts', subtitle: 'Manage your contact lists' },
  '/conversations': { title: 'Conversations', subtitle: 'Call history and transcripts' },
  '/analytics': { title: 'Analytics', subtitle: 'Deep insights into campaign performance' },
  '/knowledge-base': { title: 'Knowledge Base', subtitle: 'Manage agent knowledge documents' },
  '/settings': { title: 'Settings', subtitle: 'Platform configuration and API keys' },
  '/account': { title: 'Account', subtitle: 'Your profile and preferences' },
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

interface NotificationItem {
  id: string
  type: 'call_completed' | 'call_failed' | 'campaign_completed' | 'no_answer'
  title: string
  description: string
  time: string
}

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)

  // Fetch recent events for notifications
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats')
      if (!res.ok) return null
      return res.json()
    },
    refetchInterval: 30000,
  })

  // Generate notification items from recent calls
  const notifications: NotificationItem[] = (data?.recentCalls ?? [])
    .slice(0, 5)
    .map((call: any) => {
      const typeMap: Record<string, NotificationItem['type']> = {
        COMPLETED: 'call_completed',
        FAILED: 'call_failed',
        NO_ANSWER: 'no_answer',
      }
      const type = typeMap[call.status] || 'call_completed'
      const contactName = call.contact?.name || call.phoneNumber || 'Unknown'

      return {
        id: call.id,
        type,
        title: call.status === 'COMPLETED'
          ? `Call completed`
          : call.status === 'FAILED'
            ? `Call failed`
            : `No answer`,
        description: `${contactName}${call.agent ? ` — ${call.agent.name}` : ''}`,
        time: call.startedAt
          ? new Date(call.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          : '',
      }
    })

  const iconMap: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
    call_completed: { icon: CheckCircle2, bg: 'oklch(0.55 0.215 163 / 12%)', color: 'oklch(0.55 0.215 163)' },
    call_failed: { icon: XCircle, bg: 'oklch(0.59 0.245 15 / 12%)', color: 'oklch(0.59 0.245 15)' },
    campaign_completed: { icon: Megaphone, bg: 'oklch(0.49 0.263 281 / 12%)', color: 'oklch(0.49 0.263 281)' },
    no_answer: { icon: PhoneMissed, bg: 'oklch(0.72 0.18 68 / 12%)', color: 'oklch(0.72 0.18 68)' },
  }

  const hasNotifications = notifications.length > 0

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border"
          style={{
            background: 'oklch(1 0 0 / 4%)',
            borderColor: 'var(--border)',
            color: 'var(--muted-foreground)',
          }}
        >
          <Bell className="w-4 h-4" />
          {hasNotifications && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2"
              style={{
                background: 'oklch(0.59 0.245 15)',
                borderColor: 'var(--background)',
              }}
            />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Notifications</p>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'oklch(0.49 0.263 281 / 10%)', color: 'oklch(0.49 0.263 281)' }}>
            {notifications.length} new
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Bell className="w-5 h-5 mb-2" style={{ color: 'var(--muted-foreground)', opacity: 0.4 }} />
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No recent notifications</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notif, idx) => {
              const { icon: Icon, bg, color } = iconMap[notif.type] || iconMap.call_completed
              return (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors"
                  style={{
                    borderBottom: idx < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--muted)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: bg }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--muted-foreground)' }}>
                      {notif.description}
                    </p>
                  </div>
                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                    {notif.time}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--border)' }}>
          <a
            href="/conversations"
            className="text-xs font-medium block text-center transition-colors"
            style={{ color: 'oklch(0.49 0.263 281)' }}
          >
            View all activity
          </a>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu() {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
            boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
          }}
        >
          A
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <User className="w-4 h-4 mr-2" />
          Account
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/')}>
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  )
}
