export interface VoiceCallConfig {
  systemPrompt: string
  voice?: string
  temperature?: number
  maxDuration?: number
  phoneNumber: string // destination phone number
  fromNumber?: string // caller ID (if supported)
  metadata?: Record<string, string>
}

export interface VoiceCallResult {
  providerCallId: string
  joinUrl?: string        // for WebRTC/browser-based calls (Ultravox)
  clientSecret?: string   // for WebRTC auth (Ultravox)
  status: string
  provider: 'ULTRAVOX' | 'ELEVENLABS' | 'VAPI' | 'LIVEKIT'
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
}

export interface VoiceProviderService {
  readonly providerName: 'ULTRAVOX' | 'ELEVENLABS' | 'VAPI' | 'LIVEKIT'
  createCall(config: VoiceCallConfig): Promise<VoiceCallResult>
  getCall(callId: string): Promise<VoiceCallDetails>
  endCall?(callId: string): Promise<void>
  getTranscript?(callId: string): Promise<string | null>
}

// Voice options per provider
export const PROVIDER_VOICES: Record<string, { id: string; label: string }[]> = {
  LIVEKIT: [
    { id: 'alloy', label: 'Alloy (Neutral)' },
    { id: 'echo', label: 'Echo (Male)' },
    { id: 'fable', label: 'Fable (British)' },
    { id: 'onyx', label: 'Onyx (Male, Deep)' },
    { id: 'nova', label: 'Nova (Female)' },
    { id: 'shimmer', label: 'Shimmer (Female, Soft)' },
  ],
  ULTRAVOX: [
    { id: 'Mark', label: 'Mark (Male, American)' },
    { id: 'Alloy', label: 'Alloy (Neutral)' },
    { id: 'Echo', label: 'Echo (Male)' },
    { id: 'Fable', label: 'Fable (British)' },
    { id: 'Nova', label: 'Nova (Female)' },
    { id: 'Onyx', label: 'Onyx (Male, Deep)' },
    { id: 'Shimmer', label: 'Shimmer (Female, Soft)' },
  ],
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
  VAPI: [
    { id: 'jennifer-playht', label: 'Jennifer (Female, PlayHT)' },
    { id: 'matt-playht', label: 'Matt (Male, PlayHT)' },
    { id: 'rachel-11labs', label: 'Rachel (Female, ElevenLabs)' },
    { id: 'adam-11labs', label: 'Adam (Male, ElevenLabs)' },
    { id: 'nova-openai', label: 'Nova (Female, OpenAI)' },
    { id: 'onyx-openai', label: 'Onyx (Male, OpenAI)' },
    { id: 'shimmer-openai', label: 'Shimmer (Female, OpenAI)' },
  ],
}

export const PROVIDER_META: Record<string, { label: string; color: string; bg: string; description: string; supportsWebRTC?: boolean }> = {
  LIVEKIT: {
    label: 'LiveKit',
    color: 'oklch(0.6 0.19 220)',
    bg: 'oklch(0.6 0.19 220 / 10%)',
    description: 'Open-source WebRTC infrastructure for real-time AI voice agents',
    supportsWebRTC: true,
  },
  ULTRAVOX: {
    label: 'Ultravox',
    color: 'oklch(0.49 0.263 281)',
    bg: 'oklch(0.49 0.263 281 / 10%)',
    description: 'Real-time AI voice with WebRTC — great for browser-based calls',
    supportsWebRTC: true,
  },
  ELEVENLABS: {
    label: 'ElevenLabs',
    color: 'oklch(0.55 0.215 163)',
    bg: 'oklch(0.55 0.215 163 / 10%)',
    description: 'Hyper-realistic voice synthesis — industry-leading voice quality',
    supportsWebRTC: false,
  },
  VAPI: {
    label: 'VAPI',
    color: 'oklch(0.72 0.18 68)',
    bg: 'oklch(0.72 0.18 68 / 10%)',
    description: 'Full-featured voice AI platform with native PSTN outbound calling',
    supportsWebRTC: true,
  },
}
