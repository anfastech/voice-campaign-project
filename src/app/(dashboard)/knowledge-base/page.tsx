'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Plus, Trash2, Link, FileText, Type, CheckCircle, XCircle, Clock, Loader2, AlertCircle, RefreshCw, Bot, ChevronDown } from 'lucide-react'

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
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: 'oklch(0.55 0.215 163 / 10%)', color: 'oklch(0.45 0.215 163)' }}
      >
        <CheckCircle className="w-2.5 h-2.5" />
        Synced
      </span>
    )
  }

  if (status === 'FAILED') {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-default"
            style={{ background: 'oklch(0.59 0.245 15 / 10%)', color: 'oklch(0.52 0.245 15)' }}
          >
            <XCircle className="w-2.5 h-2.5" />
            Sync Failed
          </span>
          {doc.type !== 'FILE' && (
            <button
              onClick={onRetry}
              disabled={retrying}
              title="Retry sync"
              className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 disabled:opacity-50"
              style={{ background: 'oklch(0.6 0.19 220 / 10%)', border: '1px solid oklch(0.6 0.19 220 / 25%)', color: 'oklch(0.6 0.19 220)' }}
            >
              {retrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            </button>
          )}
        </div>
        <p className="text-xs max-w-[220px] text-right leading-tight break-words" style={{ color: 'oklch(0.52 0.245 15)' }}>
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
      <span
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
      >
        <Clock className="w-2.5 h-2.5" />
        Pending
      </span>
      {doc.type !== 'FILE' && (
        <button
          onClick={onRetry}
          disabled={retrying}
          title="Retry sync"
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105 disabled:opacity-50"
          style={{ background: 'oklch(0.6 0.19 220 / 10%)', border: '1px solid oklch(0.6 0.19 220 / 25%)', color: 'oklch(0.6 0.19 220)' }}
        >
          {retrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        </button>
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
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'oklch(0.6 0.19 220 / 12%)', border: '1px solid oklch(0.6 0.19 220 / 20%)' }}
          >
            <BookOpen className="w-4 h-4" style={{ color: 'oklch(0.6 0.19 220)' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Knowledge Base</h1>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Documents agents can reference during calls
            </p>
          </div>
        </div>

        {/* Agent filter dropdown */}
        <div className="relative flex-shrink-0">
          <div className="relative">
            <Bot
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--muted-foreground)' }}
            />
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-xl text-xs font-medium outline-none appearance-none cursor-pointer"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <option value="all">All Documents</option>
              <option value="unassigned">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--muted-foreground)' }}
            />
          </div>
        </div>
      </div>

      {/* Add Document Card */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Add Document</p>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--muted)' }}>
          {(['TEXT', 'URL', 'FILE'] as const).map((tab) => {
            const Icon = TYPE_ICONS[tab]
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setError(null) }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                style={{
                  background: activeTab === tab ? 'var(--card)' : 'transparent',
                  color: activeTab === tab ? 'var(--foreground)' : 'var(--muted-foreground)',
                  boxShadow: activeTab === tab ? '0 1px 3px oklch(0 0 0 / 10%)' : 'none',
                }}
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
            <input
              type="text"
              placeholder="Document name"
              value={textForm.name}
              onChange={(e) => setTextForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
            <input
              type="text"
              placeholder="Folder (optional)"
              value={textForm.folderName}
              onChange={(e) => setTextForm((p) => ({ ...p, folderName: e.target.value }))}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
            <textarea
              placeholder="Document content..."
              value={textForm.content}
              onChange={(e) => setTextForm((p) => ({ ...p, content: e.target.value }))}
              rows={5}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none resize-none"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
        )}

        {activeTab === 'URL' && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Document name"
              value={urlForm.name}
              onChange={(e) => setUrlForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
            <input
              type="text"
              placeholder="Folder (optional)"
              value={urlForm.folderName}
              onChange={(e) => setUrlForm((p) => ({ ...p, folderName: e.target.value }))}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
            <input
              type="url"
              placeholder="https://example.com/document"
              value={urlForm.url}
              onChange={(e) => setUrlForm((p) => ({ ...p, url: e.target.value }))}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
        )}

        {activeTab === 'FILE' && (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Document name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
            <input
              type="text"
              placeholder="Folder (optional)"
              value={fileFolderName}
              onChange={(e) => setFileFolderName(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
            <div
              className="rounded-xl px-4 py-6 text-center cursor-pointer transition-all duration-150"
              style={{ background: 'var(--muted)', border: '2px dashed var(--border)' }}
              onClick={() => document.getElementById('kb-file-input')?.click()}
            >
              <FileText className="w-6 h-6 mx-auto mb-2 opacity-40" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
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
          <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
            Assign to Agent (optional)
          </label>
          <div className="relative">
            <Bot
              className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--muted-foreground)' }}
            />
            <select
              value={assignAgentId}
              onChange={(e) => setAssignAgentId(e.target.value)}
              className="w-full pl-8 pr-8 py-2 rounded-xl text-sm outline-none appearance-none cursor-pointer"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: assignAgentId ? 'var(--foreground)' : 'var(--muted-foreground)' }}
            >
              <option value="">No agent — global document</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
            <ChevronDown
              className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--muted-foreground)' }}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'oklch(0.52 0.245 15)' }}>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, oklch(0.6 0.19 220), oklch(0.49 0.263 281))',
            boxShadow: '0 4px 14px oklch(0.6 0.19 220 / 30%)',
          }}
        >
          {createMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          {createMutation.isPending ? 'Uploading...' : 'Add Document'}
        </button>
      </div>

      {/* Document List */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Documents ({docs.length})
          </p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: 'var(--muted-foreground)' }} />
          </div>
        ) : docs.length === 0 ? (
          <div className="p-10 text-center" style={{ background: 'var(--card)' }}>
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: 'var(--foreground)' }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No documents yet.</p>
          </div>
        ) : (
          <div style={{ background: 'var(--card)' }}>
            {docs.map((doc, idx) => {
              const Icon = TYPE_ICONS[doc.type]
              const agentName = doc.agentId ? agentMap.get(doc.agentId) : null
              return (
                <div
                  key={doc.id}
                  className="flex items-start gap-3 px-5 py-3.5"
                  style={{ borderBottom: idx < docs.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                        {doc.name}
                      </p>
                      {doc.folderName && (
                        <span
                          className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md flex-shrink-0"
                          style={{ background: 'oklch(0.6 0.19 220 / 10%)', color: 'oklch(0.6 0.19 220)', border: '1px solid oklch(0.6 0.19 220 / 20%)' }}
                        >
                          {doc.folderName}
                        </span>
                      )}
                      {agentName && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md flex-shrink-0"
                          style={{ background: 'oklch(0.49 0.263 281 / 10%)', color: 'oklch(0.49 0.263 281)', border: '1px solid oklch(0.49 0.263 281 / 20%)' }}
                        >
                          <Bot className="w-2.5 h-2.5" />
                          {agentName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
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
                    <button
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 hover:scale-105"
                      style={{
                        background: 'oklch(0.59 0.245 15 / 8%)',
                        border: '1px solid oklch(0.59 0.245 15 / 20%)',
                        color: 'oklch(0.59 0.245 15)',
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
