import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { createCampaign } from '@/lib/services/campaign-service'
import { processScheduledCampaigns } from '@/lib/services/scheduled-campaign-service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const campaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  agentId: z.string(),
  contactIds: z.array(z.string()),
  scheduledAt: z.string().datetime().optional(),
  autoStart: z.boolean().optional(),
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryDelayMinutes: z.number().int().min(1).max(1440).default(60),
  callsPerMinute: z.number().int().min(1).max(60).default(5),
})

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Auto-start any scheduled campaigns whose time has passed
    processScheduledCampaigns().catch((err) => console.error('Scheduled campaign check failed:', err))

    const agentIds = await getClientAgentIds(user.id)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { agentId: { in: agentIds } }
    if (status) where.status = status

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true } },
        _count: { select: { contacts: true, calls: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = campaigns.map(({ totalCost, ...c }) => ({
      ...c,
      totalContacts: c.totalContacts,
      completedCalls: c.completedCalls,
      successfulCalls: c.successfulCalls,
      failedCalls: c.failedCalls,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Client campaigns GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const agentIds = await getClientAgentIds(user.id)

    const body = await req.json()
    const data = campaignSchema.parse(body)

    if (!agentIds.includes(data.agentId)) {
      return NextResponse.json({ error: 'Agent not assigned to your account' }, { status: 403 })
    }

    // Verify all contacts belong to the admin user
    const contacts = await prisma.contact.findMany({
      where: { id: { in: data.contactIds }, userId: user.adminUserId! },
      select: { id: true },
    })

    if (contacts.length !== data.contactIds.length) {
      return NextResponse.json({ error: 'One or more contacts not found' }, { status: 400 })
    }

    const campaign = await createCampaign(user.adminUserId!, data)

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Client campaigns POST error:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
