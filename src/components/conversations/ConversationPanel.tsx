'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ConversationList } from './ConversationList'
import type { Conversation } from './ConversationList'
import { ChatTranscript, parseTranscript } from './ChatTranscript'
import { AudioPlayer } from './AudioPlayer'
import { ConversationSidebar } from './ConversationSidebar'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface ConversationPanelProps {
  apiBasePath: string // '/api/calls' for admin, '/api/client/conversations' for client
}

export function ConversationPanel({ apiBasePath }: ConversationPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filters, setFilters] = useState({ status: 'ALL', period: '7d' })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['conversations', filters, apiBasePath],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status !== 'ALL') params.set('status', filters.status)
      params.set('limit', '50')
      const res = await fetch(`${apiBasePath}?${params}`)
      return res.json()
    },
    refetchInterval: 30000,
  })

  const conversations: Conversation[] = useMemo(() => {
    const calls = data?.calls || (Array.isArray(data) ? data : [])
    return calls.map((c: any) => ({
      id: c.id,
      contactName: c.contact?.name || null,
      phoneNumber: c.phoneNumber,
      conversationId: c.providerCallId || c.elevenLabsCallId || c.id,
      date: c.startedAt || c.createdAt,
      status: c.status,
      duration: c.duration,
      agentName: c.agent?.name || 'Agent',
      transcript: c.transcript,
      summary: c.summary,
      recordingAvailable: c.recordingAvailable || false,
      tags: c.metadata?.tags || [],
      errorMessage: c.errorMessage,
      metadata: c.metadata,
    }))
  }, [data])

  const selected = conversations.find((c) => c.id === selectedId) || null
  const messages = selected ? parseTranscript(selected.transcript) : []

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6">
      {/* Left: conversation list */}
      <ConversationList
        conversations={conversations}
        selected={selectedId}
        onSelect={setSelectedId}
        onRefresh={() => refetch()}
        filters={filters}
        onFiltersChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
        total={data?.total || conversations.length}
        isLoading={isLoading}
      />

      {/* Center: chat transcript + audio */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected && (
          <div className="px-4 py-2 border-b border-border flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {selected.contactName || 'New User'} — {selected.agentName}
            </p>
            <Button variant="outline" size="sm" className="text-xs">
              <Download className="h-3 w-3 mr-1.5" /> Export
            </Button>
          </div>
        )}

        <ChatTranscript
          messages={messages}
          contactName={selected?.contactName || null}
          agentName={selected?.agentName || 'Agent'}
          isEmpty={!selected}
        />

        {selected?.recordingAvailable && (
          <AudioPlayer
            src={`/api/calls/${selected.id}/recording`}
            duration={selected.duration}
          />
        )}
      </div>

      {/* Right: metadata sidebar */}
      {selected && (
        <ConversationSidebar
          callId={selected.id}
          status={selected.status}
          tags={selected.tags}
          reasonEnded={selected.metadata?.termination_reason || null}
          note={selected.metadata?.note || null}
          metadata={selected.metadata}
        />
      )}
    </div>
  )
}
