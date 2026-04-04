'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Pencil, Trash2, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
      <aside className="w-[220px] min-w-[220px] border-r bg-card rounded-l-xl flex flex-col gap-0.5 p-2">
        {/* Static items */}
        {navItems.map((item) => {
          const Icon = item.icon
          const active = selectedGroupId === item.id
          return (
            <button
              key={String(item.id)}
              onClick={() => onSelect(item.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer border-none text-left w-full transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-transparent text-muted-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
            </button>
          )
        })}

        {/* Divider + Groups header */}
        <div className="flex items-center gap-2 px-3 my-1.5">
          <Separator className="flex-1" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
            Groups
          </span>
          <Separator className="flex-1" />
        </div>

        {/* Group list */}
        <div className="flex-1 overflow-auto flex flex-col gap-px">
          {groups.map((group) => {
            const active = selectedGroupId === group.id
            return (
              <div
                key={group.id}
                className={cn(
                  'group flex items-center gap-1 rounded-lg transition-colors',
                  active ? 'bg-accent' : 'bg-transparent'
                )}
              >
                <button
                  onClick={() => onSelect(group.id)}
                  className="flex items-center gap-2 flex-1 py-1.5 px-3 border-none bg-transparent cursor-pointer text-left min-w-0"
                >
                  <FolderOpen className={cn('w-3.5 h-3.5 shrink-0', active ? 'text-accent-foreground' : 'text-muted-foreground')} />
                  <span className={cn('text-sm font-medium flex-1 truncate', active ? 'text-accent-foreground' : 'text-foreground')}>
                    {group.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {group._count.members}
                  </Badge>
                </button>
                <div className="opacity-0 group-hover:opacity-100 flex gap-px pr-1 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => { setEditingGroup(group); setDialogOpen(true) }}
                    title="Rename"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => { if (confirm(`Delete group "${group.name}"?`)) deleteMutation.mutate(group.id) }}
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Create group button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-1 border-dashed text-muted-foreground"
          onClick={() => { setEditingGroup(null); setDialogOpen(true) }}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Group
        </Button>
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
