'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Bot, CheckCircle } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactIds: string[]
  onSuccess: () => void
}

export function AgentAssignDialog({ open, onOpenChange, contactIds, onSuccess }: Props) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  const { data: agentsRaw = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/agents').then((r) => r.json()),
    enabled: open,
  })
  const agents = Array.isArray(agentsRaw) ? agentsRaw : []

  const assignMutation = useMutation({
    mutationFn: () =>
      fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assignAgent', contactIds, agentId: selectedAgentId }),
      }).then((r) => r.json()),
    onSuccess: () => {
      setSelectedAgentId(null)
      onOpenChange(false)
      onSuccess()
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Agent</DialogTitle>
        </DialogHeader>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Assign {contactIds.length} contact{contactIds.length !== 1 ? 's' : ''} to an agent
        </p>
        <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
          {agents.map((agent: any) => {
            const selected = selectedAgentId === agent.id
            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className="w-full text-left p-3 rounded-xl transition-all flex items-center gap-3"
                style={{
                  background: selected ? 'oklch(0.49 0.263 281 / 8%)' : 'var(--muted)',
                  border: selected ? '1px solid oklch(0.49 0.263 281 / 40%)' : '1px solid var(--border)',
                }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: selected ? 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))' : 'oklch(0.49 0.263 281 / 10%)',
                    color: selected ? 'white' : 'oklch(0.49 0.263 281)',
                  }}>
                  <Bot style={{ width: '0.875rem', height: '0.875rem' }} />
                </div>
                <span className="text-sm font-medium flex-1 truncate" style={{ color: 'var(--foreground)' }}>
                  {agent.name}
                </span>
                {selected && <CheckCircle style={{ width: '0.875rem', height: '0.875rem', color: 'oklch(0.49 0.263 281)', flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => assignMutation.mutate()}
            disabled={!selectedAgentId || assignMutation.isPending}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
              boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
            }}
          >
            {assignMutation.isPending ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
