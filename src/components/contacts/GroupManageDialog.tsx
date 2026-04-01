'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface Group {
  id: string
  name: string
  description?: string | null
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group | null
  onSuccess: () => void
}

export function GroupManageDialog({ open, onOpenChange, group, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      setName(group?.name ?? '')
      setDescription(group?.description ?? '')
    }
  }, [open, group])

  const saveMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => {
      if (group) {
        return fetch(`/api/contact-groups/${group.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then((r) => r.json())
      }
      return fetch('/api/contact-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json())
    },
    onSuccess: () => {
      onSuccess()
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{group ? 'Rename Group' : 'New Group'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="group-name" className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--muted-foreground)' }}>
              Group Name *
            </Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VIP Leads"
              className="mt-1.5"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="group-desc" className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--muted-foreground)' }}>
              Description
            </Label>
            <Input
              id="group-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="mt-1.5"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => saveMutation.mutate({ name, description })}
              disabled={!name.trim() || saveMutation.isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
              }}
            >
              {saveMutation.isPending ? 'Saving...' : group ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
