import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getProvider } from '@/lib/providers'
import type { AgentConfig } from '@/lib/providers/types'
import type { VoiceProvider } from '@prisma/client'
import { z } from 'zod'
import { validateWebhookUrl } from '@/lib/utils/validate-webhook-url'

export async function listAgents() {
  const agents = await prisma.agent.findMany({
    where: { userId: 'default-user', isActive: true },
    include: {
      _count: { select: { calls: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return agents
}

export async function createAgent(data: {
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
}) {
  const { providerConfig, ...rest } = data

  const agent = await prisma.agent.create({
    data: {
      ...rest,
      userId: 'default-user',
      ...(providerConfig ? { providerConfig: providerConfig as Record<string, string> } : {}),
    },
  })

  // Sync to ElevenLabs
  try {
    const provider = getProvider(agent.provider)
    if (provider.createAgent) {
      const { providerAgentId } = await provider.createAgent({
        name: agent.name,
        systemPrompt: agent.systemPrompt,
        firstMessage: agent.firstMessage || undefined,
        voice: agent.voice,
        language: agent.language,
        maxDuration: agent.maxDuration,
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
      where: { userId: agent.userId, elevenLabsDocId: { not: null } },
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

  const agentConfig: AgentConfig = {
    name: agent.name,
    systemPrompt: agent.systemPrompt,
    firstMessage: agent.firstMessage || undefined,
    voice: agent.voice,
    language: agent.language,
    maxDuration: agent.maxDuration,
    knowledge_base: kbDocs.length > 0 ? kbDocs : undefined,
    tools: toolsConfig.length > 0 ? toolsConfig : undefined,
  }

  const provider = getProvider(agent.provider)

  if (agent.elevenLabsAgentId && provider.updateAgent) {
    await provider.updateAgent(agent.elevenLabsAgentId, agentConfig)
    return { status: 'updated', providerAgentId: agent.elevenLabsAgentId }
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
  "systemPrompt": "detailed system prompt for the voice agent — include persona, tone, objectives, how to greet, handle objections, and end calls gracefully. Minimum 150 words.",
  "firstMessage": "the very first thing the agent says when the call connects — natural, warm, professional. 1-2 sentences.",
  "voice": "one of: rachel, domi, bella, antoni, josh, arnold, adam, sam (choose best match for the use case)",
  "language": "language code like en, es, fr, de",
  "temperature": 0.7
}`

export async function generateAgent(description: string) {
  if (!description?.trim()) {
    throw new Error('Description is required')
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

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
          content: `Generate a voice agent configuration for this use case:\n\n${description}`,
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
