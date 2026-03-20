import { prisma } from '@/lib/prisma'

export async function getStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalCalls,
    todayCalls,
    activeCampaigns,
    totalContacts,
    todaySuccessful,
    todayFailed,
    todayCostAgg,
    avgDurationAgg,
    recentCalls,
  ] = await Promise.all([
    prisma.call.count(),
    prisma.call.count({ where: { startedAt: { gte: today } } }),
    prisma.campaign.count({ where: { status: 'RUNNING' } }),
    prisma.contact.count(),
    prisma.call.count({
      where: { startedAt: { gte: today }, status: 'COMPLETED' },
    }),
    prisma.call.count({
      where: {
        startedAt: { gte: today },
        status: { in: ['FAILED', 'NO_ANSWER', 'BUSY'] },
      },
    }),
    prisma.call.aggregate({
      where: { startedAt: { gte: today } },
      _sum: { cost: true },
    }),
    prisma.call.aggregate({
      where: { status: 'COMPLETED', startedAt: { gte: today } },
      _avg: { duration: true },
    }),
    prisma.call.findMany({
      take: 10,
      orderBy: { startedAt: 'desc' },
      include: {
        contact: { select: { name: true, phoneNumber: true } },
        agent: { select: { name: true } },
        campaign: { select: { name: true } },
      },
    }),
  ])

  return {
    totalCalls,
    todayCalls,
    activeCampaigns,
    totalContacts,
    todaySuccessful,
    todayFailed,
    todayCost: todayCostAgg._sum.cost ?? 0,
    avgDuration: Math.round(avgDurationAgg._avg.duration ?? 0),
    recentCalls,
    successRate:
      todayCalls > 0
        ? Math.round((todaySuccessful / todayCalls) * 100)
        : 0,
  }
}

export async function getChartData() {
  const days = 7
  const labels: string[] = []
  const successful: number[] = []
  const failed: number[] = []

  for (let i = days - 1; i >= 0; i--) {
    const start = new Date()
    start.setDate(start.getDate() - i)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const dayLabel = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    labels.push(dayLabel)

    const [successCount, failCount] = await Promise.all([
      prisma.call.count({
        where: {
          startedAt: { gte: start, lt: end },
          status: 'COMPLETED',
        },
      }),
      prisma.call.count({
        where: {
          startedAt: { gte: start, lt: end },
          status: { in: ['FAILED', 'NO_ANSWER', 'BUSY'] },
        },
      }),
    ])

    successful.push(successCount)
    failed.push(failCount)
  }

  return { labels, successful, failed }
}

export async function getCampaignPerformance(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      _count: {
        select: {
          contacts: true,
          calls: true,
        },
      },
      agent: { select: { name: true, provider: true } },
    },
  })

  if (!campaign) {
    return null
  }

  // Get call stats grouped by status for this campaign
  const statusBreakdown = await prisma.call.groupBy({
    by: ['status'],
    where: { campaignId },
    _count: { id: true },
  })

  const durationAgg = await prisma.call.aggregate({
    where: { campaignId, status: 'COMPLETED' },
    _avg: { duration: true },
    _sum: { cost: true, duration: true },
  })

  const totalCalls = campaign._count.calls
  const completedCalls =
    statusBreakdown.find((s) => s.status === 'COMPLETED')?._count.id ?? 0
  const failedCalls = statusBreakdown
    .filter((s) => ['FAILED', 'NO_ANSWER', 'BUSY'].includes(s.status))
    .reduce((sum, s) => sum + s._count.id, 0)

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    agent: campaign.agent,
    totalContacts: campaign._count.contacts,
    totalCalls,
    completedCalls,
    failedCalls,
    successRate:
      totalCalls > 0
        ? Math.round((completedCalls / totalCalls) * 100)
        : 0,
    avgDuration: Math.round(durationAgg._avg.duration ?? 0),
    totalDuration: durationAgg._sum.duration ?? 0,
    totalCost: durationAgg._sum.cost ?? 0,
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s.status,
      count: s._count.id,
    })),
    startedAt: campaign.startedAt,
    completedAt: campaign.completedAt,
  }
}

export async function getCallAnalytics(params: {
  from?: string
  to?: string
  provider?: string
}) {
  const { from, to, provider } = params

  const dateFilter: Record<string, unknown> = {}
  if (from) dateFilter.gte = new Date(from)
  if (to) dateFilter.lte = new Date(to)

  const where: Record<string, unknown> = {}
  if (from || to) where.startedAt = dateFilter
  if (provider) {
    where.agent = { provider }
  }

  // Group calls by status within date range
  const statusDistribution = await prisma.call.groupBy({
    by: ['status'],
    where,
    _count: { id: true },
  })

  // Calculate average duration per status
  const durationByStatus = await prisma.call.groupBy({
    by: ['status'],
    where,
    _avg: { duration: true },
    _count: { id: true },
  })

  // Group by hour of day for call success patterns
  const allCalls = await prisma.call.findMany({
    where,
    select: {
      startedAt: true,
      status: true,
    },
  })

  const hourlyDistribution: Record<
    number,
    { total: number; successful: number }
  > = {}
  for (let h = 0; h < 24; h++) {
    hourlyDistribution[h] = { total: 0, successful: 0 }
  }

  for (const c of allCalls) {
    const hour = c.startedAt.getHours()
    hourlyDistribution[hour].total++
    if (c.status === 'COMPLETED') {
      hourlyDistribution[hour].successful++
    }
  }

  const hourlyData = Object.entries(hourlyDistribution).map(
    ([hour, data]) => ({
      hour: Number(hour),
      total: data.total,
      successful: data.successful,
      successRate:
        data.total > 0
          ? Math.round((data.successful / data.total) * 100)
          : 0,
    })
  )

  return {
    statusDistribution: statusDistribution.map((s) => ({
      status: s.status,
      count: s._count.id,
    })),
    durationByStatus: durationByStatus.map((s) => ({
      status: s.status,
      avgDuration: Math.round(s._avg.duration ?? 0),
      count: s._count.id,
    })),
    hourlyDistribution: hourlyData,
  }
}

export async function getCostBreakdown(params: {
  from?: string
  to?: string
  groupBy: 'provider' | 'campaign' | 'day'
}) {
  const { from, to, groupBy } = params

  const dateFilter: Record<string, unknown> = {}
  if (from) dateFilter.gte = new Date(from)
  if (to) dateFilter.lte = new Date(to)

  const where: Record<string, unknown> = {}
  if (from || to) where.startedAt = dateFilter

  if (groupBy === 'campaign') {
    const results = await prisma.call.groupBy({
      by: ['campaignId'],
      where: { ...where, campaignId: { not: null } },
      _sum: { cost: true },
      _count: { id: true },
    })

    // Fetch campaign names
    const campaignIds = results
      .map((r) => r.campaignId)
      .filter((id): id is string => id != null)

    const campaigns = await prisma.campaign.findMany({
      where: { id: { in: campaignIds } },
      select: { id: true, name: true },
    })

    const campaignMap = new Map(campaigns.map((c) => [c.id, c.name]))

    return results.map((r) => ({
      label: campaignMap.get(r.campaignId!) ?? 'Unknown',
      campaignId: r.campaignId,
      amount: r._sum.cost ?? 0,
      callCount: r._count.id,
    }))
  }

  if (groupBy === 'provider') {
    // Join through agent to get provider name
    const calls = await prisma.call.findMany({
      where,
      select: {
        cost: true,
        agent: { select: { provider: true } },
      },
    })

    const providerTotals: Record<
      string,
      { amount: number; callCount: number }
    > = {}

    for (const call of calls) {
      const provider = call.agent.provider
      if (!providerTotals[provider]) {
        providerTotals[provider] = { amount: 0, callCount: 0 }
      }
      providerTotals[provider].amount += call.cost ?? 0
      providerTotals[provider].callCount++
    }

    return Object.entries(providerTotals).map(([label, data]) => ({
      label,
      amount: Math.round(data.amount * 100) / 100,
      callCount: data.callCount,
    }))
  }

  // groupBy === 'day'
  const calls = await prisma.call.findMany({
    where,
    select: {
      cost: true,
      startedAt: true,
    },
    orderBy: { startedAt: 'asc' },
  })

  const dayTotals: Record<string, { amount: number; callCount: number }> = {}

  for (const call of calls) {
    const dayKey = call.startedAt.toISOString().slice(0, 10)
    if (!dayTotals[dayKey]) {
      dayTotals[dayKey] = { amount: 0, callCount: 0 }
    }
    dayTotals[dayKey].amount += call.cost ?? 0
    dayTotals[dayKey].callCount++
  }

  return Object.entries(dayTotals).map(([label, data]) => ({
    label,
    amount: Math.round(data.amount * 100) / 100,
    callCount: data.callCount,
  }))
}

export async function getSuccessRateByProvider() {
  // Get all providers that have calls
  const providers = await prisma.agent.findMany({
    where: {
      calls: { some: {} },
    },
    select: {
      provider: true,
    },
    distinct: ['provider'],
  })

  const results = await Promise.all(
    providers.map(async ({ provider }) => {
      const agentIds = (
        await prisma.agent.findMany({
          where: { provider },
          select: { id: true },
        })
      ).map((a) => a.id)

      const where = { agentId: { in: agentIds } }

      const [total, completed, failed, durationAgg, costAgg] =
        await Promise.all([
          prisma.call.count({ where }),
          prisma.call.count({
            where: { ...where, status: 'COMPLETED' },
          }),
          prisma.call.count({
            where: {
              ...where,
              status: { in: ['FAILED', 'NO_ANSWER', 'BUSY'] },
            },
          }),
          prisma.call.aggregate({
            where: { ...where, status: 'COMPLETED' },
            _avg: { duration: true },
          }),
          prisma.call.aggregate({
            where,
            _avg: { cost: true },
          }),
        ])

      return {
        provider,
        totalCalls: total,
        completed,
        failed,
        successRate:
          total > 0 ? Math.round((completed / total) * 100) : 0,
        avgDuration: Math.round(durationAgg._avg.duration ?? 0),
        avgCost:
          Math.round((costAgg._avg.cost ?? 0) * 100) / 100,
      }
    })
  )

  // Sort by success rate descending
  return results.sort((a, b) => b.successRate - a.successRate)
}
