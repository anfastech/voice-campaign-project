'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Link as LinkIcon,
  FileText,
  HelpCircle,
  BookOpen,
  ExternalLink,
  Globe,
  Mail,
  Calendar,
  Clipboard,
  Star,
  Heart,
  Zap,
  Shield,
  Bell,
  Plus,
  Pencil,
  Trash2,
  Menu,
  GripVertical,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICON_OPTIONS = [
  { name: 'Link', icon: LinkIcon },
  { name: 'FileText', icon: FileText },
  { name: 'HelpCircle', icon: HelpCircle },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'ExternalLink', icon: ExternalLink },
  { name: 'Globe', icon: Globe },
  { name: 'Mail', icon: Mail },
  { name: 'Calendar', icon: Calendar },
  { name: 'Clipboard', icon: Clipboard },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'Zap', icon: Zap },
  { name: 'Shield', icon: Shield },
  { name: 'Bell', icon: Bell },
]

const iconMap: Record<string, React.ElementType> = Object.fromEntries(
  ICON_OPTIONS.map(({ name, icon }) => [name, icon])
)

function IconComponent({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? LinkIcon
  return <Icon className={className} />
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string
  label: string
  url: string
  icon: string
  position: number
  isActive: boolean
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyForm = {
  label: '',
  url: '',
  icon: 'Link',
  position: 0,
}

// ─── Inline Form ─────────────────────────────────────────────────────────────

function MenuItemForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial: typeof emptyForm
  onSave: (data: typeof emptyForm) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [form, setForm] = useState(initial)

  const valid = form.label.trim() !== '' && form.url.trim() !== ''

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mi-label">Label</Label>
          <Input
            id="mi-label"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Documentation"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mi-url">URL</Label>
          <Input
            id="mi-url"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mi-icon">Icon</Label>
          <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
            <SelectTrigger id="mi-icon">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ICON_OPTIONS.map(({ name, icon: Icon }) => (
                <SelectItem key={name} value={name}>
                  <span className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mi-position">Position</Label>
          <Input
            id="mi-position"
            type="number"
            min={0}
            value={form.position}
            onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
          <X className="w-3.5 h-3.5 mr-1.5" />
          Cancel
        </Button>
        <Button size="sm" onClick={() => onSave(form)} disabled={!valid || isSaving}>
          <Check className="w-3.5 h-3.5 mr-1.5" />
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const queryClient = useQueryClient()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // ── Fetch ──
  const { data: items, isLoading } = useQuery<MenuItem[]>({
    queryKey: ['menu'],
    queryFn: () => fetch('/api/menu').then((r) => r.json()),
  })

  // ── Create ──
  const createMutation = useMutation({
    mutationFn: (data: typeof emptyForm) =>
      fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      setShowAddForm(false)
    },
  })

  // ── Update ──
  const updateMutation = useMutation({
    mutationFn: (data: Partial<MenuItem> & { id: string }) =>
      fetch('/api/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] })
      setEditingId(null)
    },
  })

  // ── Delete ──
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch('/api/menu', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu'] }),
  })

  const safeItems = Array.isArray(items) ? items : []
  const sortedItems = safeItems.slice().sort((a, b) => a.position - b.position)

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-6 w-40 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-72 rounded-md bg-muted animate-pulse" />
          </div>
          <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Custom Menu</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Add custom navigation items to your clients&apos; sidebar
          </p>
        </div>
        {!showAddForm && (
          <Button onClick={() => { setShowAddForm(true); setEditingId(null) }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </Button>
        )}
      </div>

      {/* ── Add form (inline card) ── */}
      {showAddForm && (
        <Card className="shadow-none border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Menu Item</CardTitle>
            <CardDescription>Fill in the details for the new navigation item</CardDescription>
          </CardHeader>
          <CardContent>
            <MenuItemForm
              initial={emptyForm}
              onSave={(data) => createMutation.mutate(data)}
              onCancel={() => setShowAddForm(false)}
              isSaving={createMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* ── List ── */}
      {sortedItems.length === 0 && !showAddForm ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-14">
            <Menu className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No custom menu items yet</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedItems.map((item) => (
            <Card key={item.id} className="shadow-none">
              {editingId === item.id ? (
                /* ── Inline edit form ── */
                <CardContent className="pt-5 pb-4">
                  <MenuItemForm
                    initial={{
                      label: item.label,
                      url: item.url,
                      icon: item.icon,
                      position: item.position,
                    }}
                    onSave={(data) => updateMutation.mutate({ id: item.id, ...data })}
                    onCancel={() => setEditingId(null)}
                    isSaving={updateMutation.isPending}
                  />
                </CardContent>
              ) : (
                /* ── Display row ── */
                <CardContent className="flex items-center gap-3 py-3.5">
                  {/* drag handle visual */}
                  <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />

                  {/* icon */}
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <IconComponent name={item.icon} className="w-4 h-4 text-muted-foreground" />
                  </div>

                  {/* info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                  </div>

                  {/* position badge */}
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    #{item.position}
                  </span>

                  {/* status badge */}
                  <Badge
                    variant={item.isActive ? 'default' : 'secondary'}
                    className="text-xs cursor-pointer shrink-0"
                    onClick={() =>
                      updateMutation.mutate({ id: item.id, isActive: !item.isActive })
                    }
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </Badge>

                  <Separator orientation="vertical" className="h-5 shrink-0" />

                  {/* actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { setEditingId(item.id); setShowAddForm(false) }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete "${item.label}"?`)) deleteMutation.mutate(item.id)
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
