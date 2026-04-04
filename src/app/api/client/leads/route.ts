import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const agentIds = await getClientAgentIds(user.id)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { agentId: { in: agentIds } }
    if (status) where.status = status

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
    console.error('Client leads GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

const createLeadSchema = z.object({
  contactId: z.string().min(1),
  agentId: z.string().optional(),
  callId: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Look up the admin userId this client belongs to
    const client = await prisma.client.findUnique({
      where: { id: user.id },
      select: { userId: true },
    })
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const body = await req.json()
    const { contactId, agentId, callId, notes } = createLeadSchema.parse(body)

    // Verify the contact belongs to the admin
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, userId: client.userId },
    })
    if (!contact) return NextResponse.json({ error: 'Contact not found' }, { status: 404 })

    const lead = await prisma.lead.create({
      data: {
        contactId,
        agentId,
        callId,
        notes,
        tags: [],
        userId: client.userId,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Client leads POST error:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
