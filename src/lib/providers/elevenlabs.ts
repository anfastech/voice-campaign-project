import type { VoiceCallConfig, VoiceCallDetails, VoiceCallResult, VoiceProviderService } from './types'

const BASE_URL = 'https://api.elevenlabs.io/v1'

async function elFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`ElevenLabs API ${res.status}: ${text}`)
  }
  return res.json()
}

// Map our generic voice IDs to ElevenLabs voice IDs
const VOICE_ID_MAP: Record<string, string> = {
  rachel: '21m00Tcm4TlvDq8ikWAM',
  domi: 'AZnzlk1XvdvUeBnXmlld',
  bella: 'EXAVITQu4vr4xnSDxMaL',
  antoni: 'ErXwobaYiN019PkySvjV',
  josh: 'TxGEqnHWrfWFTfGW9XjX',
  arnold: 'VR6AewLTigWG4xSOukaG',
  adam: 'pNInz6obpgDQGcFmaJgB',
  sam: 'yoZ06aMxZJJ28mfd3POQ',
}

export class ElevenLabsProvider implements VoiceProviderService {
  readonly providerName = 'ELEVENLABS' as const

  /**
   * Create an ElevenLabs Conversational AI agent and initiate a conversation.
   * ElevenLabs supports outbound calling via their telephony integration.
   */
  async createCall(config: VoiceCallConfig): Promise<VoiceCallResult> {
    const voiceId = VOICE_ID_MAP[config.voice || 'rachel'] || VOICE_ID_MAP['rachel']

    // Create/register a conversation agent
    const agentData = await elFetch('/convai/agents', {
      method: 'POST',
      body: JSON.stringify({
        name: `Campaign Agent ${Date.now()}`,
        conversation_config: {
          agent: {
            prompt: { prompt: config.systemPrompt },
            first_message: 'Hello! How are you doing today?',
            language: 'en',
          },
          tts: { voice_id: voiceId },
          conversation: {
            max_duration_seconds: config.maxDuration || 300,
          },
        },
      }),
    })

    const agentId = agentData.agent_id

    // Initiate the outbound call via phone
    // ElevenLabs requires a phone number configured in their platform
    const callData = await elFetch(`/convai/conversations/outbound`, {
      method: 'POST',
      body: JSON.stringify({
        agent_id: agentId,
        agent_phone_number_id: process.env.ELEVENLABS_PHONE_NUMBER_ID || '',
        to_number: config.phoneNumber,
      }),
    })

    return {
      providerCallId: callData.conversation_id || agentId,
      status: 'INITIATED',
      provider: 'ELEVENLABS',
    }
  }

  async getCall(callId: string): Promise<VoiceCallDetails> {
    const data = await elFetch(`/convai/conversations/${callId}`)
    const statusMap: Record<string, string> = {
      processing: 'IN_PROGRESS',
      done: 'COMPLETED',
      failed: 'FAILED',
    }
    return {
      providerCallId: callId,
      status: statusMap[data.status] || data.status?.toUpperCase() || 'UNKNOWN',
      durationSeconds: data.metadata?.call_duration_secs,
      transcript: data.transcript
        ?.map((t: { role: string; message: string }) => `${t.role}: ${t.message}`)
        .join('\n'),
      endedAt: data.metadata?.end_time_unix_secs
        ? new Date(data.metadata.end_time_unix_secs * 1000).toISOString()
        : undefined,
    }
  }

  async getTranscript(callId: string): Promise<string | null> {
    try {
      const data = await elFetch(`/convai/conversations/${callId}`)
      if (!Array.isArray(data.transcript)) return null
      return data.transcript
        .map((t: { role: string; message: string }) => `${t.role}: ${t.message}`)
        .join('\n')
    } catch {
      return null
    }
  }
}

export const elevenLabsProvider = new ElevenLabsProvider()
