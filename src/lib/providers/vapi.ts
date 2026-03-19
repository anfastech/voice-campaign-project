import type { VoiceCallConfig, VoiceCallDetails, VoiceCallResult, VoiceProviderService } from './types'

const BASE_URL = 'https://api.vapi.ai'

async function vapiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VAPI_API_KEY || ''}`,
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`VAPI API ${res.status}: ${text}`)
  }
  return res.json()
}

// Map our generic voice IDs to VAPI voice configs
function resolveVapiVoice(voiceId: string): Record<string, unknown> {
  if (voiceId.endsWith('-11labs')) {
    const elevenLabsVoices: Record<string, string> = {
      'rachel-11labs': '21m00Tcm4TlvDq8ikWAM',
      'adam-11labs': 'pNInz6obpgDQGcFmaJgB',
    }
    return {
      provider: '11labs',
      voiceId: elevenLabsVoices[voiceId] || '21m00Tcm4TlvDq8ikWAM',
    }
  }
  if (voiceId.endsWith('-openai')) {
    const name = voiceId.replace('-openai', '')
    return { provider: 'openai', voice: name }
  }
  if (voiceId.endsWith('-playht')) {
    const playhtVoices: Record<string, string> = {
      'jennifer-playht': 'jennifer',
      'matt-playht': 'matt',
    }
    return { provider: 'playht', voice: playhtVoices[voiceId] || 'jennifer' }
  }
  // Default: OpenAI nova
  return { provider: 'openai', voice: 'nova' }
}

export class VapiProvider implements VoiceProviderService {
  readonly providerName = 'VAPI' as const

  /**
   * VAPI supports full outbound PSTN calling.
   * 1. Create an assistant with the given config
   * 2. Make a call using the assistant + phone number
   */
  async createCall(config: VoiceCallConfig): Promise<VoiceCallResult> {
    const voiceConfig = resolveVapiVoice(config.voice || 'nova-openai')

    // Create a transient assistant (or reuse one by assistantId from providerConfig)
    const assistant = await vapiFetch('/assistant', {
      method: 'POST',
      body: JSON.stringify({
        name: `Campaign Call ${Date.now()}`,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          systemPrompt: config.systemPrompt,
          temperature: config.temperature ?? 0.7,
        },
        voice: voiceConfig,
        firstMessage: 'Hello! How are you doing today?',
        maxDurationSeconds: config.maxDuration || 300,
        endCallFunctionEnabled: true,
        recordingEnabled: true,
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en',
        },
      }),
    })

    // Initiate the outbound call
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID || ''
    const call = await vapiFetch('/call', {
      method: 'POST',
      body: JSON.stringify({
        assistantId: assistant.id,
        customer: {
          number: config.phoneNumber,
          ...(config.metadata?.name ? { name: config.metadata.name } : {}),
        },
        ...(phoneNumberId ? { phoneNumberId } : {}),
      }),
    })

    return {
      providerCallId: call.id,
      status: call.status || 'INITIATED',
      provider: 'VAPI',
    }
  }

  async getCall(callId: string): Promise<VoiceCallDetails> {
    const data = await vapiFetch(`/call/${callId}`)

    const statusMap: Record<string, string> = {
      queued: 'INITIATED',
      ringing: 'RINGING',
      'in-progress': 'IN_PROGRESS',
      forwarding: 'IN_PROGRESS',
      ended: 'COMPLETED',
    }

    const endReasonMap: Record<string, string> = {
      'customer-did-not-answer': 'NO_ANSWER',
      'customer-busy': 'BUSY',
      'voicemail': 'NO_ANSWER',
      'customer-ended-call': 'COMPLETED',
      'assistant-ended-call': 'COMPLETED',
    }

    const finalStatus =
      data.endedReason && endReasonMap[data.endedReason]
        ? endReasonMap[data.endedReason]
        : statusMap[data.status] || 'UNKNOWN'

    return {
      providerCallId: callId,
      status: finalStatus,
      durationSeconds: data.endedAt && data.startedAt
        ? Math.round((new Date(data.endedAt).getTime() - new Date(data.startedAt).getTime()) / 1000)
        : undefined,
      costCents: data.cost ? Math.round(data.cost * 100) : undefined,
      transcript: data.transcript,
      summary: data.summary,
      recordingUrl: data.recordingUrl,
      endedAt: data.endedAt,
      endReason: data.endedReason,
    }
  }

  async endCall(callId: string): Promise<void> {
    await vapiFetch(`/call/${callId}`, { method: 'DELETE' })
  }

  async getTranscript(callId: string): Promise<string | null> {
    try {
      const data = await vapiFetch(`/call/${callId}`)
      return data.transcript || null
    } catch {
      return null
    }
  }
}

export const vapiProvider = new VapiProvider()
