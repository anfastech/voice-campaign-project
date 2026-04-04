'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Trash2, Plus, X, Settings, MessageSquare, BarChart3, Target, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

interface ConversationSidebarProps {
  callId: string
  contactId?: string | null
  agentId?: string | null
  contactName?: string | null
  status: string
  tags: string[]
  reasonEnded: string | null
  note: string | null
  metadata: any
}

export function ConversationSidebar({
  callId, contactId, agentId, contactName,
  status, tags: initialTags,
  reasonEnded, note: initialNote, metadata,
}: ConversationSidebarProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'transcript' | 'analytics'>('settings')
  const [newTag, setNewTag] = useState('')
  const [note, setNote] = useState(initialNote || '')
  const [tags, setTags] = useState(initialTags)
  const [leadConverted, setLeadConverted] = useState(false)
  const queryClient = useQueryClient()

  const convertToLeadMutation = useMutation({
    mutationFn: async () => {
      // Try client endpoint first, fall back to admin
      const endpoints = ['/api/client/leads', '/api/leads']
      for (const endpoint of endpoints) {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contactId,
            agentId,
            callId,
            notes: `Converted from conversation — call status: ${status}`,
          }),
        })
        if (res.ok) return res.json()
        if (res.status === 403) continue
        const err = await res.json()
        throw new Error(err.error || 'Failed to convert')
      }
      throw new Error('Failed to convert to lead')
    },
    onSuccess: () => {
      setLeadConverted(true)
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['client-leads'] })
    },
  })

  const tagMutation = useMutation({
    mutationFn: async (newTags: string[]) => {
      await fetch(`/api/calls/${callId}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  })

  const addTag = () => {
    const tag = newTag.trim()
    if (!tag || tags.includes(tag)) return
    const updated = [...tags, tag]
    setTags(updated)
    tagMutation.mutate(updated)
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    const updated = tags.filter((t) => t !== tag)
    setTags(updated)
    tagMutation.mutate(updated)
  }

  // Map status to human-readable end reason
  const endReason = reasonEnded || {
    COMPLETED: 'Call Completed',
    FAILED: 'Call Failed',
    NO_ANSWER: 'No Answer',
    BUSY: 'Line Busy',
    CANCELLED: 'Cancelled',
  }[status] || status.replace(/_/g, ' ')

  return (
    <div className="w-[300px] min-w-[300px] border-l border-border flex flex-col bg-background">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border">
        {[
          { id: 'settings' as const, icon: Settings },
          { id: 'transcript' as const, icon: MessageSquare },
          { id: 'analytics' as const, icon: BarChart3 },
        ].map(({ id, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setActiveTab(id)}
          >
            <Icon className="h-3.5 w-3.5" />
          </Button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search" className="pl-8 h-9 text-sm" />
        </div>

        <Separator />

        <div>
          <span className="text-sm font-medium text-foreground">Actions</span>
          <div className="flex flex-col gap-2 mt-2">
            {contactId && (
              leadConverted ? (
                <Button variant="outline" size="sm" className="justify-start gap-2 text-emerald-600 border-emerald-200" disabled>
                  <CheckCircle className="h-3.5 w-3.5" />
                  Converted to Lead
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2"
                  onClick={() => convertToLeadMutation.mutate()}
                  disabled={convertToLeadMutation.isPending}
                >
                  <Target className="h-3.5 w-3.5" />
                  {convertToLeadMutation.isPending ? 'Converting...' : 'Convert to Lead'}
                </Button>
              )
            )}
            <Button variant="ghost" size="sm" className="justify-start gap-2 text-muted-foreground">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>

        <Separator />

        <div>
          <span className="text-sm font-medium text-foreground">Tags</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:opacity-60">
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="Add tag..."
              className="h-8 text-xs"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={addTag} disabled={!newTag.trim()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Reason Call Ended</span>
          <Badge variant="outline" className="text-xs">
            {endReason}
          </Badge>
        </div>

        <Separator />

        <div>
          <span className="text-sm font-medium text-foreground">Note</span>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Leave a note..."
            className="mt-2 text-sm min-h-[80px]"
          />
        </div>
      </div>
    </div>
  )
}
