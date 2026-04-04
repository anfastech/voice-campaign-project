'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Activity, Webhook, Shield, CheckCircle2, XCircle,
  Moon, Sun, Globe, Save, Loader2, Eye, EyeOff,
  Volume2, Bot, Phone,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

function IntegrationCard({ name, icon: Icon, connected }: { name: string; icon: LucideIcon; connected: boolean }) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          connected ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <Badge variant={connected ? 'default' : 'secondary'} className="mt-1 text-[10px] gap-1">
            {connected ? <><CheckCircle2 className="w-3 h-3" /> Connected</> : <><XCircle className="w-3 h-3" /> Not connected</>}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((r) => r.json()),
  })

  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)

  useEffect(() => {
    if (data?.webhook) {
      setWebhookUrl(data.webhook.url || '')
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, string | null>) =>
      fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setWebhookSecret('')
    },
  })

  const handleSaveWebhook = () => {
    const body: Record<string, string | null> = { webhookUrl: webhookUrl || null }
    if (webhookSecret) body.webhookSecret = webhookSecret
    saveMutation.mutate(body)
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl animate-pulse bg-muted border border-border" />
        ))}
      </div>
    )
  }

  const integrations = data?.integrations ?? {}
  const webhook = data?.webhook ?? {}

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Integrations */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Integrations</h2>
            <p className="text-xs text-muted-foreground">Status of connected services</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <IntegrationCard name="Voice Engine" icon={Volume2} connected={integrations.voiceEngine?.connected ?? false} />
          <IntegrationCard name="AI Model" icon={Bot} connected={integrations.aiModel?.connected ?? false} />
          <IntegrationCard name="Telephony" icon={Phone} connected={integrations.telephony?.connected ?? false} />
        </div>
      </section>

      <Separator />

      {/* Webhook Configuration — editable */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Webhook className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Webhooks</h2>
            <p className="text-xs text-muted-foreground">
              Receive notifications when calls and campaigns complete
            </p>
          </div>
        </div>

        <Card className="shadow-none">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-api.com/webhooks/voice"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook-secret">
                Webhook Secret
                {webhook.hasSecret && (
                  <span className="text-xs text-muted-foreground ml-2">(currently set)</span>
                )}
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="webhook-secret"
                    type={showSecret ? 'text' : 'password'}
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder={webhook.hasSecret ? '••••••••••••' : 'Enter a secret for signature verification'}
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg text-xs bg-blue-500/5 border border-blue-500/15">
              <Activity className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600" />
              <div className="text-blue-700 dark:text-blue-400">
                <p className="font-semibold mb-0.5">Supported Events</p>
                <p>
                  <code className="text-[11px]">call.completed</code>, <code className="text-[11px]">call.failed</code>,{' '}
                  <code className="text-[11px]">call.no_answer</code>, <code className="text-[11px]">campaign.completed</code>
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button onClick={handleSaveWebhook} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-2" />
                )}
                {saveMutation.isPending ? 'Saving...' : 'Save Webhook'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Appearance */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Moon className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Appearance</h2>
            <p className="text-xs text-muted-foreground">Customize how the dashboard looks</p>
          </div>
        </div>

        <Card className="shadow-none">
          <CardContent className="p-5">
            <p className="text-xs font-semibold mb-3 text-foreground">Theme</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', label: 'Light', icon: Sun, previewClass: 'bg-white border-gray-200' },
                { value: 'dark', label: 'Dark', icon: Moon, previewClass: 'bg-zinc-900 border-zinc-700' },
                { value: 'system', label: 'System', icon: Globe, previewClass: 'bg-gradient-to-br from-white from-50% to-zinc-900 to-50% border-gray-400' },
              ].map((t) => {
                const Icon = t.icon
                const active = theme === t.value
                return (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                      active
                        ? 'bg-primary/10 border-2 border-primary/40'
                        : 'bg-muted border-2 border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl border ${t.previewClass}`} />
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
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
