'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { FolderPlus, Bot, ShieldOff, Trash2, X, Check } from 'lucide-react'

interface Group {
  id: string
  name: string
}

interface Props {
  selectedIds: string[]
  onClear: () => void
  onSuccess: () => void
}

export function BulkActionsBar({ selectedIds, onClear, onSuccess }: Props) {
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false)
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false)

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['contact-groups'],
    queryFn: () => fetch('/api/contact-groups').then((r) => r.json()),
    enabled: groupDropdownOpen,
  })

  const { data: agentsRaw = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/agents').then((r) => r.json()),
    enabled: agentDropdownOpen,
  })
  const agents = Array.isArray(agentsRaw) ? agentsRaw : []

  const bulkMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, contactIds: selectedIds }),
      }).then((r) => r.json()),
    onSuccess: () => {
      setGroupDropdownOpen(false)
      setAgentDropdownOpen(false)
      onSuccess()
      onClear()
    },
  })

  const isPending = bulkMutation.isPending

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        borderRadius: '1rem',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <span
        className="text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))', color: 'white' }}
      >
        {selectedIds.length} selected
      </span>

      {/* Add to Group */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setGroupDropdownOpen((o) => !o); setAgentDropdownOpen(false) }}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          <FolderPlus style={{ width: '0.875rem', height: '0.875rem' }} />
          Add to Group
        </button>
        {groupDropdownOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 0.5rem)',
              left: 0,
              minWidth: '180px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              zIndex: 70,
            }}
          >
            {groups.length === 0 ? (
              <p className="text-xs p-3" style={{ color: 'var(--muted-foreground)' }}>No groups yet</p>
            ) : (
              groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => bulkMutation.mutate({ action: 'addToGroup', groupId: group.id })}
                  className="w-full text-left px-3 py-2 text-xs font-medium transition-colors"
                  style={{ color: 'var(--foreground)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--muted)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  {group.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Assign Agent */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setAgentDropdownOpen((o) => !o); setGroupDropdownOpen(false) }}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          <Bot style={{ width: '0.875rem', height: '0.875rem' }} />
          Assign Agent
        </button>
        {agentDropdownOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 0.5rem)',
              left: 0,
              minWidth: '180px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              zIndex: 70,
            }}
          >
            {agents.length === 0 ? (
              <p className="text-xs p-3" style={{ color: 'var(--muted-foreground)' }}>No agents</p>
            ) : (
              agents.map((agent: any) => (
                <button
                  key={agent.id}
                  onClick={() => bulkMutation.mutate({ action: 'assignAgent', agentId: agent.id })}
                  className="w-full text-left px-3 py-2 text-xs font-medium transition-colors"
                  style={{ color: 'var(--foreground)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--muted)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  {agent.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Mark DNC */}
      <button
        onClick={() => bulkMutation.mutate({ action: 'markDnc' })}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
        style={{ background: 'oklch(0.59 0.245 15 / 10%)', border: '1px solid oklch(0.59 0.245 15 / 20%)', color: 'oklch(0.59 0.245 15)' }}
      >
        <ShieldOff style={{ width: '0.875rem', height: '0.875rem' }} />
        Mark DNC
      </button>

      {/* Delete */}
      <button
        onClick={() => {
          if (confirm(`Delete ${selectedIds.length} contact${selectedIds.length !== 1 ? 's' : ''}?`)) {
            bulkMutation.mutate({ action: 'delete' })
          }
        }}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
        style={{ background: 'oklch(0.59 0.245 15 / 10%)', border: '1px solid oklch(0.59 0.245 15 / 20%)', color: 'oklch(0.59 0.245 15)' }}
      >
        <Trash2 style={{ width: '0.875rem', height: '0.875rem' }} />
        Delete
      </button>

      <div style={{ width: '1px', height: '1.5rem', background: 'var(--border)', margin: '0 0.25rem' }} />

      <button
        onClick={onClear}
        className="p-1.5 rounded-lg transition-all hover:scale-105"
        style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
        title="Clear selection"
      >
        <X style={{ width: '0.875rem', height: '0.875rem' }} />
      </button>
    </div>
  )
}
