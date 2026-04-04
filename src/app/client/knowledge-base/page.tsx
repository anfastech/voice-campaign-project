'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BookOpen, Plus, Trash2, FileText, Globe, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  SYNCED: { label: 'Synced', variant: 'default' },
  PENDING: { label: 'Pending', variant: 'secondary' },
  FAILED: { label: 'Failed', variant: 'destructive' },
}

export default function ClientKnowledgeBasePage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [docType, setDocType] = useState<'TEXT' | 'URL'>('TEXT')
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [agentId, setAgentId] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['client-kb'],
    queryFn: () => fetch('/api/client/knowledge-base').then((r) => r.json()),
  })

  const { data: agents = [] } = useQuery({
    queryKey: ['client-agents'],
    queryFn: () => fetch('/api/client/agents').then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/client/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-kb'] })
      setShowForm(false)
      setName('')
      setContent('')
      setUrl('')
      setAgentId('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/client/knowledge-base/${id}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) throw new Error('Failed')
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['client-kb'] }),
  })

  const docs = data?.documents ?? []
  const agentList: any[] = Array.isArray(agents) ? agents : []

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Knowledge Base</h2>
          <p className="text-sm text-muted-foreground mt-1">Documents your agents use to answer questions</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          Add Document
        </Button>
      </div>

      {showForm && (
        <Card className="shadow-none">
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <Button size="sm" variant={docType === 'TEXT' ? 'default' : 'outline'} className="text-xs" onClick={() => setDocType('TEXT')}>
                <FileText className="w-3 h-3 mr-1" /> Text
              </Button>
              <Button size="sm" variant={docType === 'URL' ? 'default' : 'outline'} className="text-xs" onClick={() => setDocType('URL')}>
                <Globe className="w-3 h-3 mr-1" /> URL
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name" className="h-8 text-xs" />
            </div>
            {docType === 'TEXT' ? (
              <div className="space-y-1.5">
                <Label className="text-xs">Content</Label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your text content..."
                  rows={5}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs">URL</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="h-8 text-xs" />
              </div>
            )}
            {agentList.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Assign to Agent (optional)</Label>
                <select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                >
                  <option value="">All Agents</option>
                  {agentList.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                size="sm"
                className="text-xs"
                disabled={!name.trim() || (docType === 'TEXT' ? !content.trim() : !url.trim()) || createMutation.isPending}
                onClick={() => createMutation.mutate({
                  name: name.trim(),
                  type: docType,
                  ...(docType === 'TEXT' ? { content } : { url }),
                  ...(agentId ? { agentId } : {}),
                })}
              >
                {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Add Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg animate-pulse bg-muted" />)}
        </div>
      ) : docs.length === 0 ? (
        <Card className="shadow-none border-dashed">
          <CardContent className="py-14 flex flex-col items-center text-center">
            <BookOpen className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No documents yet. Add text or URL documents for your agents.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {docs.map((doc: any) => {
            const statusInfo = STATUS_BADGE[doc.syncStatus] || STATUS_BADGE.PENDING
            const StatusIcon = doc.syncStatus === 'SYNCED' ? CheckCircle : doc.syncStatus === 'FAILED' ? XCircle : Clock
            return (
              <Card key={doc.id} className="shadow-none">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {doc.type === 'TEXT' ? <FileText className="w-4 h-4 text-muted-foreground shrink-0" /> : <Globe className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{doc.type}</span>
                        {doc.agent && <span className="text-[11px] text-muted-foreground">· {doc.agent.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusInfo.variant} className="text-[10px] gap-1">
                      <StatusIcon className="w-2.5 h-2.5" />
                      {statusInfo.label}
                    </Badge>
                    {doc.clientId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
