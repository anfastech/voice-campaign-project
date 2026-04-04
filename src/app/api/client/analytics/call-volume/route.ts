import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user
  if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const agentIds = await getClientAgentIds(user.id)
  if (agentIds.length === 0) {
    return NextResponse.json({ data: [] })
  }

  const { searchParams } = request.nextUrl
  const mode = searchParams.get('mode')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (mode === 'heatmap') {
    return NextResponse.json({ data: await getHeatmapData(agentIds, from, to) })
  }

  return NextResponse.json({ data: await getDailyVolume(agentIds, from, to) })
}

async function getDailyVolume(agentIds: string[], from: string | null, to: string | null) {
  let query = `
    SELECT
      DATE("startedAt") AS date,
      COUNT(*) FILTER (WHERE status = 'COMPLETED') AS successful,
      COUNT(*) FILTER (WHERE status = 'FAILED') AS failed,
      COUNT(*) FILTER (WHERE status = 'NO_ANSWER') AS "noAnswer",
      COUNT(*) AS total
    FROM "Call"
    WHERE "agentId" = ANY($1::text[])
  `
  const params: unknown[] = [agentIds]
  let paramIndex = 2

  if (from) {
    query += ` AND "startedAt" >= $${paramIndex}::timestamp`
    params.push(new Date(from))
    paramIndex++
  }
  if (to) {
    query += ` AND "startedAt" <= $${paramIndex}::timestamp`
    params.push(new Date(to))
    paramIndex++
  }

  query += ` GROUP BY DATE("startedAt") ORDER BY date ASC`

  const rows = await prisma.$queryRawUnsafe<
    { date: Date; successful: bigint; failed: bigint; noAnswer: bigint; total: bigint }[]
  >(query, ...params)

  return rows.map((r) => ({
    date: r.date.toISOString().split('T')[0],
    successful: Number(r.successful),
    failed: Number(r.failed),
    noAnswer: Number(r.noAnswer),
    total: Number(r.total),
  }))
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

async function getHeatmapData(agentIds: string[], from: string | null, to: string | null) {
  let query = `
    SELECT
      EXTRACT(DOW FROM "startedAt")::int AS "dayIndex",
      EXTRACT(HOUR FROM "startedAt")::int AS hour,
      COUNT(*) AS count
    FROM "Call"
    WHERE "agentId" = ANY($1::text[])
  `
  const params: unknown[] = [agentIds]
  let paramIndex = 2

  if (from) {
    query += ` AND "startedAt" >= $${paramIndex}::timestamp`
    params.push(new Date(from))
    paramIndex++
  }
  if (to) {
    query += ` AND "startedAt" <= $${paramIndex}::timestamp`
    params.push(new Date(to))
    paramIndex++
  }

  query += ` GROUP BY "dayIndex", hour ORDER BY "dayIndex", hour`

  const rows = await prisma.$queryRawUnsafe<
    { dayIndex: number; hour: number; count: bigint }[]
  >(query, ...params)

  return rows.map((r) => ({
    day: DAY_NAMES[r.dayIndex],
    dayIndex: r.dayIndex,
    hour: r.hour,
    count: Number(r.count),
  }))
}
