'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  BarChart3, MessageSquare, Users, Megaphone, Target, Bot, BookOpen, Tags,
  ChevronDown, ChevronUp, Eye, Save, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardConfig, SectionKey } from '@/lib/dashboard-config'
import { SECTION_REGISTRY } from '@/lib/dashboard-config'

const ICON_MAP: Record<string, React.ElementType> = {
  BarChart3, MessageSquare, Users, Megaphone, Target, Bot, BookOpen, Tags,
}

interface Props {
  clientId: string
  clientName: string
}

export function DashboardConfigEditor({ clientId, clientName }: Props) {
  const queryClient = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: config, isLoading } = useQuery<DashboardConfig>({
    queryKey: ['client-dashboard-config', clientId],
    queryFn: () => fetch(`/api/clients/${clientId}/dashboard-config`).then((r) => r.json()),
  })

  const [local, setLocal] = useState<DashboardConfig | null>(null)
  const active = local ?? config

  const saveMutation = useMutation({
    mutationFn: (data: DashboardConfig) =>
      fetch(`/api/clients/${clientId}/dashboard-config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to save')
        return r.json()
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['client-dashboard-config', clientId], data)
      setLocal(null)
    },
  })

  if (isLoading || !active) {
    return (
      <Card className="shadow-none">
        <CardContent className="p-6">
          <div className="h-40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  function ensureLocal(): DashboardConfig {
    if (local) return local
    const clone = structuredClone(active!)
    setLocal(clone)
    return clone
  }

  function toggleSection(key: SectionKey) {
    const prev = ensureLocal()
    const section = prev.sections[key]
    ;(section as { enabled: boolean }).enabled = !section.enabled
    setLocal({ ...prev })
  }

  function toggleFeature(sectionKey: SectionKey, featureKey: string) {
    const prev = ensureLocal()
    const section = prev.sections[sectionKey] as any
    if (section.features) {
      section.features[featureKey] = !section.features[featureKey]
      setLocal({ ...prev })
    }
  }

  function toggleAllFeatures(sectionKey: SectionKey, enabled: boolean) {
    const prev = ensureLocal()
    const section = prev.sections[sectionKey] as any
    if (section.features) {
      for (const k of Object.keys(section.features)) {
        section.features[k] = enabled
      }
      setLocal({ ...prev })
    }
  }

  const hasChanges = local !== null
  const sectionKeys = Object.keys(SECTION_REGISTRY) as SectionKey[]

  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Customize Dashboard</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control what {clientName} sees on their dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => window.open(`/client/dashboard?preview=true&clientId=${clientId}`, '_blank')}
            >
              <Eye className="w-3 h-3" />
              Preview
            </Button>
            {hasChanges && (
              <Button
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => saveMutation.mutate(local!)}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Save className="w-3 h-3" />
                )}
                Save Changes
              </Button>
            )}
          </div>
        </div>

        <Separator />

        <p className="text-xs text-muted-foreground">
          Sidebar sections the client will see on their dashboard
        </p>

        <div className="space-y-1">
          {sectionKeys.map((key) => {
            const reg = SECTION_REGISTRY[key]
            const section = active.sections[key]
            const Icon = ICON_MAP[reg.icon]
            const features = reg.features as Record<string, string>
            const hasFeatures = Object.keys(features).length > 0
            const isExpanded = expanded === key

            return (
              <div key={key}>
                <div
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
                    hasFeatures && 'cursor-pointer hover:bg-muted/50',
                  )}
                  onClick={() => hasFeatures && setExpanded(isExpanded ? null : key)}
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-sm font-medium">{reg.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={section.enabled}
                      onCheckedChange={() => toggleSection(key)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {hasFeatures && (
                      isExpanded
                        ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                        : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Sub-features */}
                {hasFeatures && isExpanded && (
                  <div className="ml-7 pl-4 border-l border-border space-y-0.5 py-1 mb-2">
                    <div className="flex items-center justify-end gap-2 pb-1">
                      <button
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => toggleAllFeatures(key, true)}
                      >
                        Enable all
                      </button>
                      <span className="text-[10px] text-muted-foreground">|</span>
                      <button
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => toggleAllFeatures(key, false)}
                      >
                        Disable all
                      </button>
                    </div>
                    {Object.entries(features).map(([fk, label]) => {
                      const sectionData = active.sections[key] as any
                      const featureValue = sectionData.features?.[fk] ?? true
                      return (
                        <div
                          key={fk}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 rounded-md transition-colors',
                            !section.enabled && 'opacity-40 pointer-events-none',
                          )}
                        >
                          <span className="text-xs text-muted-foreground">{label}</span>
                          <Switch
                            checked={featureValue}
                            onCheckedChange={() => toggleFeature(key, fk)}
                            disabled={!section.enabled}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
