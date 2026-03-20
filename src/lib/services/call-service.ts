import { prisma } from '@/lib/prisma'

type CallStatus = 'INITIATED' | 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER' | 'BUSY' | 'CANCELLED'

export async function listCalls(params: {
  campaignId?: string
  status?: string
  agentId?: string
  page?: number
  limit?: number
}) {
  const { campaignId, status, agentId, page = 1, limit = 50 } = params

  const where = {
    ...(campaignId ? { campaignId } : {}),
    ...(status ? { status: status as CallStatus } : {}),
    ...(agentId ? { agentId } : {}),
  }

  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        contact: { select: { name: true, phoneNumber: true } },
        agent: { select: { name: true } },
        campaign: { select: { name: true } },
      },
    }),
    prisma.call.count({ where }),
  ])

  return { calls, total, page, limit, pages: Math.ceil(total / limit) }
}
