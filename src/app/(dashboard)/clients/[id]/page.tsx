'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Bot, Check, Key } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [newPassword, setNewPassword] = useState('')
  const [showPasswordField, setShowPasswordField] = useState(false)

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => fetch(`/api/clients/${id}`).then((r) => r.json()),
  })

  const { data: allAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/agents').then((r) => r.json()),
  })

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

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-lg animate-pulse bg-muted" />)}</div>
  if (!client) return <p className="text-muted-foreground">Client not found</p>

  const assignedIds = new Set((client.agents || []).map((a: any) => a.agentId))
  const agents = Array.isArray(allAgents) ? allAgents : []

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
        <div className="ml-auto">
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

      {/* Reset Password */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
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
