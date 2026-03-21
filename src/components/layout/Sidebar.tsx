'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Megaphone,
  Bot,
  Users,
  Phone,
  Zap,
  Activity,
  BookOpen,
} from 'lucide-react'
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/agents', label: 'AI Agents', icon: Bot },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/calls', label: 'Call Logs', icon: Phone },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(href + '/')
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: '256px',
        minWidth: '256px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border)',
        position: 'relative',
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Decorative blobs — completely inert */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-5rem',
          left: '-5rem',
          width: '14rem',
          height: '14rem',
          borderRadius: '9999px',
          background: 'oklch(0.68 0.22 281)',
          opacity: 0.15,
          filter: 'blur(48px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '5rem',
          right: '-2.5rem',
          width: '10rem',
          height: '10rem',
          borderRadius: '9999px',
          background: 'oklch(0.6 0.19 220)',
          opacity: 0.08,
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content wrapper — sits above blobs */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.25rem',
            borderBottom: '1px solid var(--sidebar-border)',
          }}
        >
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
              boxShadow: '0 0 20px oklch(0.68 0.22 281 / 40%)',
            }}
          >
            <Zap style={{ width: '1rem', height: '1rem', color: 'white' }} fill="white" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2, color: 'var(--sidebar-foreground)', letterSpacing: '-0.01em' }}>
              VoiceCampaign
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
              <span className="live-dot" style={{ width: '0.375rem', height: '0.375rem', borderRadius: '9999px', background: '#34d399', flexShrink: 0, display: 'inline-block' }} />
              <p style={{ fontSize: '0.7rem', color: 'oklch(0.62 0.015 285)' }}>AI Voice · Live</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <p style={{ fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.25rem 0.75rem 0.5rem', color: 'oklch(0.45 0.015 285)' }}>
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  ...(active
                    ? {
                        background: 'linear-gradient(135deg, oklch(0.49 0.263 281 / 90%), oklch(0.58 0.24 300 / 90%))',
                        boxShadow: '0 4px 15px oklch(0.49 0.263 281 / 30%), inset 0 1px 0 oklch(1 0 0 / 15%)',
                        color: 'white',
                      }
                    : {
                        color: 'oklch(0.65 0.015 285)',
                      }),
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'white'
                    e.currentTarget.style.background = 'oklch(1 0 0 / 6%)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'oklch(0.65 0.015 285)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '0.5rem',
                    flexShrink: 0,
                    background: active ? 'oklch(1 0 0 / 20%)' : 'transparent',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <Icon style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0 }} />
                </span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
                {active && (
                  <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '9999px', background: 'oklch(1 0 0 / 60%)', flexShrink: 0, display: 'inline-block' }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom status card */}
        <div style={{ padding: '0 0.75rem 1rem' }}>
          <div
            style={{
              borderRadius: '0.75rem',
              padding: '0.75rem',
              background: 'oklch(1 0 0 / 4%)',
              border: '1px solid oklch(1 0 0 / 6%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'oklch(0.55 0.215 163 / 20%)' }}>
                <Activity style={{ width: '0.875rem', height: '0.875rem', color: 'oklch(0.65 0.19 163)' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'oklch(0.85 0.008 285)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Providers Active
                </p>
                <p style={{ fontSize: '0.625rem', color: 'oklch(0.55 0.015 285)' }}>
                  Ultravox · ElevenLabs · VAPI
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { label: 'Ultravox', color: 'oklch(0.49 0.263 281)', pct: 95 },
                { label: 'ElevenLabs', color: 'oklch(0.55 0.215 163)', pct: 88 },
                { label: 'VAPI', color: 'oklch(0.72 0.18 68)', pct: 92 },
              ].map(({ label, color, pct }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.5625rem', width: '3.5rem', flexShrink: 0, color: 'oklch(0.55 0.015 285)' }}>{label}</span>
                  <div style={{ flex: 1, height: '3px', borderRadius: '9999px', background: 'oklch(1 0 0 / 6%)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '9999px', background: color, width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
