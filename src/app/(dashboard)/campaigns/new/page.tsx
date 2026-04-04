'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle, Search, Bot, Users, Settings2, FileText, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

function getNextSlot(): { date: string; time: string } {
  const now = new Date()
  const mins = now.getMinutes()
  const next5 = Math.ceil((mins + 1) / 5) * 5
  now.setMinutes(next5, 0, 0)
  if (next5 >= 60) now.setHours(now.getHours() + 1, next5 - 60, 0, 0)
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const yy = String(now.getFullYear()).slice(-2)
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  return { date: `${dd}/${mm}/${yy}`, time: `${hh}:${mi}` }
}

function parseScheduleToISO(date: string, time: string): string | null {
  const parts = date.split('/')
  if (parts.length !== 3) return null
  const [dd, mm, yy] = parts
  const fullYear = 2000 + parseInt(yy)
  const d = new Date(fullYear, parseInt(mm) - 1, parseInt(dd), ...time.split(':').map(Number) as [number, number])
  return isNaN(d.getTime()) ? null : d.toISOString()
}

interface ContactGroup {
  id: string
  name: string
  _count: { members: number }
}

export default function NewCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [search, setSearch] = useState('')
  const [contactGroupFilter, setContactGroupFilter] = useState('')
  const [contactAgentFilter, setContactAgentFilter] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    agentId: '',
    contactIds: [] as string[],
    maxRetries: 3,
    retryDelayMinutes: 60,
    callsPerMinute: 5,
    schedDate: '',
    schedTime: '',
    launchMode: 'immediate' as 'immediate' | 'scheduled' | 'draft',
  })

  const { data: agentsRaw = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/agents').then((r) => r.json()),
  })
  const agents = Array.isArray(agentsRaw) ? agentsRaw : []

  const { data: groupsRaw = [] } = useQuery<ContactGroup[]>({
    queryKey: ['contact-groups'],
    queryFn: () => fetch('/api/contact-groups').then((r) => r.json()),
  })
  const contactGroups = Array.isArray(groupsRaw) ? groupsRaw : []

  const contactQs = new URLSearchParams({ limit: '1000' })
  if (contactGroupFilter) contactQs.set('groupId', contactGroupFilter)
  if (contactAgentFilter) contactQs.set('agentId', contactAgentFilter)

  const { data: contactsRaw } = useQuery({
    queryKey: ['contacts', contactGroupFilter, contactAgentFilter],
    queryFn: () => fetch(`/api/contacts?${contactQs.toString()}`).then((r) => r.json()),
  })
  const contacts = useMemo(() => {
    if (Array.isArray(contactsRaw?.contacts)) return contactsRaw.contacts
    if (Array.isArray(contactsRaw)) return contactsRaw
    return []
  }, [contactsRaw])

  const createCampaign = useMutation({
    mutationFn: (data: typeof formData) =>
      fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: (data) => {
      if (data.id) router.push(`/campaigns/${data.id}`)
    },
  })

  const toggleContact = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      contactIds: prev.contactIds.includes(id)
        ? prev.contactIds.filter((c) => c !== id)
        : [...prev.contactIds, id],
    }))
  }

  const filteredContacts = useMemo(() =>
    contacts.filter((c: any) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phoneNumber.includes(search)
    ),
    [contacts, search]
  )

  const steps = [
    { label: 'Details', icon: FileText },
    { label: 'Agent', icon: Bot },
    { label: 'Contacts', icon: Users },
    { label: 'Settings', icon: Settings2 },
  ]

  const gradientPrimary = 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))'
  const shadowPrimary = '0 4px 14px oklch(0.49 0.263 281 / 35%)'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Create Campaign</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Step {step} of 4 — {steps[step - 1].label}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => {
          const StepIcon = s.icon
          const isActive = i + 1 === step
          const isDone = i + 1 < step
          return (
            <div key={s.label} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={
                    isDone
                      ? { background: 'oklch(0.55 0.215 163 / 20%)', color: 'oklch(0.55 0.215 163)' }
                      : isActive
                      ? { background: gradientPrimary, color: 'white', boxShadow: shadowPrimary }
                      : { background: 'var(--muted)', color: 'var(--muted-foreground)', border: '1px solid var(--border)' }
                  }
                >
                  {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-1 h-px transition-all duration-300"
                  style={{ background: isDone ? 'oklch(0.55 0.215 163 / 40%)' : 'var(--border)' }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step 1: Basic Details */}
      {step === 1 && (
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div>
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Campaign Details</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Campaign Name <span style={{ color: 'oklch(0.59 0.245 15)' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Q1 Sales Outreach"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: 'var(--input)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What is this campaign for?"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 resize-none"
              style={{
                background: 'var(--input)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(2)}
              disabled={!formData.name}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: gradientPrimary, boxShadow: formData.name ? shadowPrimary : 'none' }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Agent */}
      {step === 2 && (
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Select AI Agent</p>

          {agents.length === 0 ? (
            <div className="py-8 text-center rounded-xl" style={{ background: 'var(--muted)', border: '1px dashed var(--border)' }}>
              <Bot className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                No agents found.{' '}
                <a
                  href="/agents/new"
                  className="font-medium underline underline-offset-2"
                  style={{ color: 'oklch(0.49 0.263 281)' }}
                >
                  Create an agent first.
                </a>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {agents.map((agent: any) => {
                const isSelected = formData.agentId === agent.id
                return (
                  <button
                    key={agent.id}
                    onClick={() => setFormData({ ...formData, agentId: agent.id })}
                    className="w-full text-left p-4 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                    style={{
                      background: isSelected ? 'oklch(0.49 0.263 281 / 8%)' : 'var(--muted)',
                      border: isSelected ? '1px solid oklch(0.49 0.263 281 / 40%)' : '1px solid var(--border)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isSelected
                              ? gradientPrimary
                              : 'oklch(0.49 0.263 281 / 10%)',
                            color: isSelected ? 'white' : 'oklch(0.49 0.263 281)',
                          }}
                        >
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                            {agent.name}
                          </p>
                          {agent.description && (
                            <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                              {agent.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.49 0.263 281)' }} />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!formData.agentId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: gradientPrimary, boxShadow: formData.agentId ? shadowPrimary : 'none' }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Contacts */}
      {step === 3 && (
        <div
          className="rounded-2xl p-6 space-y-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Select Contacts</p>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                background: formData.contactIds.length > 0 ? 'oklch(0.49 0.263 281 / 10%)' : 'var(--muted)',
                color: formData.contactIds.length > 0 ? 'oklch(0.49 0.263 281)' : 'var(--muted-foreground)',
              }}
            >
              {formData.contactIds.length} / {contacts.length} selected
            </span>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: 'var(--input)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
            {contactGroups.length > 0 && (
              <select
                value={contactGroupFilter}
                onChange={(e) => setContactGroupFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl outline-none"
                style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                <option value="">All Groups</option>
                {contactGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name} ({g._count.members})</option>
                ))}
              </select>
            )}
            {agents.length > 0 && (
              <select
                value={contactAgentFilter}
                onChange={(e) => setContactAgentFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl outline-none"
                style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              >
                <option value="">All Agents</option>
                <option value="shared">Shared</option>
                {agents.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Select All / Clear */}
          <div className="flex gap-2">
            <button
              onClick={() => setFormData({ ...formData, contactIds: contacts.map((c: any) => c.id) })}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              Select All
            </button>
            <button
              onClick={() => setFormData({ ...formData, contactIds: [] })}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
            >
              Clear
            </button>
          </div>

          {/* Contact list */}
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {filteredContacts.map((contact: any) => {
              const selected = formData.contactIds.includes(contact.id)
              return (
                <button
                  key={contact.id}
                  onClick={() => toggleContact(contact.id)}
                  className="w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center justify-between hover:scale-[1.01]"
                  style={{
                    background: selected ? 'oklch(0.49 0.263 281 / 8%)' : 'var(--muted)',
                    border: selected ? '1px solid oklch(0.49 0.263 281 / 40%)' : '1px solid var(--border)',
                  }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                      {contact.name || contact.phoneNumber}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {contact.phoneNumber}
                    </p>
                  </div>
                  {selected && <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.49 0.263 281)' }} />}
                </button>
              )
            })}
            {filteredContacts.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--muted-foreground)' }}>
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No contacts found.</p>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={formData.contactIds.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: gradientPrimary, boxShadow: formData.contactIds.length > 0 ? shadowPrimary : 'none' }}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Settings */}
      {step === 4 && (
        <div
          className="rounded-2xl p-6 space-y-6"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Campaign Settings</p>

          {/* Schedule */}
          <div className="space-y-2">
            <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
              Schedule
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, schedDate: '', schedTime: '', launchMode: 'immediate' })}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                style={{
                  background: formData.launchMode === 'immediate' ? 'oklch(0.49 0.263 281 / 10%)' : 'var(--muted)',
                  border: formData.launchMode === 'immediate' ? '1px solid oklch(0.49 0.263 281 / 40%)' : '1px solid var(--border)',
                  color: formData.launchMode === 'immediate' ? 'oklch(0.49 0.263 281)' : 'var(--muted-foreground)',
                }}
              >
                Start immediately
              </button>
              <button
                type="button"
                onClick={() => {
                  const slot = getNextSlot()
                  setFormData({ ...formData, schedDate: formData.schedDate || slot.date, schedTime: formData.schedTime || slot.time, launchMode: 'scheduled' })
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                style={{
                  background: formData.launchMode === 'scheduled' ? 'oklch(0.49 0.263 281 / 10%)' : 'var(--muted)',
                  border: formData.launchMode === 'scheduled' ? '1px solid oklch(0.49 0.263 281 / 40%)' : '1px solid var(--border)',
                  color: formData.launchMode === 'scheduled' ? 'oklch(0.49 0.263 281)' : 'var(--muted-foreground)',
                }}
              >
                <Calendar className="w-3 h-3" /> Schedule for later
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, schedDate: '', schedTime: '', launchMode: 'draft' })}
                className="px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                style={{
                  background: formData.launchMode === 'draft' ? 'oklch(0.49 0.263 281 / 10%)' : 'var(--muted)',
                  border: formData.launchMode === 'draft' ? '1px solid oklch(0.49 0.263 281 / 40%)' : '1px solid var(--border)',
                  color: formData.launchMode === 'draft' ? 'oklch(0.49 0.263 281)' : 'var(--muted-foreground)',
                }}
              >
                Save as Draft
              </button>
            </div>
            {formData.launchMode === 'scheduled' && (
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>Date (dd/mm/yy)</label>
                  <input
                    placeholder="dd/mm/yy"
                    value={formData.schedDate}
                    onChange={(e) => setFormData({ ...formData, schedDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      background: 'var(--input)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                    }}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-medium" style={{ color: 'var(--muted-foreground)' }}>Time</label>
                  <input
                    type="time"
                    value={formData.schedTime}
                    onChange={(e) => setFormData({ ...formData, schedTime: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                    style={{
                      background: 'var(--input)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'retries', label: 'Max Retries', key: 'maxRetries', min: 0, max: 10 },
              { id: 'delay', label: 'Retry Delay (min)', key: 'retryDelayMinutes', min: 1, max: 1440 },
              { id: 'rate', label: 'Calls / Minute', key: 'callsPerMinute', min: 1, max: 60 },
            ].map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                  {field.label}
                </label>
                <input
                  id={field.id}
                  type="number"
                  value={(formData as any)[field.key]}
                  onChange={(e) =>
                    setFormData({ ...formData, [field.key]: parseInt(e.target.value) || 0 })
                  }
                  min={field.min}
                  max={field.max}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: 'var(--input)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Summary */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              Summary
            </p>
            {[
              { label: 'Name', value: formData.name },
              { label: 'Agent', value: agents.find((a: any) => a.id === formData.agentId)?.name || '—' },
              { label: 'Contacts', value: `${formData.contactIds.length} selected` },
              { label: 'Max Retries', value: formData.maxRetries },
              { label: 'Calls / min', value: formData.callsPerMinute },
              { label: 'Schedule', value: formData.launchMode === 'immediate' ? 'Start immediately' : formData.launchMode === 'scheduled' && formData.schedDate ? `${formData.schedDate} ${formData.schedTime}` : 'Draft (manual start)' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{value}</span>
              </div>
            ))}
          </div>

          {createCampaign.isError && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'oklch(0.59 0.245 15 / 10%)', border: '1px solid oklch(0.59 0.245 15 / 20%)', color: 'oklch(0.59 0.245 15)' }}
            >
              Failed to create campaign. Please try again.
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => {
                const { launchMode, schedDate, schedTime, ...rest } = formData
                const data: any = { ...rest }
                if (launchMode === 'immediate') {
                  data.autoStart = true
                } else if (launchMode === 'scheduled' && schedDate && schedTime) {
                  const iso = parseScheduleToISO(schedDate, schedTime)
                  if (iso) data.scheduledAt = iso
                }
                createCampaign.mutate(data)
              }}
              disabled={createCampaign.isPending || (formData.launchMode === 'scheduled' && (!formData.schedDate || !formData.schedTime))}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: gradientPrimary, boxShadow: shadowPrimary }}
            >
              {createCampaign.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating...
                </>
              ) : (
                formData.launchMode === 'immediate' ? 'Create & Start' : formData.launchMode === 'scheduled' ? 'Schedule Campaign' : 'Save as Draft'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
