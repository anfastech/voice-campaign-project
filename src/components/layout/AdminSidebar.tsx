'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bot, Zap, BookOpen, BarChart3, Settings,
  Users, UsersRound, Palette, Menu, Radio,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const overallItems = [
  { href: '/live', label: 'Live Monitor', icon: Radio },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

const agentItems = [
  { href: '/agents', label: 'Your Agents', icon: Bot },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
]

const adminItems = [
  { href: '/clients', label: 'Clients', icon: UsersRound },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/branding', label: 'Branding', icon: Palette },
  { href: '/menu', label: 'Custom Menu', icon: Menu },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/analytics') return pathname === '/analytics' || pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-w-[256px] min-h-screen flex flex-col bg-sidebar border-r border-sidebar-border shrink-0">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-primary-foreground" fill="currentColor" />
        </div>
        <span className="font-semibold text-sm text-sidebar-foreground">VoiceCampaign</span>
      </div>

      <Separator />

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 pb-2">
          Overall
        </p>
        {overallItems.map((item) => {
          const Icon = item.icon
          const active = isActive(pathname, item.href)
          return (
            <Link key={item.href} href={item.href} prefetch className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <Separator className="my-3" />

        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 pb-2">
          Agents
        </p>
        {agentItems.map((item) => {
          const Icon = item.icon
          const active = isActive(pathname, item.href)
          return (
            <Link key={item.href} href={item.href} prefetch className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <Separator className="my-3" />

        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 pb-2">
          Admin
        </p>
        {adminItems.map((item) => {
          const Icon = item.icon
          const active = isActive(pathname, item.href)
          return (
            <Link key={item.href} href={item.href} prefetch className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-4">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
            A
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">Admin</p>
            <p className="text-xs text-muted-foreground truncate">Agency Owner</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
