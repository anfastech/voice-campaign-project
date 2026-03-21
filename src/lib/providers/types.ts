export interface AgentConfig {
  name: string
  systemPrompt: string
  firstMessage?: string
  voice?: string
  language?: string
  maxDuration?: number
  knowledge_base?: Array<{ type: 'id'; id: string }>
  tools?: Array<{
    type: 'webhook'
    name: string
    description: string
    parameters: Record<string, unknown>
    url: string
  }>
}

export interface VoiceCallConfig {
  systemPrompt: string
  voice?: string
  temperature?: number
  maxDuration?: number
  phoneNumber: string // destination phone number
  fromNumber?: string // caller ID (if supported)
  providerAgentId?: string // reuse a persistent provider-side agent
  metadata?: Record<string, string>
}

export interface VoiceCallResult {
  providerCallId: string
  joinUrl?: string        // for WebRTC/browser-based calls
  clientSecret?: string   // for WebRTC auth
  status: string
  provider: string
}

export interface VoiceCallDetails {
  providerCallId: string
  status: string
  durationSeconds?: number
  costCents?: number
  transcript?: string
  summary?: string
  recordingUrl?: string
  endedAt?: string
  endReason?: string
  hasAudio?: boolean
}

export interface VoiceProviderService {
  readonly providerName: string
  createCall(config: VoiceCallConfig): Promise<VoiceCallResult>
  getCall(callId: string): Promise<VoiceCallDetails>
  endCall?(callId: string): Promise<void>
  getTranscript?(callId: string): Promise<string | null>
  // Agent lifecycle (optional — providers that support persistent agents implement these)
  createAgent?(config: AgentConfig): Promise<{ providerAgentId: string }>
  updateAgent?(providerAgentId: string, config: Partial<AgentConfig>): Promise<void>
  deleteAgent?(providerAgentId: string): Promise<void>
}

// Voice options per provider
export const PROVIDER_VOICES: Record<string, { id: string; label: string }[]> = {
  ELEVENLABS: [
    { id: 'rachel', label: 'Rachel (Female, American)' },
    { id: 'domi', label: 'Domi (Female, American)' },
    { id: 'bella', label: 'Bella (Female, American)' },
    { id: 'antoni', label: 'Antoni (Male, American)' },
    { id: 'josh', label: 'Josh (Male, American)' },
    { id: 'arnold', label: 'Arnold (Male, American)' },
    { id: 'adam', label: 'Adam (Male, American)' },
    { id: 'sam', label: 'Sam (Male, American)' },
  ],
}

export const PROVIDER_META: Record<string, { label: string; color: string; bg: string; description: string; supportsWebRTC?: boolean }> = {
  ELEVENLABS: {
    label: 'ElevenLabs',
    color: 'oklch(0.55 0.215 163)',
    bg: 'oklch(0.55 0.215 163 / 10%)',
    description: 'Hyper-realistic voice synthesis — industry-leading voice quality',
    supportsWebRTC: false,
  },
}
