'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Bot, Check, Key, ExternalLink, Copy, Phone,
  Shield, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Save,
  MessageSquare, Megaphone, Target,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DashboardConfigEditor } from '@/components/clients/DashboardConfigEditor'
import { ClientBrandingEditor } from '@/components/clients/ClientBrandingEditor'
import { formatDate, formatDuration, formatCurrency } from '@/lib/utils'

type Tab = 'overview' | 'conversations' | 'campaigns' | 'leads'

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: ExternalLink },
  { key: 'conversations', label: 'Conversations', icon: MessageSquare },
  { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { key: 'leads', label: 'Leads', icon: Target },
]

// ── Status configs ──────────────────────────────────────────────
const callStatusConfig: Record<string, { label: string; className: string }> = {
  COMPLETED: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-600' },
  FAILED: { label: 'Failed', className: 'bg-red-500/10 text-red-600' },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-500/10 text-blue-600' },
  NO_ANSWER: { label: 'No Answer', className: 'bg-amber-500/10 text-amber-600' },
  INITIATED: { label: 'Initiated', className: 'bg-gray-500/10 text-gray-600' },
  BUSY: { label: 'Busy', className: 'bg-sky-500/10 text-sky-600' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-500/10 text-gray-600' },
}

const campaignStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  SCHEDULED: { label: 'Scheduled', variant: 'outline' },
  RUNNING: { label: 'Running', variant: 'default' },
  PAUSED: { label: 'Paused', variant: 'outline' },
  COMPLETED: { label: 'Completed', variant: 'default' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
}

const leadStatusStyles: Record<string, string> = {
  NEW: 'bg-blue-500/10 text-blue-600',
  CONTACTED: 'bg-yellow-500/10 text-yellow-600',
  QUALIFIED: 'bg-purple-500/10 text-purple-600',
  PROPOSAL: 'bg-orange-500/10 text-orange-600',
  WON: 'bg-emerald-500/10 text-emerald-600',
  LOST: 'bg-red-500/10 text-red-600',
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [newPassword, setNewPassword] = useState('')
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [copied, setCopied] = useState(false)

  // Integration form state
  const [accountSid, setAccountSid] = useState('')
  const [authToken, setAuthToken] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [showAuthToken, setShowAuthToken] = useState(false)
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string; accountName?: string } | null>(null)

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => fetch(`/api/clients/${id}`).then((r) => r.json()),
  })

  const { data: allAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/agents').then((r) => r.json()),
  })

  // Tab data queries
  const { data: conversationsData, isLoading: convLoading } = useQuery({
    queryKey: ['client-conversations', id],
    queryFn: () => fetch(`/api/clients/${id}/conversations`).then((r) => r.json()),
    enabled: activeTab === 'conversations',
  })

  const { data: campaignsData, isLoading: campLoading } = useQuery({
    queryKey: ['client-campaigns', id],
    queryFn: () => fetch(`/api/clients/${id}/campaigns`).then((r) => r.json()),
    enabled: activeTab === 'campaigns',
  })

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['client-leads', id],
    queryFn: () => fetch(`/api/clients/${id}/leads`).then((r) => r.json()),
    enabled: activeTab === 'leads',
  })

  useEffect(() => {
    if (client?.integration) {
      setAccountSid(client.integration.accountSid || '')
      setPhoneNumber(client.integration.phoneNumber || '')
    }
  }, [client])

  const assignMutation = useMutation({
    mutationFn: (agentId: string) =>
      fetch(`/api/clients/${id}/agents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId }) }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', id] }),
  })

  const unassignMutation = useMutation({
    mutationFn: (agentId: string) =>
      fetch(`/api/clients/${id}/agents`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId }) }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', id] }),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (password: string) =>
      fetch(`/api/clients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }).then((r) => r.json()),
    onSuccess: () => { setNewPassword(''); setShowPasswordField(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/clients/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => router.push('/clients'),
  })

  const saveIntegrationMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      fetch(`/api/clients/${id}/integration`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['client', id] }); setAuthToken(''); setTestResult(null) },
  })

  const testConnectionMutation = useMutation({
    mutationFn: (creds: { accountSid: string; authToken: string }) =>
      fetch(`/api/clients/${id}/integration/test`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) }).then((r) => r.json()),
    onSuccess: (data) => setTestResult(data),
  })

  const handleSaveIntegration = () => {
    const data: Record<string, string> = {}
    if (accountSid) data.accountSid = accountSid
    if (authToken) data.authToken = authToken
    if (phoneNumber) data.phoneNumber = phoneNumber
    saveIntegrationMutation.mutate(data)
  }

  const handleCopyLink = () => {
    const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : ''
    navigator.clipboard.writeText(loginUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-lg animate-pulse bg-muted" />)}</div>
  if (!client) return <p className="text-muted-foreground">Client not found</p>

  const assignedIds = new Set((client.agents || []).map((a: any) => a.agentId))
  const agents = Array.isArray(allAgents) ? allAgents : []
  const integration = client.integration
  const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : ''

  const conversations = conversationsData?.calls ?? []
  const campaigns = Array.isArray(campaignsData) ? campaignsData : []
  const leads = Array.isArray(leadsData) ? leadsData : []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/clients">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-foreground">{client.name}</h2>
          <p className="text-sm text-muted-foreground">{client.email}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {integration?.isConnected && (
            <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Connected
            </Badge>
          )}
          <Badge variant={client.isActive ? 'default' : 'secondary'}>
            {client.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className="gap-1.5 text-xs"
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Client Info */}
          <Card className="shadow-none">
            <CardHeader><CardTitle className="text-base">Client Information</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground">Company</p><p className="font-medium text-foreground">{client.companyName || '—'}</p></div>
                <div><p className="text-muted-foreground">Created</p><p className="font-medium text-foreground">{new Date(client.createdAt).toLocaleDateString()}</p></div>
              </div>
              {client.notes && <div><p className="text-muted-foreground">Notes</p><p className="font-medium text-foreground">{client.notes}</p></div>}
            </CardContent>
          </Card>

          {/* Dashboard Access */}
          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><ExternalLink className="w-5 h-5 text-primary" /></div>
                <div><CardTitle className="text-base">Dashboard Access</CardTitle><CardDescription>Share credentials with your client</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-muted-foreground">Login URL</p><p className="text-sm font-mono text-foreground">{loginUrl}</p></div>
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium text-foreground">{client.email}</p></div>
                  <div><p className="text-xs text-muted-foreground">Role</p><p className="text-sm font-medium text-foreground">Client</p></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DashboardConfigEditor clientId={id} clientName={client.name} />
          <ClientBrandingEditor clientId={id} clientName={client.name} />

          {/* Phone Integration */}
          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Phone className="w-5 h-5 text-primary" /></div>
                <div className="flex-1"><CardTitle className="text-base">Phone Integration</CardTitle><CardDescription>Configure dedicated phone connection</CardDescription></div>
                <Badge variant={integration?.isConnected ? 'default' : 'secondary'} className="gap-1.5">
                  {integration?.isConnected ? <><CheckCircle2 className="w-3 h-3" /> Connected</> : <><XCircle className="w-3 h-3" /> Not Connected</>}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountSid">Account SID</Label>
                <Input id="accountSid" value={accountSid} onChange={(e) => setAccountSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authToken">Auth Token</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input id="authToken" type={showAuthToken ? 'text' : 'password'} value={authToken} onChange={(e) => setAuthToken(e.target.value)} placeholder={integration?.hasAuthToken ? '••••••••••••••••' : 'Enter auth token...'} className="font-mono text-sm pr-10" />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-7 w-7" onClick={() => setShowAuthToken(!showAuthToken)}>
                      {showAuthToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                  <Button variant="outline" onClick={() => testConnectionMutation.mutate({ accountSid: accountSid || integration?.accountSid || '', authToken: authToken || integration?.authToken || '' })} disabled={(!accountSid && !integration?.accountSid) || (!authToken && !integration?.hasAuthToken) || testConnectionMutation.isPending}>
                    {testConnectionMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test'}
                  </Button>
                </div>
              </div>
              {testResult && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${testResult.valid ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                  {testResult.valid ? <><CheckCircle2 className="w-4 h-4 shrink-0" /> Connected — {testResult.accountName}</> : <><XCircle className="w-4 h-4 shrink-0" /> {testResult.error}</>}
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Dedicated Phone Number</Label>
                <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 123-4567" />
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveIntegration} disabled={saveIntegrationMutation.isPending}><Save className="w-3.5 h-3.5 mr-2" />{saveIntegrationMutation.isPending ? 'Saving...' : 'Save Integration'}</Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
                <div><CardTitle className="text-base">Security</CardTitle><CardDescription>Manage client login credentials</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent>
              {showPasswordField ? (
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} /></div>
                  <Button onClick={() => resetPasswordMutation.mutate(newPassword)} disabled={newPassword.length < 6}>Save</Button>
                  <Button variant="outline" onClick={() => setShowPasswordField(false)}>Cancel</Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setShowPasswordField(true)}><Key className="w-3.5 h-3.5 mr-2" />Reset Password</Button>
              )}
            </CardContent>
          </Card>

          {/* Agent Assignment */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">Assigned Agents</CardTitle>
              <CardDescription>Toggle which agents this client can access</CardDescription>
            </CardHeader>
            <CardContent>
              {agents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No agents created yet.</p>
              ) : (
                <div className="space-y-2">
                  {agents.map((agent: any) => {
                    const isAssigned = assignedIds.has(agent.id)
                    return (
                      <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Bot className="w-4 h-4 text-primary" /></div>
                          <div><p className="text-sm font-medium text-foreground">{agent.name}</p><p className="text-xs text-muted-foreground">{agent.description || 'Voice AI Agent'}</p></div>
                        </div>
                        <Button variant={isAssigned ? 'default' : 'outline'} size="sm" onClick={() => isAssigned ? unassignMutation.mutate(agent.id) : assignMutation.mutate(agent.id)} disabled={assignMutation.isPending || unassignMutation.isPending}>
                          {isAssigned ? <><Check className="w-3.5 h-3.5 mr-1.5" /> Assigned</> : 'Assign'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="shadow-none border-destructive/20">
            <CardHeader><CardTitle className="text-base text-destructive">Danger Zone</CardTitle></CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => { if (confirm(`Delete client "${client.name}"? This cannot be undone.`)) deleteMutation.mutate() }}>Delete Client</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ CONVERSATIONS TAB ═══ */}
      {activeTab === 'conversations' && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Conversations</CardTitle>
            <CardDescription>{conversations.length} call{conversations.length !== 1 ? 's' : ''} from this client&apos;s agents</CardDescription>
          </CardHeader>
          <CardContent>
            {convLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg animate-pulse bg-muted" />)}</div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Contact</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 font-medium text-muted-foreground">Agent</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Duration</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversations.map((call: any) => {
                      const cfg = callStatusConfig[call.status] || { label: call.status, className: 'bg-gray-500/10 text-gray-600' }
                      return (
                        <tr key={call.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="py-3">
                            <p className="font-medium">{call.contact?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{call.contact?.phoneNumber}</p>
                          </td>
                          <td className="py-3">
                            <Badge variant="secondary" className={`text-[10px] border-0 ${cfg.className}`}>{cfg.label}</Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">{call.agent?.name || '—'}</td>
                          <td className="py-3 text-right tabular-nums">{call.duration ? formatDuration(call.duration) : '—'}</td>
                          <td className="py-3 text-right text-muted-foreground">{formatDate(call.startedAt)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ CAMPAIGNS TAB ═══ */}
      {activeTab === 'campaigns' && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Campaigns</CardTitle>
            <CardDescription>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} using this client&apos;s agents</CardDescription>
          </CardHeader>
          <CardContent>
            {campLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-lg animate-pulse bg-muted" />)}</div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Megaphone className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No campaigns yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign: any) => {
                  const statusCfg = campaignStatusConfig[campaign.status] || { label: campaign.status, variant: 'secondary' as const }
                  const progress = campaign._count?.contacts > 0
                    ? Math.round((campaign.completedCalls / campaign._count.contacts) * 100)
                    : 0
                  return (
                    <div key={campaign.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{campaign.name}</p>
                          <Badge variant={statusCfg.variant} className="text-[10px]">{statusCfg.label}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{campaign.agent?.name}</span>
                      </div>
                      {campaign.status === 'RUNNING' && (
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{campaign._count?.contacts ?? 0} contacts</span>
                        <span>{campaign._count?.calls ?? 0} calls</span>
                        <span>{campaign.successfulCalls ?? 0} successful</span>
                        {campaign.totalCost > 0 && <span>{formatCurrency(campaign.totalCost)}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══ LEADS TAB ═══ */}
      {activeTab === 'leads' && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">Leads</CardTitle>
            <CardDescription>{leads.length} lead{leads.length !== 1 ? 's' : ''} from this client&apos;s agents</CardDescription>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-lg animate-pulse bg-muted" />)}</div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Target className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No leads yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-muted-foreground">Contact</th>
                      <th className="pb-3 font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 font-medium text-muted-foreground">Agent</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Value</th>
                      <th className="pb-3 font-medium text-muted-foreground text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead: any) => (
                      <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3">
                          <p className="font-medium">{lead.contact?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{lead.contact?.phoneNumber}</p>
                        </td>
                        <td className="py-3">
                          <Badge variant="secondary" className={`text-[10px] border-0 ${leadStatusStyles[lead.status] ?? ''}`}>{lead.status}</Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">{lead.agent?.name || '—'}</td>
                        <td className="py-3 text-right tabular-nums font-medium">
                          {lead.value != null ? formatCurrency(lead.value) : '—'}
                        </td>
                        <td className="py-3 text-right text-muted-foreground">{formatDate(lead.convertedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
