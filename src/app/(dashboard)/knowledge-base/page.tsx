'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Plus, Trash2, Link, FileText, Type, CheckCircle, XCircle, Clock, Loader2, AlertCircle, RefreshCw, Bot, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type KBDoc = {
  id: string
  name: string
  type: 'TEXT' | 'FILE' | 'URL'
  content?: string | null
  url?: string | null
  fileName?: string | null
  elevenLabsDocId?: string | null
  folderName?: string | null
  syncStatus: string
  syncError?: string | null
  agentId?: string | null
  createdAt: string
}

type Agent = {
  id: string
  name: string
}

const TYPE_ICONS = {
  TEXT: Type,
  URL: Link,
  FILE: FileText,
}

const TYPE_LABELS = {
  TEXT: 'Text',
  URL: 'URL',
  FILE: 'File',
}

function SyncBadge({ doc, onRetry, retrying }: { doc: KBDoc; onRetry: () => void; retrying: boolean }) {
  const status = doc.syncStatus

  if (status === 'SYNCED') {
    return (
      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0 gap-1 text-[10px] font-semibold">
        <CheckCircle className="w-2.5 h-2.5" />
        Synced
      </Badge>
    )
  }

  if (status === 'FAILED') {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-0 gap-1 text-[10px] font-semibold cursor-default">
            <XCircle className="w-2.5 h-2.5" />
            Sync Failed
          </Badge>
          {doc.type !== 'FILE' && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRetry}
              disabled={retrying}
              title="Retry sync"
              className="w-6 h-6 rounded-lg bg-sky-500/10 border-sky-500/25 text-sky-600 hover:bg-sky-500/20"
            >
              {retrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            </Button>
          )}
        </div>
        <p className="text-xs max-w-[220px] text-right leading-tight break-words text-red-600">
          {doc.syncError && doc.syncError !== 'File re-upload is not supported; please delete and re-add the document'
            ? doc.syncError
            : doc.type === 'FILE'
              ? 'Delete and re-add this document to retry.'
              : 'Sync failed. Check your API key or try again.'}
        </p>
      </div>
    )
  }

  // PENDING
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="secondary" className="bg-muted text-muted-foreground border-0 gap-1 text-[10px] font-semibold">
        <Clock className="w-2.5 h-2.5" />
        Pending
      </Badge>
      {doc.type !== 'FILE' && (
        <Button
          variant="outline"
          size="icon"
          onClick={onRetry}
          disabled={retrying}
          title="Retry sync"
          className="w-6 h-6 rounded-lg bg-sky-500/10 border-sky-500/25 text-sky-600 hover:bg-sky-500/20"
        >
          {retrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        </Button>
      )}
    </div>
  )
}

export default function KnowledgeBasePage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'TEXT' | 'URL' | 'FILE'>('TEXT')
  const [textForm, setTextForm] = useState({ name: '', content: '', folderName: '' })
  const [urlForm, setUrlForm] = useState({ name: '', url: '', folderName: '' })
  const [fileName, setFileName] = useState('')
  const [fileFolderName, setFileFolderName] = useState('')
  const [fileInput, setFileInput] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [assignAgentId, setAssignAgentId] = useState<string>('')

  // Fetch agents for the filter dropdown and doc assignment
  const { data: agentsData } = useQuery<{ agents: Agent[] }>({
    queryKey: ['agents-list'],
    queryFn: () => fetch('/api/agents').then((r) => r.json()),
    staleTime: 60000,
  })
  const agents: Agent[] = agentsData?.agents || []

  // Build KB fetch URL based on agentFilter
  const kbUrl = agentFilter === 'all'
    ? '/api/knowledge-base'
    : agentFilter === 'unassigned'
      ? '/api/knowledge-base'
      : `/api/knowledge-base?agentId=${agentFilter}`

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-base', agentFilter],
    queryFn: () => fetch(kbUrl).then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: async (payload: { type: string; [k: string]: unknown } | FormData) => {
      if (payload instanceof FormData) {
        const res = await fetch('/api/knowledge-base', { method: 'POST', body: payload })
        if (res.status !== 201 && res.status !== 207) throw new Error((await res.json()).error || 'Failed')
        return res.json()
      }
      const res = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.status !== 201 && res.status !== 207) throw new Error((await res.json()).error || 'Failed')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] })
      setTextForm({ name: '', content: '', folderName: '' })
      setUrlForm({ name: '', url: '', folderName: '' })
      setFileName('')
      setFileFolderName('')
      setFileInput(null)
      setAssignAgentId('')
      setError(null)
    },
    onError: (err: Error) => setError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/knowledge-base/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-base'] }),
  })

  const syncMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/knowledge-base/${id}`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-base'] }),
  })

  const handleSubmit = () => {
    setError(null)
    const agentIdToAssign = assignAgentId || undefined
    if (activeTab === 'TEXT') {
      if (!textForm.name.trim() || !textForm.content.trim()) {
        setError('Name and content are required')
        return
      }
      createMutation.mutate({
        type: 'TEXT',
        name: textForm.name,
        content: textForm.content,
        folderName: textForm.folderName || undefined,
        agentId: agentIdToAssign,
      })
    } else if (activeTab === 'URL') {
      if (!urlForm.name.trim() || !urlForm.url.trim()) {
        setError('Name and URL are required')
        return
      }
      createMutation.mutate({
        type: 'URL',
        name: urlForm.name,
        url: urlForm.url,
        folderName: urlForm.folderName || undefined,
        agentId: agentIdToAssign,
      })
    } else if (activeTab === 'FILE') {
      if (!fileInput || !fileName.trim()) {
        setError('Name and file are required')
        return
      }
      const fd = new FormData()
      fd.append('name', fileName)
      fd.append('file', fileInput)
      if (fileFolderName.trim()) fd.append('folderName', fileFolderName.trim())
      if (agentIdToAssign) fd.append('agentId', agentIdToAssign)
      createMutation.mutate(fd)
    }
  }

  const allDocs: KBDoc[] = data?.documents || []

  // Client-side filter for 'unassigned'
  const docs: KBDoc[] = agentFilter === 'unassigned'
    ? allDocs.filter((doc) => !doc.agentId)
    : allDocs

  // Agent lookup map for badges
  const agentMap = new Map(agents.map((a) => [a.id, a.name]))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-sky-500/10 border border-sky-500/20">
            <BookOpen className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Knowledge Base</h1>
            <p className="text-xs text-muted-foreground">
              Documents agents can reference during calls
            </p>
          </div>
        </div>

        {/* Agent filter dropdown */}
        <div className="flex-shrink-0">
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="rounded-xl text-xs font-medium min-w-[150px]">
              <Bot className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="All Documents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Add Document Card */}
      <Card className="rounded-2xl p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">Add Document</p>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted">
          {(['TEXT', 'URL', 'FILE'] as const).map((tab) => {
            const Icon = TYPE_ICONS[tab]
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(null) }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  activeTab === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3 h-3" />
                {TYPE_LABELS[tab]}
              </button>
            )
          })}
        </div>

        {/* Form fields */}
        {activeTab === 'TEXT' && (
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Document name"
              value={textForm.name}
              onChange={(e) => setTextForm((p) => ({ ...p, name: e.target.value }))}
              className="rounded-xl"
            />
            <Input
              type="text"
              placeholder="Folder (optional)"
              value={textForm.folderName}
              onChange={(e) => setTextForm((p) => ({ ...p, folderName: e.target.value }))}
              className="rounded-xl"
            />
            <Textarea
              placeholder="Document content..."
              value={textForm.content}
              onChange={(e) => setTextForm((p) => ({ ...p, content: e.target.value }))}
              rows={5}
              className="rounded-xl resize-none"
            />
          </div>
        )}

        {activeTab === 'URL' && (
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Document name"
              value={urlForm.name}
              onChange={(e) => setUrlForm((p) => ({ ...p, name: e.target.value }))}
              className="rounded-xl"
            />
            <Input
              type="text"
              placeholder="Folder (optional)"
              value={urlForm.folderName}
              onChange={(e) => setUrlForm((p) => ({ ...p, folderName: e.target.value }))}
              className="rounded-xl"
            />
            <Input
              type="url"
              placeholder="https://example.com/document"
              value={urlForm.url}
              onChange={(e) => setUrlForm((p) => ({ ...p, url: e.target.value }))}
              className="rounded-xl"
            />
          </div>
        )}

        {activeTab === 'FILE' && (
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="Document name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="rounded-xl"
            />
            <Input
              type="text"
              placeholder="Folder (optional)"
              value={fileFolderName}
              onChange={(e) => setFileFolderName(e.target.value)}
              className="rounded-xl"
            />
            <div
              className="rounded-xl px-4 py-6 text-center cursor-pointer transition-all duration-150 bg-muted border-2 border-dashed border-border hover:border-muted-foreground/40"
              onClick={() => document.getElementById('kb-file-input')?.click()}
            >
              <FileText className="w-6 h-6 mx-auto mb-2 opacity-40 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {fileInput ? fileInput.name : 'Click to select a file'}
              </p>
              <input
                id="kb-file-input"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    setFileInput(f)
                    if (!fileName) setFileName(f.name.replace(/\.[^.]+$/, ''))
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Assign to Agent dropdown */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5 text-muted-foreground">
            Assign to Agent (optional)
          </label>
          <Select value={assignAgentId || '_none'} onValueChange={(v) => setAssignAgentId(v === '_none' ? '' : v)}>
            <SelectTrigger className="rounded-xl text-sm">
              <Bot className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="No agent — global document" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">No agent — global document</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="gap-2 rounded-xl"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          {createMutation.isPending ? 'Uploading...' : 'Add Document'}
        </Button>
      </Card>

      {/* Document List */}
      <Card className="rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">
            Documents ({docs.length})
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : docs.length === 0 ? (
          <div className="p-10 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-20 text-foreground" />
            <p className="text-sm text-muted-foreground">No documents yet.</p>
          </div>
        ) : (
          <div>
            {docs.map((doc, idx) => {
              const Icon = TYPE_ICONS[doc.type]
              const agentName = doc.agentId ? agentMap.get(doc.agentId) : null
              return (
                <div
                  key={doc.id}
                  className={`flex items-start gap-3 px-5 py-3.5 ${idx < docs.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-muted border border-border">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium truncate text-foreground">
                        {doc.name}
                      </p>
                      {doc.folderName && (
                        <Badge variant="secondary" className="bg-sky-500/10 text-sky-600 border-sky-500/20 text-[10px] font-medium">
                          {doc.folderName}
                        </Badge>
                      )}
                      {agentName && (
                        <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 border-violet-500/20 text-[10px] font-medium gap-1">
                          <Bot className="w-2.5 h-2.5" />
                          {agentName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs truncate text-muted-foreground">
                      {doc.type === 'URL' && doc.url}
                      {doc.type === 'FILE' && doc.fileName}
                      {doc.type === 'TEXT' && `${doc.content?.slice(0, 60)}...`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    <SyncBadge
                      doc={doc}
                      onRetry={() => syncMutation.mutate(doc.id)}
                      retrying={syncMutation.isPending && syncMutation.variables === doc.id}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                      className="w-7 h-7 rounded-lg bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/15 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
