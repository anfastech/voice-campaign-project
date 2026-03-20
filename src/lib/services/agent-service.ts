import { prisma } from '@/lib/prisma'
import type { VoiceProvider } from '@prisma/client'

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
    },
  })

  if (!agent) {
    throw new Error('Agent not found')
  }

  return agent
}

export async function updateAgent(id: string, data: Record<string, unknown>) {
  const agent = await prisma.agent.update({
    where: { id },
    data,
  })

  return agent
}

export async function deleteAgent(id: string) {
  await prisma.agent.update({
    where: { id },
    data: { isActive: false },
  })
}

const GENERATE_SYSTEM_PROMPT = `You are an expert voice AI agent configurator. Given a description of what a voice agent should do, you generate the perfect configuration.

Return ONLY a valid JSON object — no explanation, no markdown, no code blocks.

The JSON must have these exact fields:
{
  "name": "short catchy agent name (2-4 words)",
  "description": "1-2 sentence description of what this agent does",
  "systemPrompt": "detailed system prompt for the voice agent — include persona, tone, objectives, how to greet, handle objections, and end calls gracefully. Minimum 150 words.",
  "firstMessage": "the very first thing the agent says when the call connects — natural, warm, professional. 1-2 sentences.",
  "voice": "one of: Mark, Alloy, Echo, Nova, Onyx, Shimmer (choose best match for the use case)",
  "language": "language code like en, es, fr, de",
  "temperature": 0.7,
  "suggestedProvider": "VAPI or ULTRAVOX or ELEVENLABS (choose based on use case)"
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
