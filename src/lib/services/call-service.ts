import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type CallStatus = 'INITIATED' | 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER' | 'BUSY' | 'CANCELLED'

export async function listCalls(params: {
  campaignId?: string
  status?: string
  agentId?: string
  search?: string
  from?: string
  to?: string
  minDuration?: number
  maxDuration?: number
  sentiment?: string
  tags?: string[]
  page?: number
  limit?: number
}) {
  const {
    campaignId, status, agentId, search, from, to,
    minDuration, maxDuration, sentiment, tags,
    page = 1, limit = 50,
  } = params

  const where: Prisma.CallWhereInput = {
    ...(campaignId ? { campaignId } : {}),
    ...(status ? { status: status as CallStatus } : {}),
    ...(agentId ? { agentId } : {}),
  }

  // Date range filter
  if (from || to) {
    where.startedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    }
  }

  // Duration range filter
  if (minDuration !== undefined || maxDuration !== undefined) {
    where.duration = {
      ...(minDuration !== undefined ? { gte: minDuration } : {}),
      ...(maxDuration !== undefined ? { lte: maxDuration } : {}),
    }
  }

  // Transcript search (ILIKE)
  if (search) {
    where.OR = [
      { transcript: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
      { contact: { name: { contains: search, mode: 'insensitive' } } },
      { phoneNumber: { contains: search } },
    ]
  }

  // Sentiment filter via metadata
  if (sentiment) {
    where.metadata = { path: ['sentiment'], equals: sentiment }
  }

  // Tags filter via metadata
  if (tags && tags.length > 0) {
    where.metadata = {
      ...((where.metadata as object) || {}),
      path: ['tags'],
      array_contains: tags,
    }
  }

  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        contact: { select: { name: true, phoneNumber: true, email: true, tags: true } },
        agent: { select: { name: true, provider: true } },
        campaign: { select: { name: true } },
      },
    }),
    prisma.call.count({ where }),
  ])

  return { calls, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function getCallById(id: string) {
  return prisma.call.findUnique({
    where: { id },
    include: {
      contact: { select: { id: true, name: true, phoneNumber: true, email: true, tags: true } },
      agent: { select: { id: true, name: true, provider: true } },
      campaign: { select: { id: true, name: true } },
    },
  })
}

export async function updateCallMetadata(id: string, metadata: Record<string, unknown>) {
  const call = await prisma.call.findUnique({ where: { id }, select: { metadata: true } })
  const existing = (call?.metadata as Record<string, unknown>) || {}
  return prisma.call.update({
    where: { id },
    data: { metadata: { ...existing, ...metadata } as any },
  })
}
