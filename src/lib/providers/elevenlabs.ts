import type { AgentConfig, VoiceCallConfig, VoiceCallDetails, VoiceCallResult, VoiceProviderService } from './types'

const BASE_URL = 'https://api.elevenlabs.io/v1'

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    pdf:      'application/pdf',
    epub:     'application/epub+zip',
    docx:     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt:      'text/plain',
    html:     'text/html',
    htm:      'text/html',
    md:       'text/markdown',
    markdown: 'text/markdown',
  }
  return map[ext] ?? 'application/octet-stream'
}

function parseElError(text: string, status: number): string {
  try {
    const json = JSON.parse(text)
    const detail = json.detail
    if (typeof detail === 'string') return detail
    if (typeof detail === 'object' && detail?.message) return detail.message
    if (typeof detail === 'object') return JSON.stringify(detail)
  } catch {/* not JSON */}
  return `ElevenLabs API error ${status}`
}

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
    throw new Error(parseElError(text, res.status))
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

function getWebhookUrl(): string | null {
  const base = process.env.APP_URL || process.env.NEXTAUTH_URL
  if (!base) return null
  return `${base.replace(/\/$/, '')}/api/webhooks/elevenlabs`
}

export class ElevenLabsProvider implements VoiceProviderService {
  readonly providerName = 'ELEVENLABS' as const

  async createAgent(config: AgentConfig): Promise<{ providerAgentId: string }> {
    const voiceId = VOICE_ID_MAP[config.voice || 'rachel'] || VOICE_ID_MAP['rachel']
    const webhookUrl = getWebhookUrl()

    const agentData = await elFetch('/convai/agents/create', {
      method: 'POST',
      body: JSON.stringify({
        name: config.name,
        conversation_config: {
          agent: {
            prompt: { prompt: config.systemPrompt },
            first_message: config.firstMessage || 'Hello! How are you doing today?',
            language: config.language || 'en',
            ...(config.knowledge_base?.length ? { knowledge_base: config.knowledge_base } : {}),
          },
          tts: { voice_id: voiceId },
          conversation: {
            max_duration_seconds: config.maxDuration || 300,
          },
        },
        ...(config.tools?.length ? { tools: config.tools } : {}),
        ...(webhookUrl
          ? { platform_settings: { webhook: { url: webhookUrl } } }
          : {}),
      }),
    })

    return { providerAgentId: agentData.agent_id }
  }

  async updateAgent(providerAgentId: string, config: Partial<AgentConfig>): Promise<void> {
    const conversationConfig: Record<string, unknown> = {}

    if (config.systemPrompt || config.firstMessage || config.language || config.knowledge_base !== undefined) {
      conversationConfig.agent = {
        ...(config.systemPrompt ? { prompt: { prompt: config.systemPrompt } } : {}),
        ...(config.firstMessage ? { first_message: config.firstMessage } : {}),
        ...(config.language ? { language: config.language } : {}),
        ...(config.knowledge_base !== undefined ? { knowledge_base: config.knowledge_base } : {}),
      }
    }
    if (config.voice) {
      const voiceId = VOICE_ID_MAP[config.voice] || config.voice
      conversationConfig.tts = { voice_id: voiceId }
    }
    if (config.maxDuration) {
      conversationConfig.conversation = { max_duration_seconds: config.maxDuration }
    }

    const webhookUrl = getWebhookUrl()
    const body: Record<string, unknown> = {
      ...(Object.keys(conversationConfig).length > 0 ? { conversation_config: conversationConfig } : {}),
      ...(config.name ? { name: config.name } : {}),
      ...(config.tools !== undefined ? { tools: config.tools } : {}),
      ...(webhookUrl
        ? { platform_settings: { webhook: { url: webhookUrl } } }
        : {}),
    }

    await elFetch(`/convai/agents/${providerAgentId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  async deleteAgent(providerAgentId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/convai/agents/${providerAgentId}`, {
      method: 'DELETE',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`ElevenLabs API ${res.status}: ${text}`)
    }
  }

  async createCall(config: VoiceCallConfig): Promise<VoiceCallResult> {
    let agentId = config.providerAgentId

    if (!agentId) {
      // Fallback: create throwaway agent (backward compat)
      const voiceId = VOICE_ID_MAP[config.voice || 'rachel'] || VOICE_ID_MAP['rachel']
      const agentData = await elFetch('/convai/agents/create', {
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
      agentId = agentData.agent_id
    }

    const callData = await elFetch(`/convai/twilio/outbound-call`, {
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
      hasAudio: data.has_audio === true,
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

  // Returns the raw Response for streaming — must NOT use elFetch (which calls .json())
  async getConversationAudio(conversationId: string): Promise<Response> {
    const res = await fetch(`${BASE_URL}/convai/conversations/${conversationId}/audio`, {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`ElevenLabs API ${res.status}: ${text}`)
    }
    return res
  }

  // -------------------------------------------------------------------------
  // Knowledge Base
  // -------------------------------------------------------------------------

  async createKBFolder(name: string): Promise<string> {
    const data = await elFetch('/convai/knowledge-base/folder', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
    return data.id as string
  }

  async uploadKBText(name: string, text: string, parentFolderId?: string): Promise<string> {
    const data = await elFetch('/convai/knowledge-base/text', {
      method: 'POST',
      body: JSON.stringify({ name, text, ...(parentFolderId ? { parent_folder_id: parentFolderId } : {}) }),
    })
    return data.id as string
  }

  async uploadKBUrl(name: string, url: string, parentFolderId?: string): Promise<string> {
    const data = await elFetch('/convai/knowledge-base/url', {
      method: 'POST',
      body: JSON.stringify({ name, url, ...(parentFolderId ? { parent_folder_id: parentFolderId } : {}) }),
    })
    return data.id as string
  }

  async uploadKBFile(name: string, fileBuffer: Buffer, fileName: string, parentFolderId?: string): Promise<string> {
    const formData = new FormData()
    const ab = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer
    const mimeType = getMimeType(fileName)
    const blob = new Blob([ab], { type: mimeType })
    formData.append('file', blob, fileName)
    formData.append('name', name)
    if (parentFolderId) formData.append('parent_folder_id', parentFolderId)

    const res = await fetch(`${BASE_URL}/convai/knowledge-base/file`, {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' },
      body: formData,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(parseElError(text, res.status))
    }
    const data = await res.json()
    return data.id as string
  }

  async deleteKBDocument(documentId: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/convai/knowledge-base/${documentId}`, {
      method: 'DELETE',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || '' },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText)
      throw new Error(`ElevenLabs API ${res.status}: ${text}`)
    }
  }
}

export const elevenLabsProvider = new ElevenLabsProvider()
