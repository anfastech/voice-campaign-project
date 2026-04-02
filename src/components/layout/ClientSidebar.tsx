'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bot, Zap, BarChart3, MessageSquare, Users, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const navItems = [
  { href: '/client/dashboard', label: 'Analytics', icon: BarChart3 },
  { href: '/client/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/client/contacts', label: 'Contacts', icon: Users },
  { href: '/client/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/client/agents', label: 'Agents', icon: Bot },
]

export function ClientSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-w-[256px] min-h-screen flex flex-col bg-sidebar border-r border-sidebar-border shrink-0">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-primary-foreground" fill="currentColor" />
        </div>
        <span className="font-semibold text-sm text-sidebar-foreground">Voice Platform</span>
      </div>

      <Separator />

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
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
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
            C
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">Client</p>
            <p className="text-xs text-muted-foreground truncate">Dashboard</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
