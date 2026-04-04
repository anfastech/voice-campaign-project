'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Bot, Save, Loader2, Phone, Megaphone } from 'lucide-react'
import type { DashboardConfig } from '@/lib/dashboard-config'

export default function ClientAgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPrompt, setEditPrompt] = useState('')
  const [editFirstMessage, setEditFirstMessage] = useState('')

  const { data: agent, isLoading } = useQuery({
    queryKey: ['client-agent-detail', id],
    queryFn: () => fetch(`/api/client/agents/${id}`).then((r) => r.json()),
  })

  const { data: config } = useQuery<DashboardConfig>({
    queryKey: ['client-dashboard-config', 'self'],
    queryFn: () => fetch('/api/client/dashboard-config').then((r) => r.json()),
    staleTime: 60_000,
  })

  const canEdit = config?.sections?.agents?.features?.editSettings === true

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      fetch(`/api/client/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-agent-detail', id] })
      setEditing(false)
    },
  })

  function startEditing() {
    setEditName(agent.name)
    setEditPrompt(agent.systemPrompt)
    setEditFirstMessage(agent.firstMessage || '')
    setEditing(true)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  }

  if (!agent?.id) {
    return <div className="text-center py-16 text-muted-foreground">Agent not found</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push('/client/agents')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">{agent.name}</h2>
          {agent.description && <p className="text-sm text-muted-foreground">{agent.description}</p>}
        </div>
        <Badge variant={agent.isActive ? 'default' : 'secondary'}>{agent.isActive ? 'Active' : 'Inactive'}</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Calls', value: agent._count?.calls ?? 0, icon: Phone },
          { label: 'Campaigns', value: agent._count?.campaigns ?? 0, icon: Megaphone },
          { label: 'Language', value: agent.language?.toUpperCase() || 'EN', icon: Bot },
          { label: 'Max Duration', value: `${agent.maxDuration || 300}s`, icon: Bot },
        ].map((s) => (
          <Card key={s.label} className="shadow-none">
            <CardContent className="p-3">
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold mt-0.5">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Prompt */}
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">System Prompt</CardTitle>
          {canEdit && !editing && (
            <Button size="sm" variant="outline" className="text-xs" onClick={startEditing}>Edit</Button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Agent Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">System Prompt</Label>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  rows={10}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">First Message</Label>
                <Input value={editFirstMessage} onChange={(e) => setEditFirstMessage(e.target.value)} className="text-sm" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditing(false)}>Cancel</Button>
                <Button
                  size="sm"
                  className="text-xs gap-1"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate({
                    name: editName,
                    systemPrompt: editPrompt,
                    firstMessage: editFirstMessage,
                  })}
                >
                  {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
              {agent.systemPrompt}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* First Message */}
      {agent.firstMessage && !editing && (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">First Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{agent.firstMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Voice & Settings (read-only) */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Voice Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Voice', value: agent.voice || 'Default' },
              { label: 'Language', value: agent.language || 'en' },
              { label: 'Temperature', value: agent.temperature ?? 0.7 },
              { label: 'Max Duration', value: `${agent.maxDuration || 300}s` },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium capitalize">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
