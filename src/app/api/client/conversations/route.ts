import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user
  if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const agentIds = await getClientAgentIds(user.id)
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = { agentId: { in: agentIds } }
  if (status && status !== 'ALL') where.status = status

  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true, phoneNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.call.count({ where }),
  ])

  return NextResponse.json({ calls, total, page, totalPages: Math.ceil(total / limit) })
}
