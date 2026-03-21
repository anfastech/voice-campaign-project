import type { AgentConfig, VoiceCallConfig, VoiceCallDetails, VoiceCallResult, VoiceProviderService } from './types'
import { getElevenLabsMcpClient } from '../mcp/elevenlabs-client'

// REST fallback for operations not supported by MCP
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
    const client = await getElevenLabsMcpClient()
    const voiceId = VOICE_ID_MAP[config.voice || 'rachel'] || VOICE_ID_MAP['rachel']

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

    if (!agentId) {
      throw new Error('Failed to create ElevenLabs agent via MCP: no agent_id returned')
    }

    return { providerAgentId: agentId }
  }

  async updateAgent(providerAgentId: string, config: Partial<AgentConfig>): Promise<void> {
    const conversationConfig: Record<string, unknown> = {}

    if (config.systemPrompt || config.firstMessage || config.language) {
      conversationConfig.agent = {
        ...(config.systemPrompt ? { prompt: { prompt: config.systemPrompt } } : {}),
        ...(config.firstMessage ? { first_message: config.firstMessage } : {}),
        ...(config.language ? { language: config.language } : {}),
      }
    }
    if (config.voice) {
      const voiceId = VOICE_ID_MAP[config.voice] || config.voice
      conversationConfig.tts = { voice_id: voiceId }
    }
    if (config.maxDuration) {
      conversationConfig.conversation = { max_duration_seconds: config.maxDuration }
    }

    await elFetch(`/convai/agents/${providerAgentId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        conversation_config: conversationConfig,
        ...(config.name ? { name: config.name } : {}),
      }),
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
    const client = await getElevenLabsMcpClient()
    let agentId = config.providerAgentId

    if (!agentId) {
      // Fallback: create throwaway agent (backward compat)
      const voiceId = VOICE_ID_MAP[config.voice || 'rachel'] || VOICE_ID_MAP['rachel']
      const agentResult = await client.callTool({
        name: 'create_agent',
        arguments: {
          name: `Campaign Agent ${Date.now()}`,
          system_prompt: config.systemPrompt,
          first_message: 'Hello! How are you doing today?',
          language: 'en',
          voice_id: voiceId,
          max_duration_seconds: config.maxDuration || 300,
        },
      })

      const agentData = parseJsonContent(agentResult)
      agentId = (agentData.agent_id as string) || extractTextContent(agentResult)

      if (!agentId) {
        throw new Error('Failed to create ElevenLabs agent via MCP: no agent_id returned')
      }
    }

    // Make outbound call via MCP
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
}

export const elevenLabsMcpProvider = new ElevenLabsMcpProvider()
