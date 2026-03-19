import type { VoiceCallConfig, VoiceCallDetails, VoiceCallResult, VoiceProviderService } from './types'

const BASE_URL = process.env.ULTRAVOX_BASE_URL || 'https://api.ultravox.ai/api'

async function ultravoxFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.ULTRAVOX_API_KEY || '',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Ultravox API ${res.status}: ${text}`)
  }
  return res.json()
}

export class UltravoxProvider implements VoiceProviderService {
  readonly providerName = 'ULTRAVOX' as const

  async createCall(config: VoiceCallConfig): Promise<VoiceCallResult> {
    // Ultravox creates a WebRTC session. For PSTN calls, use the Twilio medium.
    const body: Record<string, unknown> = {
      systemPrompt: config.systemPrompt,
      voice: config.voice || 'Mark',
      temperature: config.temperature ?? 0.7,
      maxDuration: `${config.maxDuration || 300}s`,
      model: 'fixie-ai/ultravox-70B',
    }

    // If Twilio credentials are present, use PSTN calling
    const twilioSid = process.env.TWILIO_ACCOUNT_SID
    const twilioToken = process.env.TWILIO_AUTH_TOKEN
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER

    if (twilioSid && twilioToken && twilioFrom && config.phoneNumber) {
      body.medium = {
        twilio: {
          phoneNumber: config.phoneNumber,
          from: config.fromNumber || twilioFrom,
          accountSid: twilioSid,
          authToken: twilioToken,
        },
      }
    }

    const data = await ultravoxFetch('/calls', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return {
      providerCallId: data.callId,
      joinUrl: data.joinUrl,
      clientSecret: data.clientSecret,
      status: data.status || 'INITIATED',
      provider: 'ULTRAVOX',
    }
  }

  async getCall(callId: string): Promise<VoiceCallDetails> {
    const data = await ultravoxFetch(`/calls/${callId}`)
    return {
      providerCallId: data.callId,
      status: data.status || 'UNKNOWN',
      durationSeconds: data.durationSeconds,
      costCents: data.costCents,
      transcript: data.transcript,
      summary: data.summary,
      recordingUrl: data.recordingUrl,
      endedAt: data.ended,
      endReason: data.endReason,
    }
  }

  async endCall(callId: string): Promise<void> {
    await ultravoxFetch(`/calls/${callId}`, { method: 'DELETE' })
  }

  async getTranscript(callId: string): Promise<string | null> {
    try {
      const data = await ultravoxFetch(`/calls/${callId}/messages`)
      if (!Array.isArray(data?.results)) return null
      return data.results
        .map((m: { role: string; text: string }) => `${m.role}: ${m.text}`)
        .join('\n')
    } catch {
      return null
    }
  }
}

export const ultravoxProvider = new UltravoxProvider()
