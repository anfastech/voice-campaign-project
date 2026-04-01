'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Bot, Mic2, Globe, Thermometer, Clock, Sparkles,
  Wand2, ChevronRight, RotateCcw, Database, ChevronDown,
} from 'lucide-react'
import { VOICE_OPTIONS } from '@/lib/providers/types'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'it', label: 'Italian' },
]

const QUICK_PROMPTS = [
  { label: 'Customer Support', prompt: 'A friendly customer support agent that helps users troubleshoot issues, answer FAQs, and escalate complex problems to human agents when needed.' },
  { label: 'Sales Outreach', prompt: 'A professional sales development rep that introduces our product, qualifies leads, handles objections politely, and schedules demos with interested prospects.' },
  { label: 'Appointment Booking', prompt: 'A helpful scheduling assistant that checks availability, books appointments, sends reminders, and handles rescheduling requests.' },
  { label: 'Survey & Feedback', prompt: 'A neutral survey agent that collects customer feedback after purchases or interactions, using a 5-question structured survey with open-ended follow-ups.' },
  { label: 'Lead Qualification', prompt: 'A discovery agent that asks qualifying questions about company size, budget, timeline, and pain points to determine if a prospect is a good fit.' },
  { label: 'Collections', prompt: 'A professional and empathetic collections agent that reminds customers about overdue invoices, explains payment options, and sets up payment plans.' },
]

type Mode = 'ai' | 'manual'

const AMBIENT_SOUNDS = [
  { value: '', label: 'None' },
  { value: 'office', label: 'Office' },
  { value: 'coffee-shop', label: 'Coffee Shop' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'convention-center', label: 'Convention Center' },
]

interface AgentForm {
  name: string
  description: string
  systemPrompt: string
  firstMessage: string
  voice: string
  language: string
  temperature: number
  maxDuration: number
  useKnowledgeBase: boolean
  interruptionSensitivity: number
  ambientSound: string
  backchannel: boolean
  evaluationCriteria: string
  dataCollection: string
}

const DEFAULT_FORM: AgentForm = {
  name: '',
  description: '',
  systemPrompt: '',
  firstMessage: '',
  voice: 'rachel',
  language: 'en',
  temperature: 0.7,
  maxDuration: 300,
  useKnowledgeBase: false,
  interruptionSensitivity: 0.5,
  ambientSound: '',
  backchannel: false,
  evaluationCriteria: '',
  dataCollection: '',
}

function inputStyle() {
  return {
    background: 'var(--input, var(--muted))',
    border: '1px solid var(--border)',
    color: 'var(--foreground)',
  }
}

export default function NewAgentPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('ai')
  const [form, setForm] = useState<AgentForm>(DEFAULT_FORM)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const [kbDocCount, setKbDocCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/knowledge-base')
      .then((r) => r.json())
      .then((data) => {
        const docs = Array.isArray(data) ? data : (data.documents ?? [])
        setKbDocCount(docs.filter((d: { elevenLabsDocId?: string | null }) => d.elevenLabsDocId).length)
      })
      .catch(() => setKbDocCount(0))
  }, [])

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    setGenerateError('')
    try {
      const res = await fetch('/api/agents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiPrompt, useKnowledgeBase: form.useKnowledgeBase }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setGenerateError(data.error || 'Generation failed')
        return
      }

      const matchedVoice = VOICE_OPTIONS.find(
        (v) => v.id.toLowerCase() === (data.voice || '').toLowerCase()
      ) || VOICE_OPTIONS[0]

      setForm((prev) => ({
        ...prev,
        name: data.name || '',
        description: data.description || '',
        systemPrompt: data.systemPrompt || '',
        firstMessage: data.firstMessage || '',
        voice: matchedVoice.id,
        language: data.language || 'en',
        temperature: typeof data.temperature === 'number' ? data.temperature : 0.7,
        maxDuration: 300,
      }))
      setGenerated(true)
      setMode('manual')
    } catch {
      setGenerateError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const createAgent = useMutation({
    mutationFn: (data: AgentForm & { provider: string }) => {
      const payload: Record<string, unknown> = { ...data }
      // Parse JSON fields
      if (data.evaluationCriteria) {
        try { payload.evaluationCriteria = JSON.parse(data.evaluationCriteria) } catch { /* keep as string */ }
      } else {
        delete payload.evaluationCriteria
      }
      if (data.dataCollection) {
        try { payload.dataCollection = JSON.parse(data.dataCollection) } catch { /* keep as string */ }
      } else {
        delete payload.dataCollection
      }
      if (!data.ambientSound) delete payload.ambientSound
      return fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json())
    },
    onSuccess: () => router.push('/agents'),
  })

  const isValid = form.name.trim() && form.systemPrompt.trim()

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
          style={{ border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--muted-foreground)' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Create AI Agent</h1>
        </div>
      </div>

      {/* 1. Mode Toggle */}
      <div
        className="flex rounded-2xl p-1 gap-1"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        {[
          { key: 'ai' as Mode, icon: Wand2, label: 'AI Generate', desc: 'Describe and auto-configure' },
          { key: 'manual' as Mode, icon: Bot, label: 'Manual', desc: 'Configure fields manually' },
        ].map(({ key, icon: Icon, label, desc }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all duration-200"
            style={{
              background: mode === key ? 'var(--card)' : 'transparent',
              border: mode === key ? '1px solid var(--border)' : '1px solid transparent',
              boxShadow: mode === key ? '0 1px 4px oklch(0 0 0 / 8%)' : 'none',
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: mode === key ? 'oklch(0.49 0.263 281 / 12%)' : 'transparent',
              }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: mode === key ? 'oklch(0.49 0.263 281)' : 'var(--muted-foreground)' }} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: mode === key ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                {label}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* AI Generate Mode */}
      {mode === 'ai' && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center gap-2.5"
            style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.875rem' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'oklch(0.49 0.263 281 / 10%)' }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: 'oklch(0.49 0.263 281)' }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                Describe Your Agent
              </h3>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                AI will generate the full configuration automatically
              </p>
            </div>
          </div>

          {/* Quick prompts */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>
              Quick Start
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => setAiPrompt(qp.prompt)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:scale-105"
                  style={{
                    background: aiPrompt === qp.prompt ? 'oklch(0.49 0.263 281 / 12%)' : 'var(--muted)',
                    border: aiPrompt === qp.prompt ? '1px solid oklch(0.49 0.263 281 / 40%)' : '1px solid var(--border)',
                    color: aiPrompt === qp.prompt ? 'oklch(0.49 0.263 281)' : 'var(--foreground)',
                  }}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt textarea */}
          <div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. A friendly customer support agent for a SaaS company that helps with onboarding, billing questions, and technical issues. Should be professional but approachable, use simple language, and escalate complex issues to human agents."
              rows={5}
              className="w-full px-3 py-2.5 rounded-xl text-sm leading-relaxed outline-none resize-none transition-all"
              style={inputStyle()}
            />
          </div>

          {/* KB toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                  Tailor for Knowledge Base
                </p>
                <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                  AI will include KB instructions in the system prompt
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, useKnowledgeBase: !form.useKnowledgeBase })}
              className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
              style={{
                background: form.useKnowledgeBase ? 'oklch(0.49 0.263 281)' : 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
                style={{ left: form.useKnowledgeBase ? '1.375rem' : '0.125rem' }}
              />
            </button>
          </div>
          {form.useKnowledgeBase && (
            <div
              className="rounded-xl px-3 py-2 text-xs"
              style={{
                background: 'oklch(0.49 0.263 281 / 8%)',
                border: '1px solid oklch(0.49 0.263 281 / 20%)',
              }}
            >
              {kbDocCount === null ? (
                <span style={{ color: 'var(--muted-foreground)' }}>Loading documents…</span>
              ) : kbDocCount > 0 ? (
                <span style={{ color: 'oklch(0.49 0.263 281)' }}>
                  {kbDocCount} document{kbDocCount !== 1 ? 's' : ''} will be included
                </span>
              ) : (
                <span style={{ color: 'var(--muted-foreground)' }}>
                  No synced documents yet —{' '}
                  <a href="/knowledge-base" className="underline" style={{ color: 'oklch(0.49 0.263 281)' }}>
                    add some in Knowledge Base
                  </a>
                </span>
              )}
            </div>
          )}

          {generateError && (
            <p
              className="text-sm rounded-xl px-4 py-3"
              style={{
                background: 'oklch(0.59 0.245 15 / 8%)',
                color: 'oklch(0.52 0.245 15)',
                border: '1px solid oklch(0.59 0.245 15 / 20%)',
              }}
            >
              {generateError}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={!aiPrompt.trim() || generating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
              boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
            }}
          >
            {generating ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Generating agent configuration…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Agent with AI
                <ChevronRight className="w-4 h-4 opacity-70" />
              </>
            )}
          </button>

          {/* Generating state with steps */}
          {generating && (
            <div className="space-y-2">
              {[
                'Analyzing your requirements…',
                'Crafting system prompt…',
                'Selecting optimal voice & settings…',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{
                      background: 'oklch(0.49 0.263 281)',
                      animationDelay: `${i * 200}ms`,
                    }}
                  />
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual config / AI result form */}
      {mode === 'manual' && (
        <>
          {generated && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{
                background: 'oklch(0.55 0.215 163 / 8%)',
                border: '1px solid oklch(0.55 0.215 163 / 25%)',
              }}
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: 'oklch(0.55 0.215 163)' }} />
              <p className="text-xs flex-1" style={{ color: 'oklch(0.45 0.215 163)' }}>
                Agent configuration generated by AI. Review and adjust before saving.
              </p>
              <button
                onClick={() => { setGenerated(false); setMode('ai') }}
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: 'oklch(0.55 0.215 163)' }}
              >
                <RotateCcw className="w-3 h-3" />
                Regenerate
              </button>
            </div>
          )}

          {/* 2. Identity */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <SectionHeader icon={Bot} title="Identity" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Agent Name</FieldLabel>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sales Outreach Agent"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle()}
                />
              </div>
              <div>
                <FieldLabel>Description</FieldLabel>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Briefly describe what this agent does"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={inputStyle()}
                />
              </div>
            </div>
          </div>

          {/* 3. System Prompt — hero section */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: 'var(--card)',
              border: '2px solid oklch(0.49 0.263 281 / 35%)',
              boxShadow: '0 0 0 4px oklch(0.49 0.263 281 / 6%)',
            }}
          >
            <div
              className="flex items-center gap-2.5"
              style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.875rem' }}
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.49 0.263 281 / 14%)' }}>
                <Mic2 className="w-3.5 h-3.5" style={{ color: 'oklch(0.49 0.263 281)' }} />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>System Prompt</h3>
                <p className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                  Define persona, tone, objectives, and how to handle objections
                </p>
              </div>
              <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: 'oklch(0.49 0.263 281 / 10%)', color: 'oklch(0.49 0.263 281)' }}>
                Required
              </span>
            </div>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
              placeholder={`You are Alex, a friendly sales representative for Acme Corp. Your goal is to introduce our new product and schedule a follow-up demo.\n\nStart by greeting the person warmly, confirm you're speaking with the right contact, then briefly explain our value proposition in 2-3 sentences.`}
              className="w-full px-3 py-2.5 rounded-xl text-xs font-mono leading-relaxed outline-none resize-none transition-all"
              style={{ ...inputStyle(), minHeight: '200px' }}
            />
          </div>

          {/* 4. First Message */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <SectionHeader icon={Sparkles} title="First Message" />
            <div>
              <FieldLabel>Opening Line</FieldLabel>
              <input
                type="text"
                value={form.firstMessage}
                onChange={(e) => setForm({ ...form, firstMessage: e.target.value })}
                placeholder="e.g. Hi, this is Alex from Acme Corp! How are you doing today?"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={inputStyle()}
              />
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                The first thing the agent says when a call connects. Leave blank for user to speak first.
              </p>
            </div>
          </div>

          {/* 5. Voice & Style */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <SectionHeader icon={Globe} title="Voice & Style" />

            {/* Voice + Language */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Voice</FieldLabel>
                <select
                  value={form.voice}
                  onChange={(e) => setForm({ ...form, voice: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all appearance-none"
                  style={{ ...inputStyle(), cursor: 'pointer' }}
                >
                  {VOICE_OPTIONS.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Language</FieldLabel>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all appearance-none"
                  style={{ ...inputStyle(), cursor: 'pointer' }}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Temperature + Max Duration */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <FieldLabel>
                  Temperature{' '}
                  <span className="ml-1 font-bold normal-case" style={{ color: 'oklch(0.49 0.263 281)' }}>
                    {form.temperature}
                  </span>
                </FieldLabel>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                  className="w-full mt-2"
                  style={{ accentColor: 'oklch(0.49 0.263 281)' }}
                />
                <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
              <div>
                <FieldLabel>Max Duration (seconds)</FieldLabel>
                <div className="relative mt-1">
                  <Clock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                    style={{ color: 'var(--muted-foreground)' }}
                  />
                  <input
                    type="number"
                    value={form.maxDuration}
                    onChange={(e) => setForm({ ...form, maxDuration: parseInt(e.target.value) || 300 })}
                    min={30}
                    max={3600}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle()}
                  />
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {Math.floor(form.maxDuration / 60)}m {form.maxDuration % 60}s max call length
                </p>
              </div>
            </div>

            {/* Interruption Sensitivity */}
            <div>
              <FieldLabel>
                Interruption Sensitivity{' '}
                <span className="ml-1 font-bold normal-case" style={{ color: 'oklch(0.49 0.263 281)' }}>
                  {form.interruptionSensitivity}
                </span>
              </FieldLabel>
              <input
                type="range" min={0} max={1} step={0.1}
                value={form.interruptionSensitivity}
                onChange={(e) => setForm({ ...form, interruptionSensitivity: parseFloat(e.target.value) })}
                className="w-full mt-2" style={{ accentColor: 'oklch(0.49 0.263 281)' }}
              />
              <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
                <span>Low (harder to interrupt)</span>
                <span>High (easy to interrupt)</span>
              </div>
            </div>

            {/* Backchannel */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Backchannel Responses
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Enable affirmations like &quot;mhm&quot;, &quot;I see&quot; while listening
                </p>
              </div>
              <button type="button"
                onClick={() => setForm({ ...form, backchannel: !form.backchannel })}
                className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
                style={{ background: form.backchannel ? 'oklch(0.49 0.263 281)' : 'var(--muted)', border: '1px solid var(--border)' }}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
                  style={{ left: form.backchannel ? '1.375rem' : '0.125rem' }} />
              </button>
            </div>

            {/* Ambient Sound */}
            <div>
              <FieldLabel>Ambient Sound</FieldLabel>
              <select value={form.ambientSound}
                onChange={(e) => setForm({ ...form, ambientSound: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all appearance-none"
                style={{ ...inputStyle(), cursor: 'pointer' }}>
                {AMBIENT_SOUNDS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Background ambience during calls
              </p>
            </div>
          </div>

          {/* 6. Knowledge Base */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <SectionHeader icon={Database} title="Knowledge Base" />
            <div
              className="rounded-xl px-4 py-3 text-xs"
              style={{
                background: 'oklch(0.6 0.19 220 / 6%)',
                border: '1px solid oklch(0.6 0.19 220 / 20%)',
                color: 'var(--muted-foreground)',
              }}
            >
              Documents can be added from the agent detail page after creation.
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Include knowledge base documents
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  Agent will use synced documents to answer questions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, useKnowledgeBase: !form.useKnowledgeBase })}
                className="relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0"
                style={{
                  background: form.useKnowledgeBase ? 'oklch(0.49 0.263 281)' : 'var(--muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
                  style={{ left: form.useKnowledgeBase ? '1.375rem' : '0.125rem' }}
                />
              </button>
            </div>
          </div>

          {/* 7. Advanced — collapsed by default */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 transition-all duration-150"
              style={{ background: 'var(--card)' }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.49 0.263 281 / 10%)' }}>
                  <Thermometer className="w-3.5 h-3.5" style={{ color: 'oklch(0.49 0.263 281)' }} />
                </div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Advanced</h3>
                <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                  Evaluation criteria &amp; data collection
                </span>
              </div>
              <ChevronDown
                className="w-4 h-4 transition-transform duration-200"
                style={{ color: 'var(--muted-foreground)', transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {advancedOpen && (
              <div
                className="px-5 pb-5 space-y-4"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <div className="pt-4">
                  <FieldLabel>Evaluation Criteria</FieldLabel>
                  <textarea value={form.evaluationCriteria}
                    onChange={(e) => setForm({ ...form, evaluationCriteria: e.target.value })}
                    placeholder={'[\n  { "id": "booking", "name": "Appointment Booked", "description": "Did the agent successfully book an appointment?" },\n  { "id": "interest", "name": "Interest Level", "description": "How interested was the contact?" }\n]'}
                    rows={5}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono leading-relaxed outline-none resize-none transition-all"
                    style={inputStyle()} />
                  <p className="text-[11px] mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    JSON array of success metrics to evaluate after each call. Leave blank to skip.
                  </p>
                </div>

                <div>
                  <FieldLabel>Data Collection Fields</FieldLabel>
                  <textarea value={form.dataCollection}
                    onChange={(e) => setForm({ ...form, dataCollection: e.target.value })}
                    placeholder={'[\n  { "id": "name", "name": "Full Name", "description": "The contact\'s full name", "type": "string" },\n  { "id": "interest", "name": "Interest Level", "description": "1-5 scale", "type": "number" }\n]'}
                    rows={5}
                    className="w-full px-3 py-2.5 rounded-xl text-xs font-mono leading-relaxed outline-none resize-none transition-all"
                    style={inputStyle()} />
                  <p className="text-[11px] mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                    JSON array of structured data to extract from calls. Leave blank to skip.
                  </p>
                </div>
              </div>
            )}
          </div>

          {createAgent.isError && (
            <p
              className="text-sm rounded-xl px-4 py-3"
              style={{
                background: 'oklch(0.59 0.245 15 / 8%)',
                color: 'oklch(0.52 0.245 15)',
                border: '1px solid oklch(0.59 0.245 15 / 20%)',
              }}
            >
              Failed to create agent. Please check your inputs and try again.
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
              style={{ border: '1px solid var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}
            >
              Cancel
            </button>
            <button
              onClick={() => createAgent.mutate({ ...form, provider: 'ELEVENLABS' })}
              disabled={!isValid || createAgent.isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
              }}
            >
              {createAgent.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Agent
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label
      className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
      style={{ color: 'var(--muted-foreground)' }}
    >
      {children}{' '}
      {required && <span style={{ color: 'oklch(0.59 0.245 15)' }}>*</span>}
    </label>
  )
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div
      className="flex items-center gap-2.5"
      style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.875rem' }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'oklch(0.49 0.263 281 / 10%)' }}>
        <Icon className="w-3.5 h-3.5" style={{ color: 'oklch(0.49 0.263 281)' }} />
      </div>
      <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{title}</h3>
    </div>
  )
}
