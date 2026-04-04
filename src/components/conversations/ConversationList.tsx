'use client'

import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Conversation {
  id: string
  contactId: string | null
  contactName: string | null
  phoneNumber: string
  agentId: string | null
  conversationId: string
  date: string
  status: string
  duration: number | null
  agentName: string
  transcript: string | null
  summary: string | null
  recordingAvailable: boolean
  tags: string[]
  errorMessage: string | null
  metadata: any
}

interface ConversationListProps {
  conversations: Conversation[]
  selected: string | null
  onSelect: (id: string) => void
  onRefresh: () => void
  filters: { status: string; period: string }
  onFiltersChange: (f: Partial<ConversationListProps['filters']>) => void
  total: number
  isLoading: boolean
}

export type { Conversation }

export function ConversationList({
  conversations, selected, onSelect, onRefresh,
  filters, onFiltersChange, total, isLoading,
}: ConversationListProps) {
  return (
    <div className="w-[320px] min-w-[320px] border-r border-border flex flex-col bg-background">
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center gap-2">
          <Select value={filters.status} onValueChange={(v) => onFiltersChange({ status: v })}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="All Calls" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Calls</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="NO_ANSWER">No Answer</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.period} onValueChange={(v) => onFiltersChange({ period: v })}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{total} conversations</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRefresh}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg animate-pulse bg-muted" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No conversations found
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                'w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors',
                selected === conv.id && 'bg-muted'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {conv.contactName || 'New User'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{conv.phoneNumber}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-mono">
                    ID: {conv.conversationId?.slice(0, 24)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(conv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(conv.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
