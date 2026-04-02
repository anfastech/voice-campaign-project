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
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

function SkeletonBlock({ h = 'h-32' }: { h?: string }) {
  return (
    <div className={`rounded-2xl ${h} animate-pulse bg-muted border border-border`} />
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
    <Card className={`rounded-xl p-4 transition-all duration-200 ${connected ? 'border-emerald-500/20' : ''}`}>
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
            connected ? 'bg-emerald-500/10' : 'bg-muted'
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {connected ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-500">
                  Connected
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground">
                  Not connected
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function UsageCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  colorClass: string
}) {
  return (
    <Card className="rounded-xl p-4 text-center bg-muted">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl font-bold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-[11px] mt-0.5 text-muted-foreground">
        {label}
      </p>
    </Card>
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
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div>
        <p className="text-sm font-medium text-foreground">
          {label}
        </p>
        <p className="text-xs mt-0.5 text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
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
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary/10">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Integrations
            </h2>
            <p className="text-xs text-muted-foreground">
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

      <Separator />

      {/* Webhook Configuration */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-sky-500/10">
            <Webhook className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Webhooks
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure webhook URLs for call events and campaign notifications.
            </p>
          </div>
        </div>

        <Card className="rounded-xl p-5">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block text-foreground">
                Webhook URL
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-mono bg-muted border border-border">
                <Webhook className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                <span className={`flex-1 truncate ${webhook.url ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {webhook.url || 'Not configured \u2014 set WEBHOOK_URL in .env.local'}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block text-foreground">
                Webhook Secret
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-mono bg-muted border border-border">
                <Shield className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                <span className={`flex-1 ${webhook.secret ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {webhook.secret || 'Not configured \u2014 set WEBHOOK_SECRET in .env.local'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-sky-500/5 border border-sky-500/15">
              <Activity className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-sky-600" />
              <div className="text-sky-700 dark:text-sky-400">
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
        </Card>
      </section>

      <Separator />

      {/* Usage Dashboard */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/10">
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Usage
            </h2>
            <p className="text-xs text-muted-foreground">
              Platform usage summary across all time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <UsageCard icon={Phone} label="Total Calls" value={usage.totalCalls ?? 0}
            colorClass="bg-violet-500/10 text-violet-600" />
          <UsageCard icon={Clock} label="Total Minutes" value={usage.totalMinutes ?? 0}
            colorClass="bg-sky-500/10 text-sky-600" />
          <UsageCard icon={DollarSign} label="Total Cost" value={formatCurrency(usage.totalCost)}
            colorClass="bg-amber-500/10 text-amber-600" />
          <UsageCard icon={Bot} label="Active Agents" value={usage.totalAgents ?? 0}
            colorClass="bg-emerald-500/10 text-emerald-600" />
          <UsageCard icon={Megaphone} label="Campaigns" value={usage.totalCampaigns ?? 0}
            colorClass="bg-red-500/10 text-red-600" />
          <UsageCard icon={Users} label="Contacts" value={usage.totalContacts ?? 0}
            colorClass="bg-violet-500/10 text-violet-600" />
        </div>
      </section>

      <Separator />

      {/* Appearance */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-sky-500/10">
            <Moon className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Appearance
            </h2>
            <p className="text-xs text-muted-foreground">
              Customize how the dashboard looks.
            </p>
          </div>
        </div>

        <Card className="rounded-xl p-5">
          <p className="text-xs font-semibold mb-3 text-foreground">
            Theme
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light', label: 'Light', icon: Sun, bg: 'bg-[#f8f7ff]', previewBorder: 'border-[#e5e4f0]' },
              { value: 'dark', label: 'Dark', icon: Moon, bg: 'bg-[#0c0a14]', previewBorder: 'border-[#1e1b2e]' },
              { value: 'system', label: 'System', icon: Globe, bg: 'bg-gradient-to-br from-[#f8f7ff] from-50% to-[#0c0a14] to-50%', previewBorder: 'border-gray-400' },
            ].map((t) => {
              const Icon = t.icon
              const active = theme === t.value
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-primary/10 border-2 border-primary/40'
                      : 'bg-muted border-2 border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl border ${t.bg} ${t.previewBorder}`} />
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3 h-3 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                      {t.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      </section>

      <Separator />

      {/* Notifications */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/10">
            <Bell className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Notifications
            </h2>
            <p className="text-xs text-muted-foreground">
              Choose what you want to be notified about.
            </p>
          </div>
        </div>

        <Card className="rounded-xl px-5 py-2">
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
        </Card>
      </section>
    </div>
  )
}
