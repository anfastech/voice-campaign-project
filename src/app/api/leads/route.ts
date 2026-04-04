import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { LeadStatus } from '@prisma/client'

const createLeadSchema = z.object({
  contactId: z.string(),
  agentId: z.string().optional(),
  callId: z.string().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  score: z.number().int().min(0).max(100).optional(),
  value: z.number().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const agentId = searchParams.get('agentId')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { userId: user.id }
    if (status) where.status = status as LeadStatus
    if (agentId) where.agentId = agentId
    if (search) {
      where.contact = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search } },
        ],
      }
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, phoneNumber: true } },
        agent: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('Leads GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user

    const body = await req.json()
    const data = createLeadSchema.parse(body)

    const lead = await prisma.lead.create({
      data: {
        ...data,
        tags: data.tags ?? [],
        userId: user.id,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Leads POST error:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}
