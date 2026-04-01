'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  GitBranch, Plus, Trash2, Zap, Phone, CheckCircle, XCircle,
  PhoneOff, Globe, Tag, Megaphone, ToggleLeft, ToggleRight,
} from 'lucide-react'

const TRIGGERS = [
  { value: 'call.completed', label: 'Call Completed', icon: CheckCircle, color: 'oklch(0.55 0.215 163)' },
  { value: 'call.failed', label: 'Call Failed', icon: XCircle, color: 'oklch(0.59 0.245 15)' },
  { value: 'call.no_answer', label: 'No Answer', icon: PhoneOff, color: 'oklch(0.72 0.18 68)' },
  { value: 'campaign.completed', label: 'Campaign Completed', icon: Megaphone, color: 'oklch(0.49 0.263 281)' },
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
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Workflows</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Automate actions based on call and campaign events
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
            boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
          }}>
          <Plus className="w-4 h-4" />
          New Workflow
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.875rem' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.49 0.263 281 / 10%)' }}>
              <Zap className="w-3.5 h-3.5" style={{ color: 'oklch(0.49 0.263 281)' }} />
            </div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Create Workflow</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Name <span style={{ color: 'oklch(0.59 0.245 15)' }}>*</span>
              </label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Follow-up on no answer"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Description
              </label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does this workflow do?"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
            </div>
          </div>

          {/* Trigger */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>
              When this happens (Trigger)
            </label>
            <div className="flex flex-wrap gap-2">
              {TRIGGERS.map((t) => {
                const Icon = t.icon
                const isActive = form.trigger === t.value
                return (
                  <button key={t.value} onClick={() => setForm({ ...form, trigger: t.value })}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                    style={{
                      background: isActive ? `${t.color.replace(')', ' / 12%)')}` : 'var(--muted)',
                      border: isActive ? `1px solid ${t.color.replace(')', ' / 40%)')}` : '1px solid var(--border)',
                      color: isActive ? t.color : 'var(--muted-foreground)',
                    }}>
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>
              Do this (Action)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {ACTION_TYPES.map((a) => {
                const Icon = a.icon
                const isActive = form.actionType === a.value
                return (
                  <button key={a.value} onClick={() => setForm({ ...form, actionType: a.value })}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                    style={{
                      background: isActive ? 'oklch(0.49 0.263 281 / 12%)' : 'var(--muted)',
                      border: isActive ? '1px solid oklch(0.49 0.263 281 / 40%)' : '1px solid var(--border)',
                      color: isActive ? 'oklch(0.49 0.263 281)' : 'var(--muted-foreground)',
                    }}>
                    <Icon className="w-3.5 h-3.5" />
                    {a.label}
                  </button>
                )
              })}
            </div>
            <input
              value={form.actionType === 'webhook' ? form.webhookUrl : form.actionValue}
              onChange={(e) => form.actionType === 'webhook'
                ? setForm({ ...form, webhookUrl: e.target.value })
                : setForm({ ...form, actionValue: e.target.value })
              }
              placeholder={
                form.actionType === 'webhook' ? 'https://your-webhook-url.com/endpoint'
                : form.actionType === 'tag_contact' ? 'Tag name (e.g., "interested")'
                : 'Campaign ID'
              }
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button onClick={() => { setShowForm(false); setForm(DEFAULT_FORM) }}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}>
              Cancel
            </button>
            <button onClick={handleCreate} disabled={!form.name.trim() || createMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
              }}>
              {createMutation.isPending ? 'Creating...' : 'Create Workflow'}
            </button>
          </div>
        </div>
      )}

      {/* Workflow List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl relative overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      ) : workflowList.length === 0 ? (
        <div className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, oklch(0.49 0.263 281 / 15%), oklch(0.65 0.22 310 / 15%))', border: '1px solid oklch(0.49 0.263 281 / 20%)' }}>
            <GitBranch className="w-7 h-7" style={{ color: 'oklch(0.49 0.263 281)' }} />
          </div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>No workflows yet</h3>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Create your first workflow to automate post-call actions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflowList.map((wf: any) => {
            const triggerConfig = TRIGGERS.find((t) => t.value === wf.trigger) || TRIGGERS[0]
            const TriggerIcon = triggerConfig.icon
            const actions = Array.isArray(wf.actions) ? wf.actions : []

            return (
              <div key={wf.id} className="rounded-2xl p-4"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', opacity: wf.isActive ? 1 : 0.6 }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${triggerConfig.color.replace(')', ' / 12%)')}` }}>
                      <TriggerIcon className="w-4.5 h-4.5" style={{ color: triggerConfig.color }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{wf.name}</h3>
                      {wf.description && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>{wf.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${triggerConfig.color.replace(')', ' / 10%)')}`, color: triggerConfig.color }}>
                          {triggerConfig.label}
                        </span>
                        <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>&rarr;</span>
                        {actions.map((a: any, i: number) => (
                          <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'oklch(0.49 0.263 281 / 10%)', color: 'oklch(0.49 0.263 281)' }}>
                            {a.type === 'webhook' ? 'Webhook' : a.type === 'tag_contact' ? `Tag: ${a.tag}` : a.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleMutation.mutate({ id: wf.id, isActive: !wf.isActive })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                      style={{ color: wf.isActive ? 'oklch(0.55 0.215 163)' : 'var(--muted-foreground)' }}>
                      {wf.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => { if (window.confirm('Delete this workflow?')) deleteMutation.mutate(wf.id) }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                      style={{ color: 'oklch(0.59 0.245 15)' }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Webhook Templates */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--foreground)' }}>Webhook Payload Templates</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--muted-foreground)' }}>
          When a workflow triggers a webhook, it sends a JSON payload with the following structure:
        </p>
        <pre className="rounded-xl p-4 text-xs font-mono overflow-x-auto leading-relaxed"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
{`{
  "event": "call.completed",
  "timestamp": "2024-01-15T10:30:00Z",
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
      </div>
    </div>
  )
}
