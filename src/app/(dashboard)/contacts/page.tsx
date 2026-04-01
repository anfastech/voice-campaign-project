'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
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
  const [agentFilter, setAgentFilter] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [newContact, setNewContact] = useState({ phoneNumber: '', name: '', email: '', tags: '' })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [agentAssignOpen, setAgentAssignOpen] = useState(false)

  const searchParams = new URLSearchParams()
  if (search) searchParams.set('search', search)
  if (dncFilter === 'dnc') searchParams.set('doNotCall', 'true')
  if (dncFilter === 'active') searchParams.set('doNotCall', 'false')
  if (agentFilter) searchParams.set('agentId', agentFilter)
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          <input
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border outline-none"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
          {(['all', 'active', 'dnc'] as const).map((f) => (
            <button key={f} onClick={() => setDncFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={dncFilter === f ? {
                background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                color: 'white',
              } : { color: 'var(--muted-foreground)' }}>
              {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Do Not Call'}
            </button>
          ))}
        </div>

        {/* Agent filter */}
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl bg-transparent outline-none"
          style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          <option value="">All Agents</option>
          <option value="shared">Shared</option>
          {agents.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={exportCsv} disabled={contacts.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105 disabled:opacity-40"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => setCsvOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
              boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
            }}>
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      </div>

      {/* Main layout: group sidebar + table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', display: 'flex', minHeight: '400px' }}
      >
        <ContactGroupSidebar selectedGroupId={selectedGroupId} onSelect={(id) => { setSelectedGroupId(id); setSelectedIds([]) }} />

        {/* Contact table */}
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--card)' }}>
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl relative overflow-hidden"
                  style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                  <div className="absolute inset-0 shimmer" />
                </div>
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center h-full">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, oklch(0.49 0.263 281 / 15%), oklch(0.65 0.22 310 / 15%))', border: '1px solid oklch(0.49 0.263 281 / 20%)' }}>
                <Users className="w-7 h-7" style={{ color: 'oklch(0.49 0.263 281)' }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                {search ? 'No contacts found' : 'No contacts yet'}
              </h3>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {search ? `No results for "${search}"` : 'Import a CSV or add contacts manually.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      style={{ accentColor: 'oklch(0.49 0.263 281)', width: '14px', height: '14px', cursor: 'pointer' }}
                    />
                  </th>
                  {['Contact', 'Phone', 'Groups', 'Agent', 'Status', 'Added', ''].map((h, i) => (
                    <th key={i}
                      className={`text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest ${i === 1 ? 'hidden md:table-cell' : ''} ${i === 2 || i === 3 ? 'hidden lg:table-cell' : ''} ${i === 4 ? 'hidden lg:table-cell' : ''} ${i === 5 ? 'hidden xl:table-cell' : ''}`}
                      style={{ color: 'var(--muted-foreground)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact: any, idx: number) => {
                  const isSelected = selectedIds.includes(contact.id)
                  const groups = contact.groupMemberships?.map((m: any) => m.group) ?? []
                  const assignedAgents = contact.agentAssignments?.map((a: any) => a.agent) ?? []

                  return (
                    <tr
                      key={contact.id}
                      className="group transition-colors cursor-pointer"
                      style={{
                        borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                        background: isSelected ? 'oklch(0.49 0.263 281 / 4%)' : 'transparent',
                      }}
                      onClick={() => setSelectedContact(contact)}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--muted)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? 'oklch(0.49 0.263 281 / 4%)' : 'transparent' }}
                    >
                      <td className="px-3 py-3" onClick={(e) => { e.stopPropagation(); toggleSelect(contact.id) }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(contact.id)}
                          style={{ accentColor: 'oklch(0.49 0.263 281)', width: '14px', height: '14px', cursor: 'pointer' }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))' }}>
                            {(contact.name || contact.phoneNumber || '?')[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>
                            {contact.name || <span style={{ color: 'var(--muted-foreground)' }}>Unnamed</span>}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          <Phone className="w-3 h-3 flex-shrink-0" /> {contact.phoneNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {groups.length === 0 ? (
                            <span style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem' }}>—</span>
                          ) : (
                            <>
                              {groups.slice(0, 2).map((g: any) => (
                                <span key={g.id} className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                                  style={{ background: 'oklch(0.49 0.263 281 / 8%)', color: 'oklch(0.49 0.263 281)' }}>
                                  {g.name}
                                </span>
                              ))}
                              {groups.length > 2 && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                                  +{groups.length - 2}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {assignedAgents.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'oklch(0.55 0.215 163 / 12%)', color: 'oklch(0.45 0.215 163)' }}>
                            Shared
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {assignedAgents.slice(0, 2).map((a: any) => (
                              <span key={a.id} className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                                style={{ background: 'oklch(0.6 0.19 220 / 10%)', color: 'oklch(0.45 0.19 220)' }}>
                                <Bot className="w-2.5 h-2.5" /> {a.name}
                              </span>
                            ))}
                            {assignedAgents.length > 2 && (
                              <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>+{assignedAgents.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {contact.doNotCall ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'oklch(0.59 0.245 15 / 12%)', color: 'oklch(0.52 0.245 15)' }}>
                            <ShieldOff className="w-2.5 h-2.5" /> DNC
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: 'oklch(0.55 0.215 163 / 12%)', color: 'oklch(0.45 0.215 163)' }}>
                            <Shield className="w-2.5 h-2.5" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                          {formatDate(contact.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => toggleDncMutation.mutate({ id: contact.id, doNotCall: !contact.doNotCall })}
                            className="p-1.5 rounded-lg transition-all hover:scale-105"
                            title={contact.doNotCall ? 'Remove from DNC' : 'Add to DNC'}
                            style={{ color: contact.doNotCall ? 'oklch(0.55 0.215 163)' : 'oklch(0.72 0.18 68)' }}>
                            {contact.doNotCall ? <Shield className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this contact?')) deleteMutation.mutate(contact.id) }}
                            className="p-1.5 rounded-lg transition-all hover:scale-105"
                            style={{ color: 'oklch(0.59 0.245 15)' }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
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

      {/* Contact Detail Drawer */}
      {selectedContact && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedContact(null)} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto"
            style={{ background: 'var(--background)', borderLeft: '1px solid var(--border)' }}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
              style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))' }}>
                  {(selectedContact.name || selectedContact.phoneNumber || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                    {selectedContact.name || 'Unnamed Contact'}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{selectedContact.phoneNumber}</p>
                </div>
              </div>
              <button onClick={() => setSelectedContact(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Phone className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted-foreground)' }}>Phone</p>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{selectedContact.phoneNumber}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Mail className="w-3 h-3" style={{ color: 'var(--muted-foreground)' }} />
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--muted-foreground)' }}>Email</p>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{selectedContact.email || '—'}</p>
                </div>
              </div>

              {/* DNC Status */}
              <div className="flex items-center justify-between p-3 rounded-xl"
                style={{
                  background: selectedContact.doNotCall ? 'oklch(0.59 0.245 15 / 6%)' : 'oklch(0.55 0.215 163 / 6%)',
                  border: `1px solid ${selectedContact.doNotCall ? 'oklch(0.59 0.245 15 / 20%)' : 'oklch(0.55 0.215 163 / 20%)'}`,
                }}>
                <div className="flex items-center gap-2">
                  {selectedContact.doNotCall
                    ? <ShieldOff className="w-4 h-4" style={{ color: 'oklch(0.59 0.245 15)' }} />
                    : <Shield className="w-4 h-4" style={{ color: 'oklch(0.55 0.215 163)' }} />}
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {selectedContact.doNotCall ? 'Do Not Call' : 'Active — Available for campaigns'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    toggleDncMutation.mutate({ id: selectedContact.id, doNotCall: !selectedContact.doNotCall })
                    setSelectedContact({ ...selectedContact, doNotCall: !selectedContact.doNotCall })
                  }}
                  className="text-xs font-medium px-3 py-1 rounded-lg"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                  {selectedContact.doNotCall ? 'Remove DNC' : 'Mark DNC'}
                </button>
              </div>

              {/* Groups */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5" style={{ color: 'oklch(0.49 0.263 281)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Groups</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedContact.groupMemberships || []).length > 0
                    ? selectedContact.groupMemberships.map((m: any) => (
                      <span key={m.group.id} className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'oklch(0.49 0.263 281 / 10%)', color: 'oklch(0.49 0.263 281)' }}>
                        {m.group.name}
                      </span>
                    ))
                    : <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No groups</p>}
                </div>
              </div>

              {/* Agent Assignments */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Bot className="w-3.5 h-3.5" style={{ color: 'oklch(0.49 0.263 281)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Assigned Agents</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedContact.agentAssignments || []).length > 0
                    ? selectedContact.agentAssignments.map((a: any) => (
                      <span key={a.agent.id} className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'oklch(0.6 0.19 220 / 10%)', color: 'oklch(0.45 0.19 220)' }}>
                        {a.agent.name}
                      </span>
                    ))
                    : <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'oklch(0.55 0.215 163 / 12%)', color: 'oklch(0.45 0.215 163)' }}>
                      Shared
                    </span>}
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5" style={{ color: 'oklch(0.49 0.263 281)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Tags</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedContact.tags || []).length > 0
                    ? selectedContact.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: 'oklch(0.49 0.263 281 / 10%)', color: 'oklch(0.49 0.263 281)' }}>
                        {tag}
                      </span>
                    ))
                    : <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No tags</p>}
                </div>
              </div>

              {/* Call History */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <History className="w-3.5 h-3.5" style={{ color: 'oklch(0.49 0.263 281)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Call History</p>
                </div>
                {(contactCalls?.calls || []).length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No calls yet</p>
                ) : (
                  <div className="space-y-2">
                    {(contactCalls?.calls || []).map((call: any) => (
                      <div key={call.id} className="rounded-xl p-3" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
                            {call.agent?.name || 'Unknown Agent'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{
                              background: call.status === 'COMPLETED' ? 'oklch(0.55 0.215 163 / 12%)' : 'oklch(0.59 0.245 15 / 12%)',
                              color: call.status === 'COMPLETED' ? 'oklch(0.45 0.215 163)' : 'oklch(0.52 0.245 15)',
                            }}>
                            {call.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                          <span>{formatDate(call.startedAt)}</span>
                          {call.duration && <span>{formatDuration(call.duration)}</span>}
                          {call.cost && <span>{formatCurrency(call.cost)}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

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
              <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--muted-foreground)' }}>Phone Number *</Label>
              <Input id="phone" value={newContact.phoneNumber}
                onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                placeholder="+1 (555) 123-4567" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="cname" className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--muted-foreground)' }}>Full Name</Label>
              <Input id="cname" value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                placeholder="John Smith" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--muted-foreground)' }}>Email Address</Label>
              <Input id="email" value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="john@example.com" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="tags" className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--muted-foreground)' }}>Tags (comma-separated)</Label>
              <Input id="tags" value={newContact.tags}
                onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
                placeholder="vip, lead, follow-up" className="mt-1.5" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}>
                Cancel
              </button>
              <button onClick={() => createMutation.mutate(newContact)}
                disabled={!newContact.phoneNumber || createMutation.isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                  boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
                }}>
                {createMutation.isPending ? 'Adding...' : 'Add Contact'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
