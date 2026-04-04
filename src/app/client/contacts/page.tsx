'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, Plus, Phone, Mail, Users, Target, Upload, Loader2, CheckCircle2, FileSpreadsheet } from 'lucide-react'

export default function ClientContactsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [newContact, setNewContact] = useState({ phoneNumber: '', name: '', email: '' })
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [gsheetOpen, setGsheetOpen] = useState(false)
  const [gsheetUrl, setGsheetUrl] = useState('')
  const [gsheetResult, setGsheetResult] = useState<{ imported: number; failed: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['client-contacts', search],
    queryFn: () =>
      fetch(`/api/client/contacts${search ? `?search=${encodeURIComponent(search)}` : ''}`).then((r) => r.json()),
  })
  const contacts: any[] = Array.isArray(data) ? data : (Array.isArray(data?.contacts) ? data.contacts : [])

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      fetch('/api/client/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] })
      setAddOpen(false)
      setNewContact({ phoneNumber: '', name: '', email: '' })
    },
  })

  const convertMutation = useMutation({
    mutationFn: (contactId: string) =>
      fetch('/api/client/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] })
      setConvertingId(null)
    },
    onError: () => setConvertingId(null),
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/contacts/import', { method: 'POST', body: formData })
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] })
      setUploadResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0 })
      setTimeout(() => setUploadResult(null), 5000)
      if (fileRef.current) fileRef.current.value = ''
    },
  })

  const gsheetMutation = useMutation({
    mutationFn: (url: string) =>
      fetch('/api/contacts/import-gsheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-contacts'] })
      setGsheetResult({ imported: data.imported ?? 0, failed: data.failed ?? 0 })
    },
  })

  const handleGsheetImport = () => {
    setGsheetResult(null)
    gsheetMutation.mutate(gsheetUrl)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadMutation.mutate(file)
  }

  const handleConvert = (contactId: string) => {
    setConvertingId(contactId)
    convertMutation.mutate(contactId)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Contacts</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your contacts and convert them to leads</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileUpload}
        />
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => fileRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload CSV
        </Button>

        <Button variant="outline" size="sm" onClick={() => { setGsheetOpen(true); setGsheetResult(null); setGsheetUrl('') }} className="gap-1.5">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Google Sheets
        </Button>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label htmlFor="c-phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Phone Number *
                </Label>
                <Input
                  id="c-phone"
                  value={newContact.phoneNumber}
                  onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="c-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="c-name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  placeholder="Jane Smith"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="c-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  id="c-email"
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="jane@example.com"
                  className="mt-1.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createMutation.mutate(newContact)}
                  disabled={!newContact.phoneNumber || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Adding...' : 'Add Contact'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Google Sheets import dialog */}
      <Dialog open={gsheetOpen} onOpenChange={setGsheetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import from Google Sheets</DialogTitle>
            <DialogDescription>Paste a public Google Sheet URL. Columns: phone_number, name, email, tags</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="https://docs.google.com/spreadsheets/d/..." value={gsheetUrl} onChange={(e) => setGsheetUrl(e.target.value)} />
            <p className="text-xs text-muted-foreground">Make sure the sheet is shared publicly (Anyone with the link can view).</p>
            {gsheetResult && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {gsheetResult.imported} imported, {gsheetResult.failed} failed
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGsheetOpen(false)}>Cancel</Button>
            <Button onClick={handleGsheetImport} disabled={!gsheetUrl || gsheetMutation.isPending}>
              {gsheetMutation.isPending ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload result */}
      {uploadResult && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Imported {uploadResult.imported} contact{uploadResult.imported !== 1 ? 's' : ''}
          {uploadResult.skipped > 0 && `, ${uploadResult.skipped} skipped`}
        </div>
      )}

      {/* Contact list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse bg-muted border border-border" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <Card className="shadow-none border-dashed">
          <CardContent className="py-14 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No contacts yet</h3>
            <p className="text-sm text-muted-foreground">
              {search ? `No results for "${search}"` : 'Add your first contact to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact: any) => {
            const isLead = (contact._count?.leads ?? contact.leads?.length ?? 0) > 0
            const isConverting = convertingId === contact.id
            const calls = contact._count?.calls ?? contact.calls?.length ?? 0

            return (
              <Card key={contact.id} className="shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white bg-primary flex-shrink-0">
                      {(contact.name || contact.phoneNumber || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">
                          {contact.name || <span className="text-muted-foreground">Unnamed</span>}
                        </span>
                        {calls > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {calls} call{calls !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {isLead && (
                          <Badge className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border-0">
                            Lead
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {contact.phoneNumber}
                        </span>
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {contact.email}
                          </span>
                        )}
                      </div>
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1.5">
                          {contact.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {!isLead && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1.5 text-xs shrink-0"
                        onClick={() => handleConvert(contact.id)}
                        disabled={isConverting}
                      >
                        <Target className="w-3.5 h-3.5" />
                        {isConverting ? 'Converting...' : 'Convert to Lead'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!isLoading && contacts.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          {search && ` matching "${search}"`}
        </p>
      )}
    </div>
  )
}
