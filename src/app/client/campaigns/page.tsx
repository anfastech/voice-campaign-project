'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Calendar,
  Clock,
  Users,
  Bot,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  UserPlus,
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

function getNextSlot(): { date: string; time: string } {
  const now = new Date()
  // Round up to next 5-minute slot
  const mins = now.getMinutes()
  const next5 = Math.ceil((mins + 1) / 5) * 5
  now.setMinutes(next5, 0, 0)
  if (next5 >= 60) now.setHours(now.getHours() + 1, next5 - 60, 0, 0)
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yy = String(now.getFullYear()).slice(-2)
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  return { date: `${dd}/${mm}/${yy}`, time: `${hh}:${mi}` }
}

function parseScheduleToISO(date: string, time: string): string | null {
  // date = dd/mm/yy, time = HH:mm
  const parts = date.split('/')
  if (parts.length !== 3) return null
  const [dd, mm, yy] = parts
  const fullYear = 2000 + parseInt(yy)
  const d = new Date(fullYear, parseInt(mm) - 1, parseInt(dd), ...time.split(':').map(Number) as [number, number])
  return isNaN(d.getTime()) ? null : d.toISOString()
}

const STATUSES = ['ALL', 'DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED', 'SCHEDULED'] as const
type CampaignStatus = (typeof STATUSES)[number]

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-neutral-500/10 text-neutral-500',
  SCHEDULED: 'bg-blue-500/10 text-blue-500',
  RUNNING: 'bg-emerald-500/10 text-emerald-600',
  PAUSED: 'bg-yellow-500/10 text-yellow-600',
  COMPLETED: 'bg-blue-500/10 text-blue-600',
  CANCELLED: 'bg-red-500/10 text-red-600',
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}


// ─── Create Campaign Dialog ───────────────────────────────────────────────────

function CreateCampaignDialog() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [agentId, setAgentId] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [contactMode, setContactMode] = useState<'group' | 'individual'>('group')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [scheduleMode, setScheduleMode] = useState<'immediate' | 'scheduled' | 'draft'>('immediate')
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [maxRetries, setMaxRetries] = useState(3)
  const [retryDelayMinutes, setRetryDelayMinutes] = useState(60)
  const [callsPerMinute, setCallsPerMinute] = useState(5)
  const [contactSearch, setContactSearch] = useState('')

  const { data: agents = [] } = useQuery({
    queryKey: ['client-agents'],
    queryFn: () => fetch('/api/client/agents').then((r) => r.json()),
    enabled: open,
  })

  const { data: groupsRaw = [] } = useQuery({
    queryKey: ['client-contact-groups'],
    queryFn: () => fetch('/api/client/contact-groups').then((r) => r.json()),
    enabled: open,
  })

  const { data: contactsRaw = [] } = useQuery({
    queryKey: ['client-contacts'],
    queryFn: () => fetch('/api/client/contacts').then((r) => r.json()),
    enabled: open,
  })

  const contacts: any[] = Array.isArray(contactsRaw) ? contactsRaw : []
  const agentList: any[] = Array.isArray(agents) ? agents : []
  const groups: any[] = Array.isArray(groupsRaw) ? groupsRaw : []

  const filteredContacts = contacts.filter(
    (c: any) =>
      !contactSearch ||
      c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phoneNumber?.includes(contactSearch)
  )

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/client/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to create campaign')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-campaigns'] })
      resetForm()
      setOpen(false)
    },
  })

  function resetForm() {
    setName('')
    setDescription('')
    setAgentId('')
    setSelectedContacts([])
    setContactMode('group')
    setSelectedGroupId('')
    setScheduleMode('immediate')
    setSchedDate('')
    setSchedTime('')
    setShowAdvanced(false)
    setMaxRetries(3)
    setRetryDelayMinutes(60)
    setCallsPerMinute(5)
    setContactSearch('')
  }

  // Get contactIds from the selected group
  const selectedGroup = groups.find((g: any) => g.id === selectedGroupId)
  const groupContactIds: string[] = selectedGroup?.contactIds ?? []

  function handleGroupSelect(groupId: string) {
    setSelectedGroupId(groupId)
    const group = groups.find((g: any) => g.id === groupId)
    if (group && !name.trim()) {
      setName(group.name)
    }
  }

  function handleSubmit() {
    const contactIds = contactMode === 'group' && groupContactIds.length > 0
      ? groupContactIds
      : selectedContacts
    if (!name.trim() || !agentId || contactIds.length === 0) return
    if (scheduleMode === 'scheduled' && (!schedDate || !schedTime)) return
    const body: any = {
      name: name.trim(),
      agentId,
      contactIds,
      maxRetries,
      retryDelayMinutes,
      callsPerMinute,
    }
    if (description.trim()) body.description = description.trim()
    if (scheduleMode === 'immediate') {
      body.autoStart = true
    } else if (scheduleMode === 'scheduled' && schedDate && schedTime) {
      const iso = parseScheduleToISO(schedDate, schedTime)
      if (iso) body.scheduledAt = iso
    }
    createMutation.mutate(body)
  }

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const selectAllVisible = () => {
    const visibleIds = filteredContacts.map((c: any) => c.id)
    setSelectedContacts((prev) => {
      const combined = new Set([...prev, ...visibleIds])
      return Array.from(combined)
    })
  }

  const deselectAll = () => setSelectedContacts([])

  const effectiveContactCount = contactMode === 'group'
    ? groupContactIds.length
    : selectedContacts.length
  const canSubmit = name.trim() && agentId && effectiveContactCount > 0

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <DialogDescription>Set up a new outbound voice campaign.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Agent Selection — moved first for better flow */}
          <div className="space-y-1.5">
            <Label htmlFor="campaign-agent">
              <Bot className="w-3.5 h-3.5 inline mr-1" />
              Agent *
            </Label>
            <select
              id="campaign-agent"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            >
              <option value="">Select an agent...</option>
              {agentList
                .filter((a: any) => a.isActive !== false)
                .map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </div>

          <Separator />

          {/* Contact Selection — group or individual mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                <Users className="w-3.5 h-3.5 inline mr-1" />
                Contacts * ({effectiveContactCount} selected)
              </Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={contactMode === 'group' ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => setContactMode('group')}
                >
                  <FolderOpen className="w-3 h-3 mr-1" />
                  By Group
                </Button>
                <Button
                  type="button"
                  variant={contactMode === 'individual' ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => setContactMode('individual')}
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Individual
                </Button>
              </div>
            </div>

            {contactMode === 'group' ? (
              <div className="space-y-2">
                {groups.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-md">
                    <FolderOpen className="w-6 h-6 mx-auto mb-2 text-muted-foreground opacity-40" />
                    <p className="text-xs text-muted-foreground">
                      No contact groups yet. Import contacts via CSV or Google Sheets to auto-create groups.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs mt-2"
                      onClick={() => setContactMode('individual')}
                    >
                      Select contacts individually instead
                    </Button>
                  </div>
                ) : (
                  <div className="border border-border rounded-md max-h-48 overflow-y-auto">
                    {groups.map((group: any) => {
                      const isSelected = selectedGroupId === group.id
                      const memberCount = group._count?.members ?? 0
                      return (
                        <button
                          type="button"
                          key={group.id}
                          onClick={() => handleGroupSelect(group.id)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2.5 text-left border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors',
                            isSelected && 'bg-primary/5 border-l-2 border-l-primary'
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{group.name}</p>
                            {group.description && (
                              <p className="text-[11px] text-muted-foreground truncate">{group.description}</p>
                            )}
                          </div>
                          <Badge variant={isSelected ? 'default' : 'secondary'} className="text-[10px] ml-2 shrink-0">
                            {memberCount} contacts
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                )}
                {selectedGroupId && groupContactIds.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    All {groupContactIds.length} contacts from this group will be called.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-1 justify-end">
                  <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={selectAllVisible}>
                    Select all
                  </Button>
                  {selectedContacts.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={deselectAll}>
                      Clear
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Search contacts..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="border border-border rounded-md max-h-40 overflow-y-auto">
                  {filteredContacts.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3 text-center">No contacts found</p>
                  ) : (
                    filteredContacts.map((c: any) => (
                      <label
                        key={c.id}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-muted/50 border-b border-border last:border-b-0',
                          selectedContacts.includes(c.id) && 'bg-primary/5'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(c.id)}
                          onChange={() => toggleContact(c.id)}
                          className="rounded border-border"
                        />
                        <span className="font-medium">{c.name || c.phoneNumber}</span>
                        <span className="text-muted-foreground ml-auto">{c.phoneNumber}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Campaign Name — auto-filled from group, editable */}
          <div className="space-y-1.5">
            <Label htmlFor="campaign-name">Campaign Name *</Label>
            <Input
              id="campaign-name"
              placeholder="e.g. Spring Promo Outreach"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="campaign-desc">Description</Label>
            <textarea
              id="campaign-desc"
              rows={2}
              placeholder="Optional campaign description..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Separator />

          {/* Schedule */}
          <div className="space-y-2">
            <Label>
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Schedule
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={scheduleMode === 'immediate' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setScheduleMode('immediate')}
              >
                <Play className="w-3 h-3 mr-1" />
                Start immediately
              </Button>
              <Button
                type="button"
                variant={scheduleMode === 'scheduled' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => {
                  setScheduleMode('scheduled')
                  if (!schedDate || !schedTime) {
                    const slot = getNextSlot()
                    setSchedDate(slot.date)
                    setSchedTime(slot.time)
                  }
                }}
              >
                <Clock className="w-3 h-3 mr-1" />
                Schedule for later
              </Button>
              <Button
                type="button"
                variant={scheduleMode === 'draft' ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setScheduleMode('draft')}
              >
                Save as Draft
              </Button>
            </div>
            {scheduleMode === 'scheduled' && (
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Date (dd/mm/yy)</Label>
                  <Input
                    placeholder="dd/mm/yy"
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Time</Label>
                  <Input
                    type="time"
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Advanced settings
            </button>
            {showAdvanced && (
              <div className="mt-2 space-y-3 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Max Retries</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={maxRetries}
                      onChange={(e) => setMaxRetries(Number(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Retry Delay (min)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={1440}
                      value={retryDelayMinutes}
                      onChange={(e) => setRetryDelayMinutes(Number(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Calls/min</Label>
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={callsPerMinute}
                      onChange={(e) => setCallsPerMinute(Number(e.target.value))}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); resetForm() }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || createMutation.isPending || (scheduleMode === 'scheduled' && (!schedDate || !schedTime))}>
            {createMutation.isPending
              ? 'Creating...'
              : scheduleMode === 'immediate'
              ? 'Create & Start'
              : scheduleMode === 'scheduled'
              ? 'Schedule Campaign'
              : 'Save as Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Campaign Action Buttons ──────────────────────────────────────────────────

function CampaignActions({ campaign }: { campaign: any }) {
  const queryClient = useQueryClient()

  const startMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/client/campaigns/${campaign.id}/start`, { method: 'POST' }).then((r) => {
        if (!r.ok) throw new Error('Failed to start')
        return r.json()
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-campaigns'] }),
  })

  const pauseMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/client/campaigns/${campaign.id}/pause`, { method: 'POST' }).then((r) => {
        if (!r.ok) throw new Error('Failed to pause')
        return r.json()
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-campaigns'] }),
  })

  const status = campaign.status

  if (status === 'COMPLETED' || status === 'CANCELLED') return null

  return (
    <div className="flex items-center gap-1.5">
      {(status === 'DRAFT' || status === 'PAUSED') && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-xs gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
        >
          <Play className="w-3 h-3" />
          {status === 'PAUSED' ? 'Resume' : 'Start'}
        </Button>
      )}
      {status === 'SCHEDULED' && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-xs gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
          onClick={() => startMutation.mutate()}
          disabled={startMutation.isPending}
        >
          <Play className="w-3 h-3" />
          Start Now
        </Button>
      )}
      {status === 'RUNNING' && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2.5 text-xs gap-1 border-yellow-500/30 text-yellow-600 hover:bg-yellow-500/10"
          onClick={() => pauseMutation.mutate()}
          disabled={pauseMutation.isPending}
        >
          <Pause className="w-3 h-3" />
          Pause
        </Button>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientCampaignsPage() {
  const [statusFilter, setStatusFilter] = useState<CampaignStatus>('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['client-campaigns'],
    queryFn: () => fetch('/api/client/campaigns').then((r) => r.json()),
    refetchInterval: 15000,
  })

  const campaigns: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.campaigns)
    ? data.campaigns
    : []

  const filtered =
    statusFilter === 'ALL'
      ? campaigns
      : campaigns.filter((c: any) => c.status === statusFilter)

  // Summary stats
  const totalCampaigns = campaigns.length
  const runningCount = campaigns.filter((c: any) => c.status === 'RUNNING').length
  const completedCount = campaigns.filter((c: any) => c.status === 'COMPLETED').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Campaigns</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Outbound voice campaigns running with your assigned agents
          </p>
        </div>
        <CreateCampaignDialog />
      </div>

      {/* Summary Stats Row */}
      {!isLoading && campaigns.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Campaigns', value: totalCampaigns },
            { label: 'Running', value: runningCount, highlight: runningCount > 0 },
            { label: 'Completed', value: completedCount },
            { label: 'Scheduled', value: campaigns.filter((c: any) => c.status === 'SCHEDULED').length },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-none">
              <CardContent className="p-3">
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                <p
                  className={cn(
                    'text-lg font-bold mt-0.5',
                    stat.highlight ? 'text-emerald-600' : 'text-foreground'
                  )}
                >
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border overflow-x-auto">
        {STATUSES.map((s) => (
          <Button
            key={s}
            onClick={() => setStatusFilter(s)}
            variant={statusFilter === s ? 'default' : 'ghost'}
            size="sm"
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
          >
            {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {/* Campaign list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse bg-muted border border-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-none border-dashed">
          <CardContent className="py-14 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
              <Megaphone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No campaigns found</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter !== 'ALL'
                ? `No ${statusFilter.toLowerCase()} campaigns.`
                : 'Click "+ New Campaign" to create your first campaign.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((campaign: any) => {
            const total = campaign.totalContacts ?? campaign._count?.contacts ?? 0
            const completed = campaign.completedCalls ?? 0
            const successful = campaign.successfulCalls ?? 0
            const failed = campaign.failedCalls ?? 0
            const progress = total > 0 ? Math.min(100, (completed / total) * 100) : 0
            const isRunning = campaign.status === 'RUNNING'
            const duration = campaign.totalDuration ?? 0

            return (
              <Card
                key={campaign.id}
                className={cn('shadow-none', isRunning && 'border-emerald-500/30')}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm text-foreground">{campaign.name}</h3>
                        <Badge
                          className={cn(
                            'text-[10px] font-semibold border-0',
                            STATUS_STYLES[campaign.status] ?? ''
                          )}
                        >
                          {campaign.status.charAt(0) + campaign.status.slice(1).toLowerCase()}
                        </Badge>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 flex-wrap">
                        {campaign.agent?.name && (
                          <span className="flex items-center gap-1">
                            <Bot className="w-3 h-3" />
                            {campaign.agent.name}
                          </span>
                        )}
                        <span>{formatDate(campaign.createdAt)}</span>
                        {campaign.status === 'SCHEDULED' && campaign.scheduledAt && (
                          <span className="flex items-center gap-1 text-blue-500">
                            <Calendar className="w-3 h-3" />
                            Scheduled: {new Date(campaign.scheduledAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })} {new Date(campaign.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </span>
                        )}
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground mb-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {total} contacts
                        </span>
                        {completed > 0 && (
                          <span>{completed} completed</span>
                        )}
                        {successful > 0 && (
                          <span className="text-emerald-600">{successful} successful</span>
                        )}
                        {failed > 0 && (
                          <span className="text-red-500">{failed} failed</span>
                        )}
                        {duration > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(duration)}
                          </span>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground">
                            {completed}/{total} calls
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              isRunning
                                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                : campaign.status === 'COMPLETED'
                                ? 'bg-blue-500'
                                : 'bg-muted-foreground/30'
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <CampaignActions campaign={campaign} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} campaign{filtered.length !== 1 ? 's' : ''}
          {statusFilter !== 'ALL' && ` · filtered by ${statusFilter.toLowerCase()}`}
        </p>
      )}
    </div>
  )
}
