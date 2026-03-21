'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Bot, Mic2, Globe, Thermometer, Clock, Sparkles,
  Wand2, ChevronRight, RotateCcw,
} from 'lucide-react'
import { PROVIDER_VOICES, PROVIDER_META } from '@/lib/providers/types'

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

interface AgentForm {
  name: string
  description: string
  systemPrompt: string
  firstMessage: string
  voice: string
  language: string
  temperature: number
  maxDuration: number
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

  const provider = 'ELEVENLABS' as const
  const voices = PROVIDER_VOICES.ELEVENLABS
  const providerMeta = PROVIDER_META.ELEVENLABS

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    setGenerateError('')
    try {
      const res = await fetch('/api/agents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: aiPrompt }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setGenerateError(data.error || 'Generation failed')
        return
      }

      // Always use ElevenLabs voices regardless of AI suggestion
      const providerVoices = PROVIDER_VOICES.ELEVENLABS
      const matchedVoice = providerVoices.find(
        (v) => v.id.toLowerCase() === (data.voice || '').toLowerCase()
      ) || providerVoices[0]

      setForm({
        name: data.name || '',
        description: data.description || '',
        systemPrompt: data.systemPrompt || '',
        firstMessage: data.firstMessage || '',
        voice: matchedVoice.id,
        language: data.language || 'en',
        temperature: typeof data.temperature === 'number' ? data.temperature : 0.7,
        maxDuration: 300,
      })
      setGenerated(true)
      setMode('manual')
    } catch {
      setGenerateError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const createAgent = useMutation({
    mutationFn: (data: AgentForm & { provider: string }) =>
      fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
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
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            Powered by {providerMeta.label}
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
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

          {/* Agent Identity */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <SectionHeader icon={Bot} title="Agent Identity" />
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

          {/* System Prompt */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <SectionHeader icon={Mic2} title="Conversation Setup" />
            <div>
              <FieldLabel required>System Prompt</FieldLabel>
              <textarea
                value={form.systemPrompt}
                onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                placeholder={`You are Alex, a friendly sales representative for Acme Corp. Your goal is to introduce our new product and schedule a follow-up demo.\n\nStart by greeting the person warmly, confirm you're speaking with the right contact, then briefly explain our value proposition in 2-3 sentences.`}
                rows={7}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-mono leading-relaxed outline-none resize-none transition-all"
                style={inputStyle()}
              />
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Define persona, tone, objectives, and how to handle objections.
              </p>
            </div>
            <div>
              <FieldLabel>First Message</FieldLabel>
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

          {/* Voice & Language */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <SectionHeader icon={Globe} title="Voice & Language" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Voice</FieldLabel>
                <select
                  value={form.voice}
                  onChange={(e) => setForm({ ...form, voice: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all appearance-none"
                  style={{ ...inputStyle(), cursor: 'pointer' }}
                >
                  {voices.map((v) => (
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
          </div>

          {/* Advanced Settings */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <SectionHeader icon={Thermometer} title="Advanced Settings" />
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
              onClick={() => createAgent.mutate({ ...form, provider })}
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
