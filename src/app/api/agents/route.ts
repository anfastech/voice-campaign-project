import { NextRequest, NextResponse } from 'next/server'
import { listAgents, createAgent } from '@/lib/services/agent-service'
import { z } from 'zod'

const agentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  systemPrompt: z.string().min(1),
  firstMessage: z.string().optional(),
  provider: z.enum(['ULTRAVOX', 'ELEVENLABS', 'VAPI', 'LIVEKIT']).default('ULTRAVOX'),
  voice: z.string().default('Mark'),
  language: z.string().default('en'),
  temperature: z.number().min(0).max(1).default(0.7),
  maxDuration: z.number().int().min(30).max(3600).default(300),
  providerConfig: z.record(z.string(), z.any()).optional(),
})

export async function GET() {
  try {
    const agents = await listAgents()
    return NextResponse.json(agents)
  } catch (error) {
    console.error('Agents GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = agentSchema.parse(body)
    const agent = await createAgent(data)
    return NextResponse.json(agent, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Agents POST error:', error)
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 })
  }
}
