'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CsvImportDialog } from '@/components/contacts/CsvImportDialog'
import { ContactGroupSidebar } from '@/components/contacts/ContactGroupSidebar'
import { BulkActionsBar } from '@/components/contacts/BulkActionsBar'
import { AgentAssignDialog } from '@/components/contacts/AgentAssignDialog'
import {
  Plus, Upload, Search, Trash2, Users, Phone, Mail, Tag,
  ShieldOff, Shield, X, History, Download, Bot,
} from 'lucide-react'
import { formatDate, formatDuration, formatCurrency } from '@/lib/utils'

export default function ContactsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [csvOpen, setCsvOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any | null>(null)
  const [dncFilter, setDncFilter] = useState<'all' | 'active' | 'dnc'>('all')
  const [agentFilter, setAgentFilter] = useState('all')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [newContact, setNewContact] = useState({ phoneNumber: '', name: '', email: '', tags: '' })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [agentAssignOpen, setAgentAssignOpen] = useState(false)

  const searchParams = new URLSearchParams()
  if (search) searchParams.set('search', search)
  if (dncFilter === 'dnc') searchParams.set('doNotCall', 'true')
  if (dncFilter === 'active') searchParams.set('doNotCall', 'false')
  if (agentFilter && agentFilter !== 'all') searchParams.set('agentId', agentFilter)
  if (selectedGroupId && selectedGroupId !== 'shared') searchParams.set('groupId', selectedGroupId)
  if (selectedGroupId === 'shared') searchParams.set('agentId', 'shared')
  searchParams.set('limit', '500')

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts', search, dncFilter, agentFilter, selectedGroupId],
    queryFn: () => fetch(`/api/contacts?${searchParams.toString()}`).then((r) => r.json()),
  })
  const contacts = Array.isArray(contactsData?.contacts)
    ? contactsData.contacts
    : Array.isArray(contactsData) ? contactsData : []

  const { data: agentsRaw = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/agents').then((r) => r.json()),
  })
  const agents = Array.isArray(agentsRaw) ? agentsRaw : []

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/contacts/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tags: data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setAddOpen(false)
      setNewContact({ phoneNumber: '', name: '', email: '', tags: '' })
    },
  })

  const toggleDncMutation = useMutation({
    mutationFn: ({ id, doNotCall }: { id: string; doNotCall: boolean }) =>
      fetch(`/api/contacts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doNotCall }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  })

  const { data: contactCalls } = useQuery({
    queryKey: ['contact-calls', selectedContact?.id],
    queryFn: () => fetch(`/api/calls?contactId=${selectedContact?.id}&limit=20`).then((r) => r.json()),
    enabled: !!selectedContact?.id,
  })

  const exportCsv = useCallback(() => {
    const headers = ['Name', 'Phone', 'Email', 'Tags', 'DNC', 'Added']
    const rows = contacts.map((c: any) => [
      c.name || '', c.phoneNumber, c.email || '',
      (c.tags || []).join('; '), c.doNotCall ? 'Yes' : 'No',
      formatDate(c.createdAt),
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [contacts])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const allSelected = contacts.length > 0 && contacts.every((c: any) => selectedIds.includes(c.id))
  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : contacts.map((c: any) => c.id))
  }

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] })
    queryClient.invalidateQueries({ queryKey: ['contact-groups'] })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border">
          {(['all', 'active', 'dnc'] as const).map((f) => (
            <Button key={f} onClick={() => setDncFilter(f)}
              variant={dncFilter === f ? 'default' : 'ghost'}
              size="sm"
              className="px-3 py-1.5 rounded-lg text-xs font-medium">
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Do Not Call'}
            </Button>
          ))}
        </div>

        {/* Agent filter — shadcn Select */}
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            <SelectItem value="shared">Shared</SelectItem>
            {agents.map((a: any) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <Button onClick={exportCsv} disabled={contacts.length === 0} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button onClick={() => setCsvOpen(true)} variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" /> Import CSV
          </Button>
          <Button onClick={() => setAddOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Contact
          </Button>
        </div>
      </div>

      {/* Main layout: group sidebar + table */}
      <div className="rounded-xl overflow-hidden border border-border flex min-h-[400px]">
        <ContactGroupSidebar selectedGroupId={selectedGroupId} onSelect={(id) => { setSelectedGroupId(id); setSelectedIds([]) }} />

        {/* Contact table */}
        <div className="flex-1 overflow-auto bg-card">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg animate-pulse bg-muted" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center h-full">
              <Users className="w-10 h-10 text-muted-foreground/20 mb-4" />
              <h3 className="font-semibold mb-1 text-foreground">
                {search ? 'No contacts found' : 'No contacts yet'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {search ? `No results for "${search}"` : 'Import a CSV or add contacts manually.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-3 py-3 text-left w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Groups</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Agent</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden xl:table-cell">Added</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact: any) => {
                  const isSelected = selectedIds.includes(contact.id)
                  const groups = contact.groupMemberships?.map((m: any) => m.group) ?? []
                  const assignedAgents = contact.agentAssignments?.map((a: any) => a.agent) ?? []

                  return (
                    <tr
                      key={contact.id}
                      className={`group transition-colors cursor-pointer hover:bg-muted/50 border-b border-border last:border-0 ${isSelected ? 'bg-primary/5' : ''}`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(contact.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-primary-foreground bg-primary shrink-0">
                            {(contact.name || contact.phoneNumber || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-sm truncate text-foreground">
                            {contact.name || <span className="text-muted-foreground">Unnamed</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="w-3 h-3" /> {contact.phoneNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {groups.length === 0 ? (
                            <span className="text-muted-foreground text-xs">—</span>
                          ) : (
                            <>
                              {groups.slice(0, 2).map((g: any) => (
                                <Badge key={g.id} variant="secondary" className="text-xs">{g.name}</Badge>
                              ))}
                              {groups.length > 2 && (
                                <Badge variant="outline" className="text-xs">+{groups.length - 2}</Badge>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {assignedAgents.length === 0 ? (
                          <Badge variant="secondary" className="text-xs">Shared</Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assignedAgents.slice(0, 2).map((a: any) => (
                              <Badge key={a.id} variant="outline" className="text-xs gap-1">
                                <Bot className="w-3 h-3" /> {a.name}
                              </Badge>
                            ))}
                            {assignedAgents.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{assignedAgents.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {contact.doNotCall ? (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <ShieldOff className="w-3 h-3" /> DNC
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs gap-1">
                            <Shield className="w-3 h-3" /> Active
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {formatDate(contact.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => toggleDncMutation.mutate({ id: contact.id, doNotCall: !contact.doNotCall })}
                            className={`h-7 w-7 ${contact.doNotCall ? 'text-emerald-500' : 'text-amber-500'}`}
                            title={contact.doNotCall ? 'Remove from DNC' : 'Add to DNC'}>
                            {contact.doNotCall ? <Shield className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon"
                            onClick={() => { if (confirm('Delete this contact?')) deleteMutation.mutate(contact.id) }}
                            className="h-7 w-7 text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Count */}
      {!isLoading && contacts.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          {search && ` matching "${search}"`}
          {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
        </p>
      )}

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <BulkActionsBar
          selectedIds={selectedIds}
          onClear={() => setSelectedIds([])}
          onSuccess={invalidateAll}
        />
      )}

      {/* Contact Detail Sheet */}
      <Sheet open={!!selectedContact} onOpenChange={(open) => { if (!open) setSelectedContact(null) }}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-primary-foreground bg-primary">
                {(selectedContact?.name || selectedContact?.phoneNumber || '?')[0].toUpperCase()}
              </div>
              <div>
                <SheetTitle>{selectedContact?.name || 'Unnamed Contact'}</SheetTitle>
                <p className="text-xs text-muted-foreground">{selectedContact?.phoneNumber}</p>
              </div>
            </div>
          </SheetHeader>

          {selectedContact && (
            <div className="space-y-5 mt-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="shadow-none">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Phone</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">{selectedContact.phoneNumber}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-none">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Email</p>
                    </div>
                    <p className="text-sm font-medium text-foreground">{selectedContact.email || '—'}</p>
                  </CardContent>
                </Card>
              </div>

              {/* DNC Status */}
              <Card className={`shadow-none ${selectedContact.doNotCall ? 'border-destructive/30' : 'border-emerald-500/30'}`}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedContact.doNotCall
                      ? <ShieldOff className="w-4 h-4 text-destructive" />
                      : <Shield className="w-4 h-4 text-emerald-500" />}
                    <span className="text-sm font-medium text-foreground">
                      {selectedContact.doNotCall ? 'Do Not Call' : 'Active — Available for campaigns'}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs"
                    onClick={() => {
                      toggleDncMutation.mutate({ id: selectedContact.id, doNotCall: !selectedContact.doNotCall })
                      setSelectedContact({ ...selectedContact, doNotCall: !selectedContact.doNotCall })
                    }}>
                    {selectedContact.doNotCall ? 'Remove DNC' : 'Mark DNC'}
                  </Button>
                </CardContent>
              </Card>

              <Separator />

              {/* Groups */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Groups</p>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedContact.groupMemberships || []).length > 0
                    ? selectedContact.groupMemberships.map((m: any) => (
                      <Badge key={m.group.id} variant="secondary">{m.group.name}</Badge>
                    ))
                    : <p className="text-xs text-muted-foreground">No groups</p>}
                </div>
              </div>

              {/* Agent Assignments */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Assigned Agents</p>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedContact.agentAssignments || []).length > 0
                    ? selectedContact.agentAssignments.map((a: any) => (
                      <Badge key={a.agent.id} variant="outline">{a.agent.name}</Badge>
                    ))
                    : <Badge variant="secondary">Shared</Badge>}
                </div>
              </div>

              {/* Tags */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedContact.tags || []).length > 0
                    ? selectedContact.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))
                    : <p className="text-xs text-muted-foreground">No tags</p>}
                </div>
              </div>

              <Separator />

              {/* Call History */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Call History</p>
                {(contactCalls?.calls || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No calls yet</p>
                ) : (
                  <div className="space-y-2">
                    {(contactCalls?.calls || []).map((call: any) => (
                      <Card key={call.id} className="shadow-none">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-foreground">
                              {call.agent?.name || 'Unknown Agent'}
                            </span>
                            <Badge variant={call.status === 'COMPLETED' ? 'default' : 'destructive'} className="text-xs">
                              {call.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatDate(call.startedAt)}</span>
                            {call.duration && <span>{formatDuration(call.duration)}</span>}
                            {call.cost && <span>{formatCurrency(call.cost)}</span>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <CsvImportDialog open={csvOpen} onOpenChange={setCsvOpen} />

      <AgentAssignDialog
        open={agentAssignOpen}
        onOpenChange={setAgentAssignOpen}
        contactIds={selectedIds}
        onSuccess={invalidateAll}
      />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" value={newContact.phoneNumber}
                onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                placeholder="+1 (555) 123-4567" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="cname">Full Name</Label>
              <Input id="cname" value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="John Smith" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="john@example.com" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" value={newContact.tags}
                onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                placeholder="vip, lead, follow-up" className="mt-1.5" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(newContact)}
                disabled={!newContact.phoneNumber || createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Contact'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
