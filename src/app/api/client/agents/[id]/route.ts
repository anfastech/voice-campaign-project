import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { prisma } from '@/lib/prisma'
import { resolveDashboardConfig } from '@/lib/dashboard-config'
import { z } from 'zod'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const agentIds = await getClientAgentIds(user.id)
    if (!agentIds.includes(id)) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const agent = await prisma.agent.findUnique({
      where: { id },
      select: {
        id: true, name: true, description: true,
        systemPrompt: true, firstMessage: true,
        voice: true, language: true, temperature: true, maxDuration: true,
        isActive: true, createdAt: true,
        _count: { select: { calls: true, campaigns: true } },
      },
    })
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    return NextResponse.json(agent)
  } catch (error) {
    console.error('Client agent GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 })
  }
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  systemPrompt: z.string().min(1).optional(),
  firstMessage: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { id } = await params
    const agentIds = await getClientAgentIds(user.id)
    if (!agentIds.includes(id)) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Check if editSettings is enabled
    const client = await prisma.client.findUnique({
      where: { id: user.id },
      select: { dashboardConfig: true },
    })
    const config = resolveDashboardConfig(client?.dashboardConfig)
    if (!config.sections.agents.features.editSettings) {
      return NextResponse.json({ error: 'Editing not allowed' }, { status: 403 })
    }

    const body = await req.json()
    const data = updateSchema.parse(body)

    const agent = await prisma.agent.update({
      where: { id },
      data,
    })

    return NextResponse.json(agent)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Client agent PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}
