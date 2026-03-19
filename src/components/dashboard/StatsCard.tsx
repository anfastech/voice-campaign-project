import { memo } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'violet' | 'emerald' | 'rose' | 'amber' | 'sky'
  trend?: number // positive = up, negative = down
}

const colorTokens = {
  violet: {
    orb: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
    orbGlow: 'oklch(0.49 0.263 281 / 30%)',
    badge: 'oklch(0.49 0.263 281 / 10%)',
    badgeText: 'oklch(0.49 0.263 281)',
    accent: 'oklch(0.49 0.263 281)',
  },
  emerald: {
    orb: 'linear-gradient(135deg, oklch(0.55 0.215 163), oklch(0.65 0.19 150))',
    orbGlow: 'oklch(0.55 0.215 163 / 30%)',
    badge: 'oklch(0.55 0.215 163 / 10%)',
    badgeText: 'oklch(0.45 0.215 163)',
    accent: 'oklch(0.55 0.215 163)',
  },
  rose: {
    orb: 'linear-gradient(135deg, oklch(0.59 0.245 15), oklch(0.7 0.22 25))',
    orbGlow: 'oklch(0.59 0.245 15 / 30%)',
    badge: 'oklch(0.59 0.245 15 / 10%)',
    badgeText: 'oklch(0.52 0.245 15)',
    accent: 'oklch(0.59 0.245 15)',
  },
  amber: {
    orb: 'linear-gradient(135deg, oklch(0.72 0.18 68), oklch(0.82 0.17 82))',
    orbGlow: 'oklch(0.72 0.18 68 / 30%)',
    badge: 'oklch(0.72 0.18 68 / 10%)',
    badgeText: 'oklch(0.55 0.18 68)',
    accent: 'oklch(0.72 0.18 68)',
  },
  sky: {
    orb: 'linear-gradient(135deg, oklch(0.6 0.19 220), oklch(0.7 0.17 235))',
    orbGlow: 'oklch(0.6 0.19 220 / 30%)',
    badge: 'oklch(0.6 0.19 220 / 10%)',
    badgeText: 'oklch(0.5 0.19 220)',
    accent: 'oklch(0.6 0.19 220)',
  },
}

export const StatsCard = memo(function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'violet',
  trend,
}: StatsCardProps) {
  const tokens = colorTokens[color]

  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden group cursor-default transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 3px oklch(0 0 0 / 4%), 0 4px 24px oklch(0 0 0 / 3%)',
      }}
    >
      {/* Subtle gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${tokens.badge}, transparent 70%)`,
        }}
      />

      {/* Corner accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{ background: tokens.orb, opacity: 0.6 }}
      />

      <div className="relative flex items-start justify-between">
        {/* Icon orb */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-105"
          style={{
            background: tokens.orb,
            boxShadow: `0 4px 16px ${tokens.orbGlow}`,
          }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Trend badge */}
        {trend !== undefined && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: trend >= 0 ? 'oklch(0.55 0.215 163 / 12%)' : 'oklch(0.59 0.245 15 / 12%)',
              color: trend >= 0 ? 'oklch(0.45 0.215 163)' : 'oklch(0.52 0.245 15)',
            }}
          >
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      <div className="relative mt-4">
        <p className="text-[13px] font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
          {title}
        </p>
        <p className="text-[28px] font-bold leading-none tracking-tight" style={{ color: 'var(--foreground)' }}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: tokens.accent, opacity: 0.6 }}
            />
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
})
