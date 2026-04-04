import { prisma } from '@/lib/prisma'
import { startCampaign } from '@/lib/services/campaign-service'

/**
 * Check and auto-start any SCHEDULED campaigns whose scheduledAt has passed.
 * Also cleans up stuck RUNNING/PAUSED campaigns with no real activity.
 * Safe to call frequently.
 */
export async function processScheduledCampaigns() {
  const now = new Date()

  // 1. Auto-start scheduled campaigns whose time has passed
  const scheduled = await prisma.campaign.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledAt: { lte: now },
    },
    select: { id: true, name: true },
  })

  let started = 0
  for (const campaign of scheduled) {
    try {
      await startCampaign(campaign.id)
      started++
      console.log(`Auto-started scheduled campaign: ${campaign.name} (${campaign.id})`)
    } catch (err) {
      console.error(`Failed to auto-start campaign ${campaign.id}:`, err instanceof Error ? err.message : err)
    }
  }

  // 2. Clean up stuck RUNNING campaigns that have been idle for 5+ minutes
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const stuckCampaigns = await prisma.campaign.findMany({
    where: {
      status: 'RUNNING',
      OR: [
        { startedAt: { lte: fiveMinAgo } },
        { startedAt: null, createdAt: { lte: fiveMinAgo } },
      ],
    },
    select: { id: true, name: true },
  })

  let cleaned = 0
  for (const campaign of stuckCampaigns) {
    // Reset stuck CALLING contacts (>5 min) to FAILED
    await prisma.campaignContact.updateMany({
      where: {
        campaignId: campaign.id,
        status: 'CALLING',
        updatedAt: { lte: fiveMinAgo },
      },
      data: { status: 'FAILED' },
    })

    // Check if there are any truly active calls in the Call table
    const activeCalls = await prisma.call.count({
      where: {
        campaignId: campaign.id,
        status: { in: ['INITIATED', 'IN_PROGRESS'] },
        createdAt: { gte: fiveMinAgo },
      },
    })

    if (activeCalls > 0) continue // Calls still in progress, skip

    // No active calls — mark remaining PENDING contacts as FAILED and complete campaign
    await prisma.campaignContact.updateMany({
      where: {
        campaignId: campaign.id,
        status: 'PENDING',
      },
      data: { status: 'FAILED' },
    })

    const stats = await prisma.campaignContact.groupBy({
      by: ['status'],
      where: { campaignId: campaign.id },
      _count: true,
    })

    const successful = stats.find((s) => s.status === 'COMPLETED')?._count ?? 0
    const failed = stats.find((s) => s.status === 'FAILED')?._count ?? 0
    const noAnswer = stats.find((s) => s.status === 'NO_ANSWER')?._count ?? 0

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completedCalls: successful + failed + noAnswer,
        successfulCalls: successful,
        failedCalls: failed,
      },
    })
    cleaned++
    console.log(`Cleaned up stuck campaign: ${campaign.name} (${campaign.id})`)
  }

  return { started, cleaned }
}
