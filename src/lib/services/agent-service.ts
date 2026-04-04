import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getProvider } from '@/lib/providers'
import type { AgentConfig } from '@/lib/providers/types'
import type { VoiceProvider } from '@prisma/client'
import { z } from 'zod'
import { validateWebhookUrl } from '@/lib/utils/validate-webhook-url'

const KB_INSTRUCTION =
  `\n\nYou have access to a knowledge base of documents. When answering questions about specific information, facts, or details related to this conversation, always consult the knowledge base first and base your answers on the information found there. Prefer knowledge base content over general knowledge for any topic covered in the documents.`

const END_CALL_INSTRUCTION =
  `\n\n## Call Ending Rules
You have an end_call tool. You MUST use it to end the call in these situations:
- The user says goodbye, bye, thanks bye, ok bye, talk later, or any farewell — immediately say a brief goodbye and use end_call. Do NOT ask "is there anything else?" after a farewell.
- The user says "hang up", "end the call", "disconnect", "stop calling", or similar — use end_call immediately.
- The conversation objective has been achieved (lead qualified, information delivered, appointment booked, etc.) — wrap up briefly and use end_call.
- The user is not interested, says "no thanks", "not interested", "remove me" — politely acknowledge and use end_call.
- There is extended silence or the user is unresponsive after 2 attempts — say goodbye and use end_call.
- The user asks you to stop or is getting frustrated — apologize briefly and use end_call.
Never keep the call going after the user has indicated they want to end it. Be decisive about ending calls — a short, clean ending is better than lingering.`

function withKbInstruction(systemPrompt: string): string {
  if (systemPrompt.toLowerCase().includes('knowledge base')) return systemPrompt
  return systemPrompt + KB_INSTRUCTION
}

function withEndCallInstruction(systemPrompt: string): string {
  if (systemPrompt.toLowerCase().includes('end_call')) return systemPrompt
  return systemPrompt + END_CALL_INSTRUCTION
}

export async function listAgents(userId: string) {
  const agents = await prisma.agent.findMany({
    where: { userId, isActive: true },
    include: {
      _count: { select: { calls: true, campaigns: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return agents
}

export async function createAgent(userId: string, data: {
  name: string
  description?: string
  systemPrompt: string
  firstMessage?: string
  provider?: VoiceProvider
  voice?: string
  language?: string
  temperature?: number
  maxDuration?: number
  providerConfig?: Record<string, unknown>
  useKnowledgeBase?: boolean
}) {
  const { providerConfig, ...rest } = data

  const agent = await prisma.agent.create({
    data: {
      ...rest,
      userId,
      ...(providerConfig ? { providerConfig: providerConfig as Record<string, string> } : {}),
    },
  })

  // Build knowledge_base config if enabled
  let kbDocs: Array<{ type: 'id'; id: string }> = []
  if (agent.useKnowledgeBase) {
    const docs = await prisma.knowledgeBaseDocument.findMany({
      where: { userId: agent.userId, agentId: agent.id, elevenLabsDocId: { not: null } },
      select: { elevenLabsDocId: true },
    })
    kbDocs = docs
      .filter((d) => d.elevenLabsDocId != null)
      .map((d) => ({ type: 'id' as const, id: d.elevenLabsDocId! }))
  }

  // Sync to ElevenLabs
  try {
    const provider = getProvider(agent.provider)
    if (provider.createAgent) {
      let effectivePrompt = withEndCallInstruction(agent.systemPrompt)
      if (agent.useKnowledgeBase && kbDocs.length > 0) {
        effectivePrompt = withKbInstruction(effectivePrompt)
      }
      const { providerAgentId } = await provider.createAgent({
        name: agent.name,
        systemPrompt: effectivePrompt,
        firstMessage: agent.firstMessage || undefined,
        voice: agent.voice,
        language: agent.language,
        maxDuration: agent.maxDuration,
        knowledge_base: kbDocs.length > 0 ? kbDocs : undefined,
      })
      await prisma.agent.update({
        where: { id: agent.id },
        data: { elevenLabsAgentId: providerAgentId },
      })
      return { ...agent, elevenLabsAgentId: providerAgentId }
    }
  } catch (err) {
    console.error('Failed to sync agent to provider:', err)
    const syncError = err instanceof Error ? err.message : 'Unknown sync error'
    return { ...agent, syncStatus: 'failed' as const, syncError }
  }

  return agent
}

export async function getAgent(id: string) {
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      _count: { select: { calls: true, campaigns: true } },
      calls: {
        orderBy: { startedAt: 'desc' },
        take: 20,
        include: { contact: { select: { name: true, phoneNumber: true } } },
      },
      tools: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!agent) {
    throw new Error('Agent not found')
  }

  return agent
}

// Fields that map to ElevenLabs agent config
const SYNC_FIELDS = ['name', 'systemPrompt', 'firstMessage', 'voice', 'language', 'maxDuration'] as const

export async function updateAgent(id: string, data: Record<string, unknown>) {
  const existing = await prisma.agent.findUnique({ where: { id } })
  const agent = await prisma.agent.update({
    where: { id },
    data,
  })

  // Sync changed fields to ElevenLabs if agent is already registered
  if (existing?.elevenLabsAgentId) {
    const changedConfig: Partial<AgentConfig> = {}
    for (const field of SYNC_FIELDS) {
      if (field in data && data[field] !== (existing as Record<string, unknown>)[field]) {
        ;(changedConfig as Record<string, unknown>)[field] = data[field]
      }
    }

    // If useKnowledgeBase changed, force full KB sync on next syncAgent call
    if (Object.keys(changedConfig).length > 0) {
      try {
        const provider = getProvider(agent.provider)
        if (provider.updateAgent) {
          await provider.updateAgent(existing.elevenLabsAgentId, changedConfig)
        }
      } catch (err) {
        console.error('Failed to sync agent update to provider:', err)
      }
    }
  }

  return agent
}

export async function deleteAgent(id: string) {
  const existing = await prisma.agent.findUnique({ where: { id } })

  await prisma.agent.update({
    where: { id },
    data: { isActive: false },
  })

  // Delete from ElevenLabs if synced
  if (existing?.elevenLabsAgentId) {
    try {
      const provider = getProvider(existing.provider)
      if (provider.deleteAgent) {
        await provider.deleteAgent(existing.elevenLabsAgentId)
      }
    } catch (err) {
      console.error('Failed to delete agent from provider:', err)
    }
  }
}

export async function syncAgent(id: string) {
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: { tools: { where: { isActive: true } } },
  })
  if (!agent) throw new Error('Agent not found')

  // Build knowledge_base config
  let kbDocs: Array<{ type: 'id'; id: string }> = []
  if (agent.useKnowledgeBase) {
    const docs = await prisma.knowledgeBaseDocument.findMany({
      where: { userId: agent.userId, agentId: agent.id, elevenLabsDocId: { not: null } },
      select: { elevenLabsDocId: true },
    })
    kbDocs = docs
      .filter((d) => d.elevenLabsDocId != null)
      .map((d) => ({ type: 'id' as const, id: d.elevenLabsDocId! }))
  }

  // Build tools config
  const toolsConfig = agent.tools.map((tool) => ({
    type: 'webhook' as const,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters as Record<string, unknown>,
    url: tool.webhookUrl,
  }))

  let effectivePrompt = withEndCallInstruction(agent.systemPrompt)
  if (agent.useKnowledgeBase && kbDocs.length > 0) {
    effectivePrompt = withKbInstruction(effectivePrompt)
  }

  const agentConfig: AgentConfig = {
    name: agent.name,
    systemPrompt: effectivePrompt,
    firstMessage: agent.firstMessage || undefined,
    voice: agent.voice,
    language: agent.language,
    maxDuration: agent.maxDuration,
    knowledge_base: kbDocs.length > 0 ? kbDocs : undefined,
    tools: toolsConfig,
  }

  const provider = getProvider(agent.provider)

  if (agent.elevenLabsAgentId && provider.updateAgent) {
    try {
      await provider.updateAgent(agent.elevenLabsAgentId, agentConfig)
      return { status: 'updated', providerAgentId: agent.elevenLabsAgentId }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('404') && !msg.toLowerCase().includes('not found')) throw err
      // Stale agent ID — clear it and fall through to create
      await prisma.agent.update({ where: { id }, data: { elevenLabsAgentId: null } })
    }
  }

  if (provider.createAgent) {
    const { providerAgentId } = await provider.createAgent(agentConfig)
    await prisma.agent.update({
      where: { id },
      data: { elevenLabsAgentId: providerAgentId },
    })
    return { status: 'created', providerAgentId }
  }

  throw new Error('Provider does not support agent lifecycle')
}

// ---------------------------------------------------------------------------
// Agent Tool CRUD
// ---------------------------------------------------------------------------

const toolParametersSchema = z.object({
  type: z.literal('object'),
  properties: z.record(z.string(), z.unknown()),
})

export async function listAgentTools(agentId: string) {
  return prisma.agentTool.findMany({
    where: { agentId },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createAgentTool(agentId: string, data: {
  name: string
  description: string
  parameters: Record<string, unknown>
  webhookUrl: string
}) {
  const urlValidation = validateWebhookUrl(data.webhookUrl)
  if (!urlValidation.valid) throw new Error(urlValidation.error)

  const paramsResult = toolParametersSchema.safeParse(data.parameters)
  if (!paramsResult.success) {
    throw new Error('parameters must be a JSON Schema object with type "object" and properties')
  }

  return prisma.agentTool.create({ data: { agentId, ...data, parameters: data.parameters as Prisma.InputJsonValue } })
}

export async function updateAgentTool(toolId: string, data: Partial<{
  name: string
  description: string
  parameters: Record<string, unknown>
  webhookUrl: string
  isActive: boolean
}>) {
  if (data.webhookUrl !== undefined) {
    const urlValidation = validateWebhookUrl(data.webhookUrl)
    if (!urlValidation.valid) throw new Error(urlValidation.error)
  }

  if (data.parameters !== undefined) {
    const paramsResult = toolParametersSchema.safeParse(data.parameters)
    if (!paramsResult.success) {
      throw new Error('parameters must be a JSON Schema object with type "object" and properties')
    }
  }

  const { parameters, ...rest } = data
  return prisma.agentTool.update({
    where: { id: toolId },
    data: { ...rest, ...(parameters !== undefined ? { parameters: parameters as Prisma.InputJsonValue } : {}) },
  })
}

export async function deleteAgentTool(toolId: string) {
  await prisma.agentTool.delete({ where: { id: toolId } })
}

// ---------------------------------------------------------------------------
// AI Agent generation
// ---------------------------------------------------------------------------

const GENERATE_SYSTEM_PROMPT = `You are an expert voice AI agent configurator. Given a description of what a voice agent should do, you generate the perfect configuration.

Return ONLY a valid JSON object — no explanation, no markdown, no code blocks.

The JSON must have these exact fields:
{
  "name": "short catchy agent name (2-4 words)",
  "description": "1-2 sentence description of what this agent does",
  "systemPrompt": "detailed system prompt for the voice agent — include persona, tone, objectives, how to greet, handle objections, and end calls gracefully. MUST include instructions to use the end_call tool when: user says goodbye, objective is met, user is not interested, or user is unresponsive. Minimum 150 words.",
  "firstMessage": "the very first thing the agent says when the call connects — natural, warm, professional. 1-2 sentences.",
  "voice": "one of: rachel, domi, bella, antoni, josh, arnold, adam, sam (choose best match for the use case)",
  "language": "language code like en, es, fr, de",
  "temperature": 0.7
}`

export async function generateAgent(description: string, useKnowledgeBase?: boolean) {
  if (!description?.trim()) {
    throw new Error('Description is required')
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const userMessage = useKnowledgeBase
    ? `Generate a voice agent configuration for this use case:\n\n${description}\n\nIMPORTANT: This agent has access to a knowledge base of documents. The systemPrompt MUST instruct the agent to consult the knowledge base when answering questions about specific information, facts, or details. Reference knowledge base retrieval explicitly in the system prompt.`
    : `Generate a voice agent configuration for this use case:\n\n${description}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: GENERATE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Anthropic API error:', err)
    throw new Error('AI generation failed')
  }

  const data = await response.json()
  const text = data.content?.[0]?.text || ''

  // Parse JSON from the response, handling potential markdown code blocks
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let config: Record<string, unknown>
  try {
    config = JSON.parse(jsonStr)
  } catch {
    console.error('Failed to parse AI response:', text)
    throw new Error('Failed to parse AI response')
  }

  return config
}
