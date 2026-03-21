import type { AgentConfig, VoiceCallConfig, VoiceCallDetails, VoiceCallResult, VoiceProviderService } from './types'
import { getElevenLabsMcpClient } from '../mcp/elevenlabs-client'

// REST fallback for operations not supported by MCP
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

function getWebhookUrl(): string | null {
  const base = process.env.APP_URL || process.env.NEXTAUTH_URL
  if (!base) return null
  return `${base.replace(/\/$/, '')}/api/webhooks/elevenlabs`
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
    throw new Error(`ElevenLabs API ${res.status}: ${text}`)
  }
  return res.json()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTextContent(result: any): string {
  const content = result?.content
  if (!Array.isArray(content)) return ''
  const textBlock = content.find((c: { type: string }) => c.type === 'text')
  return textBlock?.text || ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJsonContent(result: any): Record<string, unknown> {
  const text = extractTextContent(result)
  if (!text) {
    console.warn('MCP response had no text content:', JSON.stringify(result))
    return {}
  }
  try {
    return JSON.parse(text)
  } catch {
    // Try to extract JSON from a text response (e.g. "Created agent with id: {...}")
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {
        // fall through
      }
    }
    // Try to extract an agent_id from plain text like "agent_id: abc123"
    const idMatch = text.match(/agent_id[:\s]+([a-zA-Z0-9_-]+)/)
    if (idMatch) {
      return { agent_id: idMatch[1] }
    }
    console.warn('MCP response could not be parsed as JSON:', text)
    return {}
  }
}

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

export class ElevenLabsMcpProvider implements VoiceProviderService {
  readonly providerName = 'ELEVENLABS' as const

  async createAgent(config: AgentConfig): Promise<{ providerAgentId: string }> {
    const voiceId = VOICE_ID_MAP[config.voice || 'rachel'] || VOICE_ID_MAP['rachel']

    // Try MCP first, fall back to REST if connection fails
    try {
      const client = await getElevenLabsMcpClient()
      const agentResult = await client.callTool({
        name: 'create_agent',
        arguments: {
          name: config.name,
          system_prompt: config.systemPrompt,
          first_message: config.firstMessage || 'Hello! How are you doing today?',
          language: config.language || 'en',
          voice_id: voiceId,
          max_duration_seconds: config.maxDuration || 300,
        },
      })

      const agentData = parseJsonContent(agentResult)
      const agentId = (agentData.agent_id as string) || extractTextContent(agentResult)

      if (agentId) {
        return { providerAgentId: agentId }
      }
    } catch (err) {
      console.warn('MCP createAgent failed, falling back to REST:', err instanceof Error ? err.message : err)
    }

    // REST fallback
    const agentData = await elFetch('/convai/agents/create', {
      method: 'POST',
      body: JSON.stringify({
        name: config.name,
        conversation_config: {
          agent: {
            prompt: { prompt: config.systemPrompt },
            first_message: config.firstMessage || 'Hello! How are you doing today?',
            language: config.language || 'en',
          },
          tts: { voice_id: voiceId },
          conversation: {
            max_duration_seconds: config.maxDuration || 300,
          },
        },
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
      ...(webhookUrl ? { platform_settings: { webhook: { url: webhookUrl } } } : {}),
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
      const created = await this.createAgent({
        name: `Campaign Agent ${Date.now()}`,
        systemPrompt: config.systemPrompt,
        firstMessage: 'Hello! How are you doing today?',
        voice: config.voice || 'rachel',
        language: 'en',
        maxDuration: config.maxDuration || 300,
      })
      agentId = created.providerAgentId
    }

    // Try MCP first, fall back to REST
    try {
      const client = await getElevenLabsMcpClient()
      const callResult = await client.callTool({
        name: 'make_outbound_call',
        arguments: {
          agent_id: agentId,
          phone_number: config.phoneNumber,
          phone_number_id: process.env.ELEVENLABS_PHONE_NUMBER_ID || '',
        },
      })

      const callData = parseJsonContent(callResult)
      const conversationId = (callData.conversation_id as string) || agentId

      return {
        providerCallId: conversationId,
        status: 'INITIATED',
        provider: 'ELEVENLABS',
      }
    } catch (err) {
      console.warn('MCP createCall failed, falling back to REST:', err instanceof Error ? err.message : err)
    }

    // REST fallback
    const callData = await elFetch('/convai/twilio/outbound-call', {
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

  // REST fallback — MCP server doesn't expose getCall details
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
    // Try MCP first
    try {
      const client = await getElevenLabsMcpClient()
      const result = await client.callTool({
        name: 'get_transcript',
        arguments: { conversation_id: callId },
      })
      const text = extractTextContent(result)
      if (text) return text
    } catch {
      // Fall through to REST
    }

    // REST fallback
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
    try {
      const client = await getElevenLabsMcpClient()
      const result = await client.callTool({
        name: 'add_knowledge_base_document_from_text',
        arguments: { name, text },
      })
      const data = parseJsonContent(result)
      const docId = (data.id ?? data.document_id) as string
      if (docId) return docId
    } catch (err) {
      console.warn('MCP uploadKBText failed, falling back to REST:', err instanceof Error ? err.message : err)
    }

    const data = await elFetch('/convai/knowledge-base/text', {
      method: 'POST',
      body: JSON.stringify({ name, text, ...(parentFolderId ? { parent_folder_id: parentFolderId } : {}) }),
    })
    return data.id as string
  }

  async uploadKBUrl(name: string, url: string, parentFolderId?: string): Promise<string> {
    try {
      const client = await getElevenLabsMcpClient()
      const result = await client.callTool({
        name: 'add_knowledge_base_document_from_url',
        arguments: { name, url },
      })
      const data = parseJsonContent(result)
      const docId = (data.id ?? data.document_id) as string
      if (docId) return docId
    } catch (err) {
      console.warn('MCP uploadKBUrl failed, falling back to REST:', err instanceof Error ? err.message : err)
    }

    const data = await elFetch('/convai/knowledge-base/url', {
      method: 'POST',
      body: JSON.stringify({ name, url, ...(parentFolderId ? { parent_folder_id: parentFolderId } : {}) }),
    })
    return data.id as string
  }

  async uploadKBFile(name: string, fileBuffer: Buffer, fileName: string, parentFolderId?: string): Promise<string> {
    // Binary data can't be JSON-serialised for MCP — REST only
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
      throw new Error(`ElevenLabs API ${res.status}: ${text}`)
    }
    const data = await res.json()
    return data.id as string
  }

  async deleteKBDocument(documentId: string): Promise<void> {
    try {
      const client = await getElevenLabsMcpClient()
      await client.callTool({
        name: 'delete_knowledge_base_document',
        arguments: { document_id: documentId },
      })
      return
    } catch (err) {
      console.warn('MCP deleteKBDocument failed, falling back to REST:', err instanceof Error ? err.message : err)
    }

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

export const elevenLabsMcpProvider = new ElevenLabsMcpProvider()
