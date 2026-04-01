'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Shield,
  Webhook,
  Activity,
  Phone,
  Bot,
  Megaphone,
  Users,
  Clock,
  DollarSign,
  CheckCircle2,
  XCircle,
  Bell,
  Moon,
  Sun,
  Globe,
} from 'lucide-react'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { formatCurrency } from '@/lib/utils'

function SkeletonBlock({ h = 'h-32' }: { h?: string }) {
  return (
    <div
      className={`rounded-2xl ${h} relative overflow-hidden`}
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="absolute inset-0 shimmer" />
    </div>
  )
}

function IntegrationCard({
  name,
  icon,
  connected,
}: {
  name: string
  icon: string
  connected: boolean
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-200"
      style={{
        background: 'var(--card)',
        border: `1px solid ${connected ? 'oklch(0.55 0.215 163 / 20%)' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{
            background: connected ? 'oklch(0.55 0.215 163 / 10%)' : 'var(--muted)',
          }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {connected ? (
              <>
                <CheckCircle2 className="w-3 h-3" style={{ color: 'oklch(0.55 0.215 163)' }} />
                <span className="text-[11px] font-medium" style={{ color: 'oklch(0.45 0.215 163)' }}>
                  Connected
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                <span className="text-[11px] font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  Not connected
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function UsageCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) {
  return (
    <div
      className="rounded-xl p-4 text-center"
      style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2"
        style={{ background: `${color} / 12%)` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--foreground)' }}>
        {value}
      </p>
      <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
        {label}
      </p>
    </div>
  )
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description: string
}) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
          {label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
          {description}
        </p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative rounded-full transition-colors duration-200 flex-shrink-0"
        style={{
          background: checked
            ? 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.58 0.24 300))'
            : 'var(--muted)',
          border: `1px solid ${checked ? 'oklch(0.49 0.263 281 / 30%)' : 'var(--border)'}`,
          width: '40px',
          height: '22px',
        }}
      >
        <span
          className="absolute top-0.5 rounded-full transition-all duration-200 shadow-sm"
          style={{
            width: '16px',
            height: '16px',
            left: checked ? '20px' : '2px',
            background: 'white',
          }}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to load settings')
      return res.json()
    },
  })

  const { theme, setTheme } = useTheme()

  // Notification preferences
  const [notifCampaignComplete, setNotifCampaignComplete] = useState(true)
  const [notifCallFailed, setNotifCallFailed] = useState(true)
  const [notifDailyDigest, setNotifDailyDigest] = useState(false)
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(true)

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <SkeletonBlock h="h-16" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonBlock key={i} h="h-24" />
          ))}
        </div>
        <SkeletonBlock h="h-40" />
      </div>
    )
  }

  const integrations = data?.integrations ?? {}
  const webhook = data?.webhook ?? {}
  const usage = data?.usage ?? {}

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Integrations */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'oklch(0.49 0.263 281 / 12%)' }}
          >
            <Activity className="w-4 h-4" style={{ color: 'oklch(0.49 0.263 281)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
              Integrations
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Status of connected services. Configure via environment variables.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <IntegrationCard
            name="Voice Engine"
            icon="🔊"
            connected={integrations.voiceEngine?.connected ?? false}
          />
          <IntegrationCard
            name="AI Model"
            icon="🤖"
            connected={integrations.aiModel?.connected ?? false}
          />
          <IntegrationCard
            name="Telephony"
            icon="📞"
            connected={integrations.telephony?.connected ?? false}
          />
        </div>
      </section>

      {/* Webhook Configuration */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'oklch(0.6 0.19 220 / 12%)' }}
          >
            <Webhook className="w-4 h-4" style={{ color: 'oklch(0.6 0.19 220)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
              Webhooks
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Configure webhook URLs for call events and campaign notifications.
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="space-y-4">
            <div>
              <label
                className="text-xs font-semibold mb-1.5 block"
                style={{ color: 'var(--foreground)' }}
              >
                Webhook URL
              </label>
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-mono"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <Webhook
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: 'var(--muted-foreground)' }}
                />
                <span
                  className="flex-1 truncate"
                  style={{ color: webhook.url ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                >
                  {webhook.url || 'Not configured — set WEBHOOK_URL in .env.local'}
                </span>
              </div>
            </div>
            <div>
              <label
                className="text-xs font-semibold mb-1.5 block"
                style={{ color: 'var(--foreground)' }}
              >
                Webhook Secret
              </label>
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-mono"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <Shield
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: 'var(--muted-foreground)' }}
                />
                <span
                  className="flex-1"
                  style={{
                    color: webhook.secret ? 'var(--foreground)' : 'var(--muted-foreground)',
                  }}
                >
                  {webhook.secret || 'Not configured — set WEBHOOK_SECRET in .env.local'}
                </span>
              </div>
            </div>

            <div
              className="flex items-start gap-2 p-3 rounded-lg text-xs"
              style={{
                background: 'oklch(0.6 0.19 220 / 6%)',
                border: '1px solid oklch(0.6 0.19 220 / 15%)',
              }}
            >
              <Activity
                className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                style={{ color: 'oklch(0.6 0.19 220)' }}
              />
              <div style={{ color: 'oklch(0.5 0.19 220)' }}>
                <p className="font-semibold mb-0.5">Webhook Events</p>
                <p>
                  Events sent: <code>call.completed</code>, <code>call.failed</code>,{' '}
                  <code>campaign.completed</code>, <code>campaign.started</code>
                </p>
                <p className="mt-1">
                  Configure webhook triggers in the{' '}
                  <a href="/workflows" className="underline font-medium">
                    Workflows
                  </a>{' '}
                  page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Usage Dashboard */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'oklch(0.55 0.215 163 / 12%)' }}
          >
            <Activity className="w-4 h-4" style={{ color: 'oklch(0.55 0.215 163)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
              Usage
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Platform usage summary across all time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <UsageCard
            icon={Phone}
            label="Total Calls"
            value={usage.totalCalls ?? 0}
            color="oklch(0.49 0.263 281)"
          />
          <UsageCard
            icon={Clock}
            label="Total Minutes"
            value={usage.totalMinutes ?? 0}
            color="oklch(0.6 0.19 220)"
          />
          <UsageCard
            icon={DollarSign}
            label="Total Cost"
            value={formatCurrency(usage.totalCost)}
            color="oklch(0.72 0.18 68)"
          />
          <UsageCard
            icon={Bot}
            label="Active Agents"
            value={usage.totalAgents ?? 0}
            color="oklch(0.55 0.215 163)"
          />
          <UsageCard
            icon={Megaphone}
            label="Campaigns"
            value={usage.totalCampaigns ?? 0}
            color="oklch(0.59 0.245 15)"
          />
          <UsageCard
            icon={Users}
            label="Contacts"
            value={usage.totalContacts ?? 0}
            color="oklch(0.49 0.263 281)"
          />
        </div>
      </section>

      {/* Appearance */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'oklch(0.6 0.19 220 / 12%)' }}
          >
            <Moon className="w-4 h-4" style={{ color: 'oklch(0.6 0.19 220)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
              Appearance
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Customize how the dashboard looks.
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
            Theme
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light', label: 'Light', icon: Sun, bg: '#f8f7ff', border: '#e5e4f0' },
              { value: 'dark', label: 'Dark', icon: Moon, bg: '#0c0a14', border: '#1e1b2e' },
              {
                value: 'system',
                label: 'System',
                icon: Globe,
                bg: 'linear-gradient(135deg, #f8f7ff 50%, #0c0a14 50%)',
                border: '#888',
              },
            ].map((t) => {
              const Icon = t.icon
              const active = theme === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200"
                  style={{
                    background: active ? 'oklch(0.49 0.263 281 / 8%)' : 'var(--muted)',
                    border: `2px solid ${active ? 'oklch(0.49 0.263 281 / 40%)' : 'var(--border)'}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl"
                    style={{ background: t.bg, border: `1px solid ${t.border}` }}
                  />
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className="w-3 h-3"
                      style={{
                        color: active ? 'oklch(0.49 0.263 281)' : 'var(--muted-foreground)',
                      }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: active ? 'oklch(0.49 0.263 281)' : 'var(--muted-foreground)',
                      }}
                    >
                      {t.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'oklch(0.55 0.215 163 / 12%)' }}
          >
            <Bell className="w-4 h-4" style={{ color: 'oklch(0.55 0.215 163)' }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
              Notifications
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Choose what you want to be notified about.
            </p>
          </div>
        </div>

        <div
          className="rounded-xl px-5 py-2"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ToggleSwitch
            checked={notifCampaignComplete}
            onChange={setNotifCampaignComplete}
            label="Campaign completed"
            description="Get notified when a campaign finishes running"
          />
          <ToggleSwitch
            checked={notifCallFailed}
            onChange={setNotifCallFailed}
            label="Call failures"
            description="Get alerted on failed calls above threshold"
          />
          <ToggleSwitch
            checked={notifDailyDigest}
            onChange={setNotifDailyDigest}
            label="Daily digest"
            description="Receive a daily summary email of campaign metrics"
          />
          <ToggleSwitch
            checked={notifWeeklyReport}
            onChange={setNotifWeeklyReport}
            label="Weekly report"
            description="Receive a weekly performance report"
          />
        </div>
      </section>
    </div>
  )
}
