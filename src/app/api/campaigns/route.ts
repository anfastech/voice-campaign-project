import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const campaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  agentId: z.string(),
  contactIds: z.array(z.string()),
  scheduledAt: z.string().datetime().optional(),
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryDelayMinutes: z.number().int().min(1).max(1440).default(60),
  callsPerMinute: z.number().int().min(1).max(60).default(5),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where = {
      userId: 'default-user',
      ...(status ? { status: status as 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'SCHEDULED' } : {}),
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          agent: { select: { id: true, name: true, voice: true } },
          _count: { select: { contacts: true, calls: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ])

    return NextResponse.json({ campaigns, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Campaigns GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = campaignSchema.parse(body)

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        agentId: data.agentId,
        userId: 'default-user',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        maxRetries: data.maxRetries,
        retryDelayMinutes: data.retryDelayMinutes,
        callsPerMinute: data.callsPerMinute,
        totalContacts: data.contactIds.length,
        status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        contacts: {
          create: data.contactIds.map((contactId) => ({ contactId })),
        },
      },
      include: {
        agent: true,
        _count: { select: { contacts: true } },
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Campaigns POST error:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
