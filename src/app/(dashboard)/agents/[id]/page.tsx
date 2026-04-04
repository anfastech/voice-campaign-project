'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowLeft, Bot, Mic2, Phone, Thermometer, Clock, Globe,
  Radio, Trash2, Sparkles, MessageSquare, Link2, Link2Off, RefreshCw,
  BookOpen, Wrench, Plus, Loader2, AlertCircle, ChevronDown, ChevronUp,
  FileText, Type, Link as LinkIcon, BarChart2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'

type AgentTool = {
  id: string
  name: string
  description: string
  parameters: Record<string, unknown>
  webhookUrl: string
  isActive: boolean
  createdAt: string
}

type KBDoc = {
  id: string
  name: string
  type: 'TEXT' | 'FILE' | 'URL'
  content?: string | null
  url?: string | null
  fileName?: string | null
  syncStatus: string
  createdAt: string
}

const CALL_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  COMPLETED:   { label: 'Completed',   className: 'bg-emerald-500/10 text-emerald-600' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-500/10 text-blue-600' },
  INITIATED:   { label: 'Initiated',   className: 'bg-blue-500/10 text-blue-600' },
  RINGING:     { label: 'Ringing',     className: 'bg-amber-500/10 text-amber-600' },
  FAILED:      { label: 'Failed',      className: 'bg-red-500/10 text-red-600' },
  NO_ANSWER:   { label: 'No Answer',   className: 'bg-red-500/10 text-red-600' },
  BUSY:        { label: 'Busy',        className: 'bg-orange-500/10 text-orange-600' },
  CANCELLED:   { label: 'Cancelled',   className: 'bg-muted text-muted-foreground' },
}

const CAMPAIGN_STATUS_CONFIG: Record<string, string> = {
  RUNNING:    'bg-emerald-500/10 text-emerald-600',
  COMPLETED:  'bg-emerald-500/10 text-emerald-600',
  PAUSED:     'bg-amber-500/10 text-amber-600',
  DRAFT:      'bg-muted text-muted-foreground',
  SCHEDULED:  'bg-blue-500/10 text-blue-600',
  CANCELLED:  'bg-muted text-muted-foreground',
}

const DOC_TYPE_ICONS = {
  TEXT: Type,
  URL: LinkIcon,
  FILE: FileText,
}

const DOC_TYPE_LABELS = {
  TEXT: 'Text',
  URL: 'URL',
  FILE: 'File',
}

function formatDuration(s?: number | null) {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function formatDate(d?: string | Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const DEFAULT_PARAMS = JSON.stringify({ type: 'object', properties: {} }, null, 2)

export default function AgentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const queryClient = useQueryClient()

  const [toolFormOpen, setToolFormOpen] = useState(false)
  const [toolForm, setToolForm] = useState({
    name: '',
    description: '',
    webhookUrl: '',
    parameters: DEFAULT_PARAMS,
  })
  const [toolError, setToolError] = useState<string | null>(null)

  // KB doc add form state
  const [kbFormOpen, setKbFormOpen] = useState(false)
  const [kbActiveTab, setKbActiveTab] = useState<'TEXT' | 'URL'>('TEXT')
  const [kbTextForm, setKbTextForm] = useState({ name: '', content: '' })
  const [kbUrlForm, setKbUrlForm] = useState({ name: '', url: '' })
  const [kbError, setKbError] = useState<string | null>(null)

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => fetch(`/api/agents/${id}`).then((r) => r.json()),
    enabled: !!id,
  })

  const { data: agentDocs, isLoading: docsLoading } = useQuery<KBDoc[]>({
    queryKey: ['agent-kb', id],
    queryFn: () => fetch(`/api/agents/${id}/knowledge-base`).then((r) => r.json()),
    enabled: !!id,
  })

  const { data: campaignsData } = useQuery({
    queryKey: ['agent-campaigns', id],
    queryFn: () => fetch('/api/campaigns?agentId=' + id).then((r) => r.json()),
    enabled: !!id,
  })

  const syncMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/agents/${id}/sync`, { method: 'POST' }).then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}))
          throw new Error(body.error || 'Sync failed')
        }
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/agents/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      router.push('/agents')
    },
  })

  const createToolMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      fetch(`/api/agents/${id}/tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || 'Failed to create tool')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] })
      setToolForm({ name: '', description: '', webhookUrl: '', parameters: DEFAULT_PARAMS })
      setToolFormOpen(false)
      setToolError(null)
    },
    onError: (err: Error) => setToolError(err.message),
  })

  const deleteToolMutation = useMutation({
    mutationFn: (toolId: string) =>
      fetch(`/api/agents/${id}/tools/${toolId}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent', id] }),
  })

  const toggleToolMutation = useMutation({
    mutationFn: ({ toolId, isActive }: { toolId: string; isActive: boolean }) =>
      fetch(`/api/agents/${id}/tools/${toolId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent', id] }),
  })

  const createDocMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async (r) => {
        if (r.status !== 201 && r.status !== 207) throw new Error((await r.json()).error || 'Failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-kb', id] })
      setKbTextForm({ name: '', content: '' })
      setKbUrlForm({ name: '', url: '' })
      setKbFormOpen(false)
      setKbError(null)
    },
    onError: (err: Error) => setKbError(err.message),
  })

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) =>
      fetch(`/api/knowledge-base/${docId}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agent-kb', id] }),
  })

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="h-10 w-32 rounded-xl relative overflow-hidden bg-card border">
          <div className="absolute inset-0 shimmer" />
        </div>
        <div className="h-48 rounded-2xl relative overflow-hidden bg-card border">
          <div className="absolute inset-0 shimmer" />
        </div>
        <div className="h-64 rounded-2xl relative overflow-hidden bg-card border">
          <div className="absolute inset-0 shimmer" />
        </div>
      </div>
    )
  }

  if (!agent || agent.error) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-muted-foreground">Agent not found.</p>
        <Link href="/agents">
          <Button variant="outline" className="mt-4">
            Back to Agents
          </Button>
        </Link>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = agent as any
  const tools: AgentTool[] = a.tools || []
  const docs: KBDoc[] = Array.isArray(agentDocs) ? agentDocs : []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agentCampaigns: any[] = campaignsData?.campaigns ?? []

  const handleAddTool = () => {
    setToolError(null)
    let parsedParams: Record<string, unknown>
    try {
      parsedParams = JSON.parse(toolForm.parameters)
    } catch {
      setToolError('Parameters must be valid JSON')
      return
    }
    createToolMutation.mutate({
      name: toolForm.name,
      description: toolForm.description,
      webhookUrl: toolForm.webhookUrl,
      parameters: parsedParams,
    })
  }

  const handleAddDoc = () => {
    setKbError(null)
    if (kbActiveTab === 'TEXT') {
      if (!kbTextForm.name.trim() || !kbTextForm.content.trim()) {
        setKbError('Name and content are required')
        return
      }
      createDocMutation.mutate({ type: 'TEXT', name: kbTextForm.name, content: kbTextForm.content, agentId: id })
    } else {
      if (!kbUrlForm.name.trim() || !kbUrlForm.url.trim()) {
        setKbError('Name and URL are required')
        return
      }
      createDocMutation.mutate({ type: 'URL', name: kbUrlForm.name, url: kbUrlForm.url, agentId: id })
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{a.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                Created {formatDate(a.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs bg-muted border text-muted-foreground">
            <Radio className="w-3.5 h-3.5" />
            Test via campaign call
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => { if (confirm('Delete this agent?')) deleteMutation.mutate() }}
            className="rounded-xl border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Calls', value: a._count?.calls ?? 0, icon: Phone },
          { label: 'Campaigns', value: a._count?.campaigns ?? 0, icon: Sparkles },
          { label: 'Temperature', value: a.temperature, icon: Thermometer },
          { label: 'Max Duration', value: formatDuration(a.maxDuration), icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="shadow-none">
            <CardContent className="pt-5 pb-4 px-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className="w-4 h-4 text-muted-foreground/60" />
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Prompt -- hero section */}
      <Card className="rounded-2xl py-0 gap-0 border-2 border-primary/35 shadow-[0_0_0_4px] shadow-primary/5">
        <CardHeader className="px-5 pt-5 pb-0 gap-0">
          <div className="flex items-center gap-2">
            <Mic2 className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">System Prompt</CardTitle>
          </div>
        </CardHeader>
        <div className="px-5">
          <Separator className="mt-3.5" />
        </div>
        <CardContent className="px-5 pt-3 pb-5">
          <div className="rounded-xl p-4 overflow-y-auto bg-muted border min-h-[150px] max-h-[320px]">
            <p className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-foreground">
              {a.systemPrompt}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Config Card */}
      <Card className="rounded-2xl py-0 gap-0">
        <CardHeader className="px-5 pt-5 pb-0 gap-0">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Configuration</CardTitle>
          </div>
        </CardHeader>
        <div className="px-5">
          <Separator className="mt-3.5" />
        </div>
        <CardContent className="px-5 pt-5 pb-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <InfoRow icon={Globe} label="Language" value={a.language?.toUpperCase() || 'EN'} />
            <InfoRow icon={Mic2} label="Voice" value={a.voice || 'rachel'} />
          </div>

          {/* Agent Status */}
          <div
            className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
              a.elevenLabsAgentId
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/20'
            }`}
          >
            {a.elevenLabsAgentId ? (
              <Link2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            ) : (
              <Link2Off className="w-4 h-4 flex-shrink-0 text-amber-600" />
            )}
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold ${a.elevenLabsAgentId ? 'text-emerald-600' : 'text-amber-600'}`}>
                {a.elevenLabsAgentId ? 'Deployed' : 'Not deployed'}
              </p>
              {a.elevenLabsAgentId && (
                <p className="text-xs font-mono truncate text-emerald-600/70">
                  {a.elevenLabsAgentId}
                </p>
              )}
              {syncMutation.isError && (
                <p className="text-xs mt-1 text-red-600">
                  {syncMutation.error?.message || 'Sync failed'}
                </p>
              )}
            </div>
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              variant="outline"
              size="sm"
              className={`flex-shrink-0 text-[11px] font-semibold ${
                a.elevenLabsAgentId
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 hover:bg-emerald-500/20'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-700 hover:bg-amber-500/25'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Syncing...' : a.elevenLabsAgentId ? 'Re-sync' : 'Deploy Agent'}
            </Button>
          </div>

          {a.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1.5 text-muted-foreground">
                Description
              </p>
              <p className="text-sm text-foreground">{a.description}</p>
            </div>
          )}

          {/* First Message */}
          {a.firstMessage && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquare className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  First Message
                </p>
              </div>
              <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm italic text-foreground">&ldquo;{a.firstMessage}&rdquo;</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Knowledge Base Documents */}
      <Card className="rounded-2xl py-0 gap-0 overflow-hidden">
        <CardHeader className="px-5 py-4 gap-0 flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Knowledge Base</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {docs.length}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setKbFormOpen((v) => !v); setKbError(null) }}
            className="text-xs"
          >
            {kbFormOpen ? <ChevronUp className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {kbFormOpen ? 'Close' : 'Add Document'}
          </Button>
        </CardHeader>

        {/* Add document inline form */}
        {kbFormOpen && (
          <div className="px-5 py-4 space-y-3 bg-muted/50 border-b">
            {/* Text / URL tab switcher */}
            <div className="flex gap-1 p-1 rounded-xl w-fit bg-muted">
              {(['TEXT', 'URL'] as const).map((tab) => {
                const Icon = DOC_TYPE_ICONS[tab]
                return (
                  <button
                    key={tab}
                    onClick={() => { setKbActiveTab(tab); setKbError(null) }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      kbActiveTab === tab
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {DOC_TYPE_LABELS[tab]}
                  </button>
                )
              })}
            </div>

            {kbActiveTab === 'TEXT' && (
              <>
                <Input
                  type="text"
                  placeholder="Document name"
                  value={kbTextForm.name}
                  onChange={(e) => setKbTextForm((p) => ({ ...p, name: e.target.value }))}
                  className="rounded-xl"
                />
                <Textarea
                  placeholder="Document content..."
                  value={kbTextForm.content}
                  onChange={(e) => setKbTextForm((p) => ({ ...p, content: e.target.value }))}
                  rows={4}
                  className="rounded-xl resize-none"
                />
              </>
            )}

            {kbActiveTab === 'URL' && (
              <>
                <Input
                  type="text"
                  placeholder="Document name"
                  value={kbUrlForm.name}
                  onChange={(e) => setKbUrlForm((p) => ({ ...p, name: e.target.value }))}
                  className="rounded-xl"
                />
                <Input
                  type="url"
                  placeholder="https://example.com/document"
                  value={kbUrlForm.url}
                  onChange={(e) => setKbUrlForm((p) => ({ ...p, url: e.target.value }))}
                  className="rounded-xl"
                />
              </>
            )}

            {kbError && (
              <div className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {kbError}
              </div>
            )}

            <Button
              onClick={handleAddDoc}
              disabled={createDocMutation.isPending}
              className="rounded-xl font-semibold"
            >
              {createDocMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {createDocMutation.isPending ? 'Adding...' : 'Add Document'}
            </Button>
          </div>
        )}

        {/* Document list */}
        <CardContent className="p-0">
          {docsLoading ? (
            <div className="px-5 py-8 text-center">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : docs.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <BookOpen className="w-7 h-7 mx-auto mb-2 opacity-20 text-foreground" />
              <p className="text-sm text-muted-foreground">No documents assigned to this agent.</p>
            </div>
          ) : (
            docs.map((doc, idx) => {
              const Icon = DOC_TYPE_ICONS[doc.type] || FileText
              return (
                <div key={doc.id}>
                  <div className="flex items-center gap-3 px-5 py-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted border">
                      <Icon className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate text-foreground">
                          {doc.name}
                        </p>
                        <Badge variant="secondary" className="text-xs font-semibold rounded-md">
                          {DOC_TYPE_LABELS[doc.type]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(doc.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => deleteDocMutation.mutate(doc.id)}
                      disabled={deleteDocMutation.isPending}
                      className="rounded-lg border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {idx < docs.length - 1 && <Separator />}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Campaigns */}
      <Card className="rounded-2xl py-0 gap-0 overflow-hidden">
        <CardHeader className="px-5 py-4 gap-0 flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Campaigns</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {agentCampaigns.length}
            </Badge>
          </div>
          <Link href={`/campaigns/new?agentId=${id}`}>
            <Button variant="outline" size="sm" className="text-xs">
              <Plus className="w-3 h-3" />
              New Campaign
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {agentCampaigns.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <BarChart2 className="w-7 h-7 mx-auto mb-2 opacity-20 text-foreground" />
              <p className="text-sm mb-3 text-muted-foreground">No campaigns yet</p>
              <Link href={`/campaigns/new?agentId=${id}`}>
                <Button className="rounded-xl text-xs font-semibold">
                  <Plus className="w-3 h-3" />
                  Create Campaign
                </Button>
              </Link>
            </div>
          ) : (
            agentCampaigns.map((campaign: Record<string, unknown>, idx: number) => {
              const statusClass = CAMPAIGN_STATUS_CONFIG[campaign.status as string] ?? CAMPAIGN_STATUS_CONFIG.DRAFT
              const count = campaign._count as Record<string, number> | undefined
              const total = count?.contacts ?? 0
              const calls = count?.calls ?? 0
              const progress = total > 0 ? Math.round((calls / total) * 100) : 0
              return (
                <div key={campaign.id as string}>
                  <Link href={`/campaigns/${campaign.id}`}>
                    <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate text-foreground">
                            {campaign.name as string}
                          </p>
                          <Badge variant="ghost" className={`text-xs font-bold rounded-md ${statusClass}`}>
                            {campaign.status as string}
                          </Badge>
                        </div>
                        {total > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
                              <div
                                className="h-full rounded-full transition-all duration-300 bg-primary"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs flex-shrink-0 text-muted-foreground">
                              {calls}/{total}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  {idx < agentCampaigns.length - 1 && <Separator />}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Agent Tools */}
      <Card className="rounded-2xl py-0 gap-0 overflow-hidden">
        <CardHeader className="px-5 py-4 gap-0 flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Custom Tools</CardTitle>
            <Badge variant="secondary" className="text-xs font-semibold rounded-md">
              {tools.length}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setToolFormOpen((v) => !v); setToolError(null) }}
            className="text-xs"
          >
            {toolFormOpen ? <ChevronUp className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {toolFormOpen ? 'Close' : 'Add Tool'}
          </Button>
        </CardHeader>

        {/* Add tool form */}
        {toolFormOpen && (
          <div className="px-5 py-4 space-y-3 bg-muted/50 border-b">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider mb-1">
                  Name (snake_case)
                </Label>
                <Input
                  type="text"
                  placeholder="get_pricing"
                  value={toolForm.name}
                  onChange={(e) => setToolForm((p) => ({ ...p, name: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider mb-1">
                  Webhook URL (https://)
                </Label>
                <Input
                  type="url"
                  placeholder="https://yoursite.com/webhook"
                  value={toolForm.webhookUrl}
                  onChange={(e) => setToolForm((p) => ({ ...p, webhookUrl: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider mb-1">
                Description
              </Label>
              <Input
                type="text"
                placeholder="What does this tool do?"
                value={toolForm.description}
                onChange={(e) => setToolForm((p) => ({ ...p, description: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider mb-1">
                Parameters (JSON Schema)
              </Label>
              <Textarea
                rows={4}
                value={toolForm.parameters}
                onChange={(e) => setToolForm((p) => ({ ...p, parameters: e.target.value }))}
                className="rounded-xl font-mono text-xs resize-none"
              />
            </div>
            {toolError && (
              <div className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {toolError}
              </div>
            )}
            <Button
              onClick={handleAddTool}
              disabled={createToolMutation.isPending}
              className="rounded-xl font-semibold"
            >
              {createToolMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {createToolMutation.isPending ? 'Adding...' : 'Add Tool'}
            </Button>
          </div>
        )}

        {/* Tool list */}
        <CardContent className="p-0">
          {tools.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Wrench className="w-7 h-7 mx-auto mb-2 opacity-20 text-foreground" />
              <p className="text-sm text-muted-foreground">No custom tools yet.</p>
            </div>
          ) : (
            tools.map((tool, idx) => (
              <div key={tool.id}>
                <div className="flex items-start gap-3 px-5 py-3.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-muted border">
                    <Wrench className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium font-mono text-foreground">
                        {tool.name}
                      </p>
                      {!tool.isActive && (
                        <Badge variant="secondary" className="text-xs rounded-md">
                          disabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 text-muted-foreground">
                      {tool.description}
                    </p>
                    <p className="text-xs mt-0.5 font-mono truncate text-muted-foreground">
                      {tool.webhookUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => toggleToolMutation.mutate({ toolId: tool.id, isActive: !tool.isActive })}
                      className={`text-xs font-medium ${
                        tool.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                          : ''
                      }`}
                    >
                      {tool.isActive ? 'Active' : 'Inactive'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      onClick={() => deleteToolMutation.mutate(tool.id)}
                      className="rounded-lg border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {idx < tools.length - 1 && <Separator />}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Recent Calls */}
      <Card className="rounded-2xl py-0 gap-0 overflow-hidden">
        <CardHeader className="px-5 py-3.5 gap-0 flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm">Recent Calls</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">
            {(a.calls || []).length} shown
          </span>
        </CardHeader>

        {!a.calls?.length ? (
          <CardContent className="px-5 py-10 text-center">
            <Phone className="w-8 h-8 mx-auto mb-2 opacity-20 text-foreground" />
            <p className="text-sm text-muted-foreground">No calls yet</p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {['Contact', 'Status', 'Duration', 'Date'].map((h) => (
                  <TableHead
                    key={h}
                    className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(a.calls || []).map((call: Record<string, unknown>) => {
                const sc = CALL_STATUS_CONFIG[call.status as string] || CALL_STATUS_CONFIG.CANCELLED
                return (
                  <TableRow key={call.id as string}>
                    <TableCell className="px-5 py-3">
                      <p className="text-xs font-medium text-foreground">
                        {(call.contact as Record<string, unknown>)?.name as string || call.phoneNumber as string}
                      </p>
                      {!!(call.contact as Record<string, unknown>)?.name && (
                        <p className="text-xs text-muted-foreground">
                          {call.phoneNumber as string}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <Badge variant="ghost" className={`text-xs font-bold rounded-lg ${sc.className}`}>
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-xs text-muted-foreground">
                      {formatDuration(call.duration as number)}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-xs text-muted-foreground">
                      {formatDate(call.startedAt as string)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted border">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}
