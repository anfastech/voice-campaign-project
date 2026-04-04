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
    return NextResponse.json([])
  }

  const { searchParams } = request.nextUrl
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = `
    SELECT
      DATE("startedAt") AS date,
      COALESCE(SUM(cost), 0) AS amount,
      COUNT(*) AS "callCount"
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
    { date: Date; amount: number; callCount: bigint }[]
  >(query, ...params)

  const data = rows.map((r) => ({
    label: r.date.toISOString().split('T')[0],
    amount: Number(r.amount),
    callCount: Number(r.callCount),
  }))

  return NextResponse.json(data)
}
