import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const { id: clientId } = await params
    const agentIds = await getClientAgentIds(clientId)

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { agentId: { in: agentIds } }
    if (status && status !== 'ALL') where.status = status

    const leads = await prisma.lead.findMany({
      where,
      include: {
        contact: { select: { name: true, phoneNumber: true } },
        agent: { select: { name: true } },
      },
      orderBy: { convertedAt: 'desc' },
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('Client leads error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}
