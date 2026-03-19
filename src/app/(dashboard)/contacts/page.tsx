'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { CsvImportDialog } from '@/components/contacts/CsvImportDialog'
import { Plus, Upload, Search, Trash2, Users, Phone, Mail, Tag } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function ContactsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [csvOpen, setCsvOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newContact, setNewContact] = useState({ phoneNumber: '', name: '', email: '' })

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts', search],
    queryFn: () =>
      fetch(`/api/contacts${search ? `?search=${encodeURIComponent(search)}` : ''}`).then((r) => r.json()),
  })
  const contacts = Array.isArray(contactsData?.contacts) ? contactsData.contacts : (Array.isArray(contactsData) ? contactsData : [])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/contacts/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof newContact) =>
      fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setAddOpen(false)
      setNewContact({ phoneNumber: '', name: '', email: '' })
    },
  })

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          <input
            placeholder="Search by name, phone or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border outline-none transition-all duration-200 focus:ring-2"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setCsvOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 hover:scale-105"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
              boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
            }}
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Count */}
      {!isLoading && contacts.length > 0 && (
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          {search && ` matching "${search}"`}
        </p>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl relative overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, oklch(0.49 0.263 281 / 15%), oklch(0.65 0.22 310 / 15%))',
              border: '1px solid oklch(0.49 0.263 281 / 20%)',
            }}>
            <Users className="w-7 h-7" style={{ color: 'oklch(0.49 0.263 281)' }} />
          </div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
            {search ? 'No contacts found' : 'No contacts yet'}
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
            {search ? `No results for "${search}"` : 'Import a CSV or add contacts manually to get started.'}
          </p>
          {!search && (
            <div className="flex gap-3">
              <button onClick={() => setCsvOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                <Upload className="w-4 h-4" /> Import CSV
              </button>
              <button onClick={() => setAddOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                  boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
                }}>
                <Plus className="w-4 h-4" /> Add Contact
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--muted-foreground)' }}>Contact</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--muted-foreground)' }}>Phone</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest hidden md:table-cell"
                  style={{ color: 'var(--muted-foreground)' }}>Email</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest hidden lg:table-cell"
                  style={{ color: 'var(--muted-foreground)' }}>Tags</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest hidden lg:table-cell"
                  style={{ color: 'var(--muted-foreground)' }}>Calls</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold uppercase tracking-widest hidden xl:table-cell"
                  style={{ color: 'var(--muted-foreground)' }}>Added</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact: any, idx: number) => (
                <tr key={contact.id} className="group transition-colors duration-150"
                  style={{ borderTop: idx > 0 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'var(--muted)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
                  <td className="px-5 py-3">
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      {contact.phoneNumber}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {contact.email ? (
                        <><Mail className="w-3 h-3 flex-shrink-0" />{contact.email}</>
                      ) : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags?.length > 0 ? contact.tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                          style={{ background: 'oklch(0.49 0.263 281 / 8%)', color: 'oklch(0.49 0.263 281)' }}>
                          {tag}
                        </span>
                      )) : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--foreground)' }}>
                      {contact._count?.calls ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                      {formatDate(contact.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { if (confirm('Delete this contact?')) deleteMutation.mutate(contact.id) }}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg"
                      style={{ color: 'oklch(0.59 0.245 15)' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CsvImportDialog open={csvOpen} onOpenChange={setCsvOpen} />

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
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border transition-all hover:scale-105"
                style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--muted)' }}>
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate(newContact)}
                disabled={!newContact.phoneNumber || createMutation.isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                  boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
                }}>
                {createMutation.isPending ? 'Adding…' : 'Add Contact'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
