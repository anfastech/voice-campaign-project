'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Bot, Check, Key, ExternalLink, Copy, Phone,
  Shield, CheckCircle2, XCircle, Loader2, Eye, EyeOff, Save,
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

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
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

  // Populate integration fields when data loads
  useEffect(() => {
    if (client?.integration) {
      setAccountSid(client.integration.accountSid || '')
      setPhoneNumber(client.integration.phoneNumber || '')
    }
  }, [client])

  const assignMutation = useMutation({
    mutationFn: (agentId: string) =>
      fetch(`/api/clients/${id}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', id] }),
  })

  const unassignMutation = useMutation({
    mutationFn: (agentId: string) =>
      fetch(`/api/clients/${id}/agents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client', id] }),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (password: string) =>
      fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }).then((r) => r.json()),
    onSuccess: () => { setNewPassword(''); setShowPasswordField(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: () => fetch(`/api/clients/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => router.push('/clients'),
  })

  const saveIntegrationMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      fetch(`/api/clients/${id}/integration`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] })
      setAuthToken('')
      setTestResult(null)
    },
  })

  const testConnectionMutation = useMutation({
    mutationFn: (creds: { accountSid: string; authToken: string }) =>
      fetch(`/api/clients/${id}/integration/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      }).then((r) => r.json()),
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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

      {/* Client Info */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground">Company</p>
              <p className="font-medium text-foreground">{client.companyName || '\u2014'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium text-foreground">{new Date(client.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {client.notes && (
            <div>
              <p className="text-muted-foreground">Notes</p>
              <p className="font-medium text-foreground">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard Access */}
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Dashboard Access</CardTitle>
              <CardDescription>Share these credentials with your client to give them access</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Login URL</p>
                <p className="text-sm font-mono text-foreground">{loginUrl}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{client.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-medium text-foreground">Client</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Client logs in at the URL above with their email and password. They will only see data for their assigned agents.
          </p>
        </CardContent>
      </Card>

      {/* Dashboard Customization */}
      <DashboardConfigEditor clientId={id} clientName={client.name} />

      {/* Client Branding */}
      <ClientBrandingEditor clientId={id} clientName={client.name} />

      {/* Phone Integration */}
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Phone Integration</CardTitle>
              <CardDescription>Configure the dedicated phone connection for this client</CardDescription>
            </div>
            <Badge variant={integration?.isConnected ? 'default' : 'secondary'} className="gap-1.5">
              {integration?.isConnected ? (
                <><CheckCircle2 className="w-3 h-3" /> Connected</>
              ) : (
                <><XCircle className="w-3 h-3" /> Not Connected</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountSid">Account SID</Label>
            <Input
              id="accountSid"
              value={accountSid}
              onChange={(e) => setAccountSid(e.target.value)}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authToken">Auth Token</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="authToken"
                  type={showAuthToken ? 'text' : 'password'}
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder={integration?.hasAuthToken ? '••••••••••••••••••••••••••••' : 'Enter auth token...'}
                  className="font-mono text-sm pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7"
                  onClick={() => setShowAuthToken(!showAuthToken)}
                >
                  {showAuthToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => testConnectionMutation.mutate({
                  accountSid: accountSid || integration?.accountSid || '',
                  authToken: authToken || integration?.authToken || '',
                })}
                disabled={(!accountSid && !integration?.accountSid) || (!authToken && !integration?.hasAuthToken) || testConnectionMutation.isPending}
              >
                {testConnectionMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Test'}
              </Button>
            </div>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${testResult.valid ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
              {testResult.valid ? (
                <><CheckCircle2 className="w-4 h-4 shrink-0" /> Connected — {testResult.accountName}</>
              ) : (
                <><XCircle className="w-4 h-4 shrink-0" /> {testResult.error}</>
              )}
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Dedicated Phone Number</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
            <p className="text-xs text-muted-foreground">The phone number used for outbound calls for this client</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={`${loginUrl.replace('/login', '')}/api/webhooks/calls`}
                className="bg-muted font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/calls`)}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Configure this URL in your phone provider for call event webhooks</p>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveIntegration} disabled={saveIntegrationMutation.isPending}>
              <Save className="w-3.5 h-3.5 mr-2" />
              {saveIntegrationMutation.isPending ? 'Saving...' : 'Save Integration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Security</CardTitle>
              <CardDescription>Manage client login credentials</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showPasswordField ? (
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} />
              </div>
              <Button onClick={() => resetPasswordMutation.mutate(newPassword)} disabled={newPassword.length < 6}>
                Save
              </Button>
              <Button variant="outline" onClick={() => setShowPasswordField(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowPasswordField(true)}>
              <Key className="w-3.5 h-3.5 mr-2" />
              Reset Password
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Agent Assignment */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Assigned Agents</CardTitle>
          <CardDescription>
            Toggle which agents this client can access. Assigned agents give the client analytics, conversations, campaigns, and contacts for that agent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No agents created yet. Create an agent first.</p>
          ) : (
            <div className="space-y-2">
              {agents.map((agent: any) => {
                const isAssigned = assignedIds.has(agent.id)
                return (
                  <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.description || 'Voice AI Agent'}</p>
                      </div>
                    </div>
                    <Button
                      variant={isAssigned ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => isAssigned ? unassignMutation.mutate(agent.id) : assignMutation.mutate(agent.id)}
                      disabled={assignMutation.isPending || unassignMutation.isPending}
                    >
                      {isAssigned ? (
                        <><Check className="w-3.5 h-3.5 mr-1.5" /> Assigned</>
                      ) : (
                        'Assign'
                      )}
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
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => {
            if (confirm(`Delete client "${client.name}"? This cannot be undone.`)) deleteMutation.mutate()
          }}>
            Delete Client
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
