'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Bot, Zap, BarChart3, MessageSquare, Users, Megaphone, Target,
  Link as LinkIcon, FileText, HelpCircle, BookOpen, ExternalLink,
  Globe, Mail, Calendar, Clipboard, Star, Heart, Shield, Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import type { LucideIcon } from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Link: LinkIcon, FileText, HelpCircle, BookOpen, ExternalLink,
  Globe, Mail, Calendar, Clipboard, Star, Heart, Zap, Shield, Bell,
}

const navItems = [
  { href: '/client/dashboard', label: 'Analytics', icon: BarChart3 },
  { href: '/client/conversations', label: 'Conversations', icon: MessageSquare },
  { href: '/client/contacts', label: 'Contacts', icon: Users },
  { href: '/client/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/client/leads', label: 'Leads', icon: Target },
  { href: '/client/agents', label: 'Agents', icon: Bot },
]

export function ClientSidebar() {
  const pathname = usePathname()

  const { data: customItems } = useQuery({
    queryKey: ['client-menu'],
    queryFn: () => fetch('/api/client/menu').then((r) => r.json()),
    staleTime: 60_000,
  })

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

        {Array.isArray(customItems) && customItems.length > 0 && (
          <>
            <Separator className="my-3" />
            {customItems.map((item: { id: string; label: string; url: string; icon: string }) => {
              const Icon = ICON_MAP[item.icon] || LinkIcon
              const isExternal = item.url.startsWith('http')
              return (
                <Link
                  key={item.id}
                  href={item.url}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {isExternal && <ExternalLink className="w-3 h-3 shrink-0 ml-auto opacity-50" />}
                </Link>
              )
            })}
          </>
        )}
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
