'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Pencil, Trash2, FolderOpen } from 'lucide-react'
import { GroupManageDialog } from './GroupManageDialog'

interface Group {
  id: string
  name: string
  description?: string | null
  _count: { members: number }
}

interface Props {
  selectedGroupId: string | null
  onSelect: (groupId: string | null) => void
}

export function ContactGroupSidebar({ selectedGroupId, onSelect }: Props) {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['contact-groups'],
    queryFn: () => fetch('/api/contact-groups').then((r) => r.json()),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/contact-groups/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-groups'] })
      if (groups.find((g) => g.id === selectedGroupId)) onSelect(null)
    },
  })

  const navItems = [
    { id: null, label: 'All Contacts', icon: Users },
    { id: 'shared', label: 'Shared', icon: FolderOpen },
  ]

  return (
    <>
      <aside
        style={{
          width: '220px',
          minWidth: '220px',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          padding: '0.5rem',
          background: 'var(--card)',
          borderRadius: '1rem 0 0 1rem',
        }}
      >
        {/* Static items */}
        {navItems.map((item) => {
          const Icon = item.icon
          const active = selectedGroupId === item.id
          return (
            <button
              key={String(item.id)}
              onClick={() => onSelect(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.625rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                textAlign: 'left',
                width: '100%',
                transition: 'background 0.12s',
                background: active
                  ? 'linear-gradient(135deg, oklch(0.49 0.263 281 / 15%), oklch(0.65 0.22 310 / 15%))'
                  : 'transparent',
                color: active ? 'oklch(0.49 0.263 281)' : 'var(--muted-foreground)',
              }}
            >
              <Icon style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0 }} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
            </button>
          )
        })}

        {/* Divider + Groups header */}
        <div
          style={{
            margin: '0.375rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0 0.75rem',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--muted-foreground)',
              whiteSpace: 'nowrap',
            }}
          >
            Groups
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Group list */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {groups.map((group) => {
            const active = selectedGroupId === group.id
            return (
              <div
                key={group.id}
                className="group"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  borderRadius: '0.625rem',
                  background: active
                    ? 'linear-gradient(135deg, oklch(0.49 0.263 281 / 15%), oklch(0.65 0.22 310 / 15%))'
                    : 'transparent',
                  transition: 'background 0.12s',
                }}
              >
                <button
                  onClick={() => onSelect(group.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    flex: 1,
                    padding: '0.4375rem 0.75rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minWidth: 0,
                  }}
                >
                  <FolderOpen
                    style={{
                      width: '0.875rem',
                      height: '0.875rem',
                      flexShrink: 0,
                      color: active ? 'oklch(0.49 0.263 281)' : 'var(--muted-foreground)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: active ? 'oklch(0.49 0.263 281)' : 'var(--foreground)',
                    }}
                  >
                    {group.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      color: 'var(--muted-foreground)',
                      background: 'var(--muted)',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '9999px',
                    }}
                  >
                    {group._count.members}
                  </span>
                </button>
                <div
                  className="opacity-0 group-hover:opacity-100"
                  style={{ display: 'flex', gap: '1px', paddingRight: '0.25rem', transition: 'opacity 0.15s' }}
                >
                  <button
                    onClick={() => { setEditingGroup(group); setDialogOpen(true) }}
                    style={{
                      padding: '0.25rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--muted-foreground)',
                    }}
                    title="Rename"
                  >
                    <Pencil style={{ width: '0.75rem', height: '0.75rem' }} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete group "${group.name}"?`)) deleteMutation.mutate(group.id)
                    }}
                    style={{
                      padding: '0.25rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'oklch(0.59 0.245 15)',
                    }}
                    title="Delete"
                  >
                    <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Create group button */}
        <button
          onClick={() => { setEditingGroup(null); setDialogOpen(true) }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.625rem',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
            border: '1px dashed var(--border)',
            background: 'transparent',
            color: 'var(--muted-foreground)',
            marginTop: '0.25rem',
            width: '100%',
            transition: 'all 0.12s',
          }}
        >
          <Plus style={{ width: '0.875rem', height: '0.875rem' }} />
          New Group
        </button>
      </aside>

      <GroupManageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        group={editingGroup}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['contact-groups'] })
          setEditingGroup(null)
        }}
      />
    </>
  )
}
