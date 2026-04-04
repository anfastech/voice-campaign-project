'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  GitBranch, Plus, Trash2, Zap, Phone, CheckCircle2, XCircle,
  PhoneOff, Globe, Tag, Megaphone, ToggleLeft, ToggleRight, X, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const TRIGGERS = [
  { value: 'call.completed', label: 'Call Completed', icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  { value: 'call.failed', label: 'Call Failed', icon: XCircle, className: 'bg-red-500/10 text-red-600 border-red-500/30' },
  { value: 'call.no_answer', label: 'No Answer', icon: PhoneOff, className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
  { value: 'campaign.completed', label: 'Campaign Completed', icon: Megaphone, className: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
]

const ACTION_TYPES = [
  { value: 'webhook', label: 'Send Webhook', icon: Globe },
  { value: 'tag_contact', label: 'Tag Contact', icon: Tag },
  { value: 'add_to_campaign', label: 'Add to Campaign', icon: Megaphone },
]

interface WorkflowForm {
  name: string
  description: string
  trigger: string
  webhookUrl: string
  actionType: string
  actionValue: string
}

const DEFAULT_FORM: WorkflowForm = {
  name: '',
  description: '',
  trigger: 'call.completed',
  webhookUrl: '',
  actionType: 'webhook',
  actionValue: '',
}

export default function WorkflowsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<WorkflowForm>(DEFAULT_FORM)

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => fetch('/api/workflows').then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      setShowForm(false)
      setForm(DEFAULT_FORM)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch('/api/workflows', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/workflows?id=${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  })

  const handleCreate = () => {
    const actions = []
    if (form.actionType === 'webhook') {
      actions.push({ type: 'webhook', url: form.webhookUrl || form.actionValue })
    } else if (form.actionType === 'tag_contact') {
      actions.push({ type: 'tag_contact', tag: form.actionValue })
    } else if (form.actionType === 'add_to_campaign') {
      actions.push({ type: 'add_to_campaign', campaignId: form.actionValue })
    }

    createMutation.mutate({
      name: form.name,
      description: form.description,
      trigger: form.trigger,
      actions,
    })
  }

  const workflowList = Array.isArray(workflows) ? workflows : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Workflows</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automate actions based on call and campaign events
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Workflow
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="shadow-none border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              <CardTitle className="text-base">Create Workflow</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name <span className="text-destructive">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Follow-up on no answer"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What does this workflow do?"
                />
              </div>
            </div>

            {/* Trigger */}
            <div className="space-y-2">
              <Label>When this happens (Trigger)</Label>
              <div className="flex flex-wrap gap-2">
                {TRIGGERS.map((t) => {
                  const Icon = t.icon
                  const isActive = form.trigger === t.value
                  return (
                    <button
                      key={t.value}
                      onClick={() => setForm({ ...form, trigger: t.value })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                        isActive ? t.className : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Action */}
            <div className="space-y-2">
              <Label>Do this (Action)</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {ACTION_TYPES.map((a) => {
                  const Icon = a.icon
                  const isActive = form.actionType === a.value
                  return (
                    <button
                      key={a.value}
                      onClick={() => setForm({ ...form, actionType: a.value })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                        isActive ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border hover:bg-accent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {a.label}
                    </button>
                  )
                })}
              </div>
              <Input
                value={form.actionType === 'webhook' ? form.webhookUrl : form.actionValue}
                onChange={(e) =>
                  form.actionType === 'webhook'
                    ? setForm({ ...form, webhookUrl: e.target.value })
                    : setForm({ ...form, actionValue: e.target.value })
                }
                placeholder={
                  form.actionType === 'webhook' ? 'https://your-webhook-url.com/endpoint'
                  : form.actionType === 'tag_contact' ? 'Tag name (e.g., "interested")'
                  : 'Campaign ID'
                }
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => { setShowForm(false); setForm(DEFAULT_FORM) }}>
                <X className="w-3.5 h-3.5 mr-1.5" />
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!form.name.trim() || createMutation.isPending}>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                {createMutation.isPending ? 'Creating...' : 'Create Workflow'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse bg-muted border border-border" />
          ))}
        </div>
      ) : workflowList.length === 0 && !showForm ? (
        <Card className="shadow-none border-dashed">
          <CardContent className="py-14 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <GitBranch className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No workflows yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first workflow to automate post-call actions.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {workflowList.map((wf: any) => {
            const triggerConfig = TRIGGERS.find((t) => t.value === wf.trigger) || TRIGGERS[0]
            const TriggerIcon = triggerConfig.icon
            const actions = Array.isArray(wf.actions) ? wf.actions : []

            return (
              <Card key={wf.id} className={`shadow-none transition-opacity ${wf.isActive ? '' : 'opacity-60'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${triggerConfig.className.split(' ').slice(0, 1).join(' ')}`}>
                        <TriggerIcon className={`w-4 h-4 ${triggerConfig.className.split(' ').slice(1, 2).join(' ')}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground">{wf.name}</h3>
                        {wf.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{wf.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] font-semibold">
                            {triggerConfig.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">&rarr;</span>
                          {actions.map((a: any, i: number) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-semibold">
                              {a.type === 'webhook' ? 'Webhook' : a.type === 'tag_contact' ? `Tag: ${a.tag}` : a.type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleMutation.mutate({ id: wf.id, isActive: !wf.isActive })}
                      >
                        {wf.isActive ? (
                          <ToggleRight className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { if (confirm('Delete this workflow?')) deleteMutation.mutate(wf.id) }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Webhook Payload Reference */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-sm">Webhook Payload Reference</CardTitle>
          <CardDescription>When a workflow fires a webhook, it sends this JSON structure</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed bg-muted border border-border text-foreground">
{`{
  "event": "call.completed",
  "timestamp": "2026-04-05T10:30:00Z",
  "workflow": { "id": "wf_abc", "name": "Follow-up" },
  "call": {
    "id": "call_abc123",
    "status": "COMPLETED",
    "duration": 145,
    "cost": 0.12,
    "transcript": "...",
    "summary": "..."
  },
  "contact": {
    "id": "contact_xyz",
    "name": "John Doe",
    "phone": "+1234567890"
  },
  "agent": { "id": "agent_001", "name": "Sales Agent" },
  "campaign": { "id": "campaign_001", "name": "Q1 Outreach" }
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
