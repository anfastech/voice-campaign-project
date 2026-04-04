'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Bot, Mic2, Globe, Thermometer, Clock, Sparkles,
  Wand2, ChevronRight, RotateCcw, Database, ChevronDown,
} from 'lucide-react'
import { VOICE_OPTIONS } from '@/lib/providers/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'

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
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Create AI Agent</h1>
        </div>
      </div>

      {/* 1. Mode Toggle */}
      <div className="flex rounded-2xl p-1 gap-1 bg-muted border border-border">
        {[
          { key: 'ai' as Mode, icon: Wand2, label: 'AI Generate', desc: 'Describe and auto-configure' },
          { key: 'manual' as Mode, icon: Bot, label: 'Manual', desc: 'Configure fields manually' },
        ].map(({ key, icon: Icon, label, desc }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
              mode === key ? 'bg-card border border-border shadow-sm' : 'border border-transparent'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                mode === key ? 'bg-primary/10' : ''
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${mode === key ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className={`text-xs font-semibold ${mode === key ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </p>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* AI Generate Mode */}
      {mode === 'ai' && (
        <Card className="rounded-2xl">
          <CardHeader className="border-b border-border pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm">Describe Your Agent</CardTitle>
                <p className="text-xs text-muted-foreground">
                  AI will generate the full configuration automatically
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Quick prompts */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                Quick Start
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => setAiPrompt(qp.prompt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:scale-105 ${
                      aiPrompt === qp.prompt
                        ? 'bg-primary/10 border border-primary/40 text-primary'
                        : 'bg-muted border border-border text-foreground'
                    }`}
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt textarea */}
            <div>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. A friendly customer support agent for a SaaS company that helps with onboarding, billing questions, and technical issues. Should be professional but approachable, use simple language, and escalate complex issues to human agents."
                rows={5}
                className="text-sm leading-relaxed resize-none"
              />
            </div>

            {/* KB toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Tailor for Knowledge Base
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    AI will include KB instructions in the system prompt
                  </p>
                </div>
              </div>
              <Switch
                checked={form.useKnowledgeBase}
                onCheckedChange={(checked) => setForm({ ...form, useKnowledgeBase: checked })}
              />
            </div>
            {form.useKnowledgeBase && (
              <div className="rounded-xl px-3 py-2 text-xs bg-primary/5 border border-primary/20">
                {kbDocCount === null ? (
                  <span className="text-muted-foreground">Loading documents...</span>
                ) : kbDocCount > 0 ? (
                  <span className="text-primary">
                    {kbDocCount} document{kbDocCount !== 1 ? 's' : ''} will be included
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    No synced documents yet —{' '}
                    <a href="/knowledge-base" className="underline text-primary">
                      add some in Knowledge Base
                    </a>
                  </span>
                )}
              </div>
            )}

            {generateError && (
              <p className="text-sm rounded-xl px-4 py-3 bg-destructive/10 text-destructive border border-destructive/20">
                {generateError}
              </p>
            )}

            <Button
              onClick={handleGenerate}
              disabled={!aiPrompt.trim() || generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Generating agent configuration...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Agent with AI
                  <ChevronRight className="w-4 h-4 opacity-70" />
                </>
              )}
            </Button>

            {/* Generating state with steps */}
            {generating && (
              <div className="space-y-2">
                {[
                  'Analyzing your requirements...',
                  'Crafting system prompt...',
                  'Selecting optimal voice & settings...',
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse bg-primary"
                      style={{ animationDelay: `${i * 200}ms` }}
                    />
                    <span className="text-xs text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual config / AI result form */}
      {mode === 'manual' && (
        <>
          {generated && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted border border-border">
              <Sparkles className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <p className="text-xs flex-1 text-foreground">
                Agent configuration generated by AI. Review and adjust before saving.
              </p>
              <button
                onClick={() => { setGenerated(false); setMode('ai') }}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600"
              >
                <RotateCcw className="w-3 h-3" />
                Regenerate
              </button>
            </div>
          )}

          {/* 2. Identity */}
          <Card className="rounded-2xl">
            <CardHeader className="border-b border-border pb-3.5">
              <SectionHeader icon={Bot} title="Identity" />
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Agent Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Sales Outreach Agent"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </Label>
                  <Input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Briefly describe what this agent does"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. System Prompt — hero section */}
          <Card className="rounded-2xl border-2 border-primary/35 shadow-[0_0_0_4px_hsl(var(--primary)/0.06)]">
            <CardHeader className="border-b border-border pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/15">
                  <Mic2 className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">System Prompt</CardTitle>
                  <p className="text-[10px] text-muted-foreground">
                    Define persona, tone, objectives, and how to handle objections
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  Required
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea
                value={form.systemPrompt}
                onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                placeholder={`You are Alex, a friendly sales representative for Acme Corp. Your goal is to introduce our new product and schedule a follow-up demo.\n\nStart by greeting the person warmly, confirm you're speaking with the right contact, then briefly explain our value proposition in 2-3 sentences.`}
                className="text-xs font-mono leading-relaxed resize-none min-h-[200px]"
              />
            </CardContent>
          </Card>

          {/* 4. First Message */}
          <Card className="rounded-2xl">
            <CardHeader className="border-b border-border pb-3.5">
              <SectionHeader icon={Sparkles} title="First Message" />
            </CardHeader>
            <CardContent className="pt-4 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Opening Line
              </Label>
              <Input
                type="text"
                value={form.firstMessage}
                onChange={(e) => setForm({ ...form, firstMessage: e.target.value })}
                placeholder="e.g. Hi, this is Alex from Acme Corp! How are you doing today?"
              />
              <p className="text-[11px] text-muted-foreground">
                The first thing the agent says when a call connects. Leave blank for user to speak first.
              </p>
            </CardContent>
          </Card>

          {/* 5. Voice & Style */}
          <Card className="rounded-2xl">
            <CardHeader className="border-b border-border pb-3.5">
              <SectionHeader icon={Globe} title="Voice & Style" />
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Voice + Language */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Voice
                  </Label>
                  <Select value={form.voice} onValueChange={(value) => setForm({ ...form, voice: value })}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_OPTIONS.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Language
                  </Label>
                  <Select value={form.language} onValueChange={(value) => setForm({ ...form, language: value })}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Temperature + Max Duration */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Temperature{' '}
                    <span className="ml-1 font-bold normal-case text-primary">
                      {form.temperature}
                    </span>
                  </Label>
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    value={[form.temperature]}
                    onValueChange={([value]) => setForm({ ...form, temperature: value })}
                    className="mt-3"
                  />
                  <div className="flex justify-between text-[10px] mt-1 text-muted-foreground">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Max Duration (seconds)
                  </Label>
                  <div className="relative mt-1.5">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      value={form.maxDuration}
                      onChange={(e) => setForm({ ...form, maxDuration: parseInt(e.target.value) || 300 })}
                      min={30}
                      max={3600}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-[10px] mt-1 text-muted-foreground">
                    {Math.floor(form.maxDuration / 60)}m {form.maxDuration % 60}s max call length
                  </p>
                </div>
              </div>

              {/* Interruption Sensitivity */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Interruption Sensitivity{' '}
                  <span className="ml-1 font-bold normal-case text-primary">
                    {form.interruptionSensitivity}
                  </span>
                </Label>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[form.interruptionSensitivity]}
                  onValueChange={([value]) => setForm({ ...form, interruptionSensitivity: value })}
                  className="mt-3"
                />
                <div className="flex justify-between text-[10px] mt-1 text-muted-foreground">
                  <span>Low (harder to interrupt)</span>
                  <span>High (easy to interrupt)</span>
                </div>
              </div>

              {/* Backchannel */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    Backchannel Responses
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enable affirmations like &quot;mhm&quot;, &quot;I see&quot; while listening
                  </p>
                </div>
                <Switch
                  checked={form.backchannel}
                  onCheckedChange={(checked) => setForm({ ...form, backchannel: checked })}
                />
              </div>

              {/* Ambient Sound */}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ambient Sound
                </Label>
                <Select value={form.ambientSound || 'none'} onValueChange={(value) => setForm({ ...form, ambientSound: value === 'none' ? '' : value })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AMBIENT_SOUNDS.map((s) => (
                      <SelectItem key={s.value || 'none'} value={s.value || 'none'}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] mt-1.5 text-muted-foreground">
                  Background ambience during calls
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 6. Knowledge Base */}
          <Card className="rounded-2xl">
            <CardHeader className="border-b border-border pb-3.5">
              <SectionHeader icon={Database} title="Knowledge Base" />
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="rounded-xl px-4 py-3 text-xs bg-secondary/50 border border-secondary text-muted-foreground">
                Documents can be added from the agent detail page after creation.
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    Include knowledge base documents
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Agent will use synced documents to answer questions
                  </p>
                </div>
                <Switch
                  checked={form.useKnowledgeBase}
                  onCheckedChange={(checked) => setForm({ ...form, useKnowledgeBase: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* 7. Advanced — collapsed by default */}
          <Card className="rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 transition-all duration-150 bg-card"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10">
                  <Thermometer className="w-3.5 h-3.5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">Advanced</h3>
                <span className="text-[10px] text-muted-foreground">
                  Evaluation criteria &amp; data collection
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${advancedOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {advancedOpen && (
              <CardContent className="border-t border-border space-y-4 pt-4">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Evaluation Criteria
                  </Label>
                  <Textarea
                    value={form.evaluationCriteria}
                    onChange={(e) => setForm({ ...form, evaluationCriteria: e.target.value })}
                    placeholder={'[\n  { "id": "booking", "name": "Appointment Booked", "description": "Did the agent successfully book an appointment?" },\n  { "id": "interest", "name": "Interest Level", "description": "How interested was the contact?" }\n]'}
                    rows={5}
                    className="mt-1.5 text-xs font-mono leading-relaxed resize-none"
                  />
                  <p className="text-[11px] mt-1.5 text-muted-foreground">
                    JSON array of success metrics to evaluate after each call. Leave blank to skip.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Data Collection Fields
                  </Label>
                  <Textarea
                    value={form.dataCollection}
                    onChange={(e) => setForm({ ...form, dataCollection: e.target.value })}
                    placeholder={'[\n  { "id": "name", "name": "Full Name", "description": "The contact\'s full name", "type": "string" },\n  { "id": "interest", "name": "Interest Level", "description": "1-5 scale", "type": "number" }\n]'}
                    rows={5}
                    className="mt-1.5 text-xs font-mono leading-relaxed resize-none"
                  />
                  <p className="text-[11px] mt-1.5 text-muted-foreground">
                    JSON array of structured data to extract from calls. Leave blank to skip.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {createAgent.isError && (
            <p className="text-sm rounded-xl px-4 py-3 bg-destructive/10 text-destructive border border-destructive/20">
              Failed to create agent. Please check your inputs and try again.
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              onClick={() => createAgent.mutate({ ...form, provider: 'ELEVENLABS' })}
              disabled={!isValid || createAgent.isPending}
            >
              {createAgent.isPending ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create Agent
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10">
        <Icon className="w-3.5 h-3.5 text-primary" />
      </div>
      <h3 className="font-semibold text-sm text-foreground">{title}</h3>
    </div>
  )
}
