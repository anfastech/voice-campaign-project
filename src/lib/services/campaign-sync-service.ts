import { prisma } from '@/lib/prisma'
import { getProvider } from '@/lib/providers'
import { applyCallOutcome, checkCampaignCompletion } from './webhook-service'
import { generateCallSummary } from './summary-service'

// In-memory lock to prevent concurrent syncs for the same campaign
const syncLocks = new Map<string, boolean>()

const STALE_CALL_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

export async function syncCampaignCalls(campaignId: string): Promise<{
  synced: number
  stillActive: number
  errors: number
  batchStarted: boolean
  campaignStatus: string
}> {
  // Guard: only sync RUNNING campaigns
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true, agent: { select: { provider: true } } },
  })

  if (!campaign || campaign.status !== 'RUNNING') {
    return {
      synced: 0,
      stillActive: 0,
      errors: 0,
      batchStarted: false,
      campaignStatus: campaign?.status ?? 'NOT_FOUND',
    }
  }

  // Prevent concurrent syncs
  if (syncLocks.get(campaignId)) {
    return {
      synced: 0,
      stillActive: 0,
      errors: 0,
      batchStarted: false,
      campaignStatus: campaign.status,
    }
  }

  syncLocks.set(campaignId, true)

  try {
    // Find active calls
    const activeCalls = await prisma.call.findMany({
      where: {
        campaignId,
        status: { in: ['INITIATED', 'IN_PROGRESS'] },
      },
    })

    if (activeCalls.length === 0) {
      // No active calls — check if campaign should advance
      const completionResult = await checkCampaignCompletion(campaignId)
      const updatedCampaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { status: true },
      })
      return {
        synced: 0,
        stillActive: 0,
        errors: 0,
        batchStarted: completionResult === 'continued',
        campaignStatus: updatedCampaign?.status ?? 'UNKNOWN',
      }
    }

    const provider = getProvider(campaign.agent.provider || 'ELEVENLABS')

    // Poll each call
    const pollResults = await Promise.allSettled(
      activeCalls.map(async (call) => {
        if (!call.providerCallId) {
          return { callId: call.id, changed: false }
        }

        // Check for stale INITIATED calls (>10 min)
        const callAge = Date.now() - new Date(call.startedAt).getTime()
        if (call.status === 'INITIATED' && callAge > STALE_CALL_TIMEOUT_MS) {
          await applyCallOutcome({
            callId: call.id,
            campaignId: call.campaignId,
            contactId: call.contactId,
            newStatus: 'FAILED',
            endedAt: new Date(),
            errorMessage: 'Call timed out',
          })
          return { callId: call.id, changed: true, newStatus: 'FAILED' }
        }

        // Poll provider
        const details = await provider.getCall(call.providerCallId)
        const providerStatus = details.status?.toUpperCase()

        // No change
        if (providerStatus === call.status || !providerStatus) {
          return { callId: call.id, changed: false }
        }

        // Apply status transitions
        if (providerStatus === 'COMPLETED') {
          await applyCallOutcome({
            callId: call.id,
            campaignId: call.campaignId,
            contactId: call.contactId,
            newStatus: 'COMPLETED',
            duration: details.durationSeconds ?? null,
            transcript: details.transcript ?? null,
            endedAt: details.endedAt ? new Date(details.endedAt) : new Date(),
            recordingAvailable: details.hasAudio === true,
          })
          if (details.transcript) {
            generateCallSummary(call.id).catch((err) =>
              console.error('Summary generation failed for call', call.id, err)
            )
          }
          return { callId: call.id, changed: true, newStatus: 'COMPLETED' }
        }

        if (providerStatus === 'FAILED') {
          // Check if NO_ANSWER: short duration
          const isNoAnswer = details.durationSeconds != null && details.durationSeconds < 15
          await applyCallOutcome({
            callId: call.id,
            campaignId: call.campaignId,
            contactId: call.contactId,
            newStatus: isNoAnswer ? 'NO_ANSWER' : 'FAILED',
            duration: details.durationSeconds ?? null,
            endedAt: details.endedAt ? new Date(details.endedAt) : new Date(),
            errorMessage: details.endReason ?? null,
          })
          return { callId: call.id, changed: true, newStatus: isNoAnswer ? 'NO_ANSWER' : 'FAILED' }
        }

        if (providerStatus === 'IN_PROGRESS' && call.status === 'INITIATED') {
          await applyCallOutcome({
            callId: call.id,
            campaignId: call.campaignId,
            contactId: call.contactId,
            newStatus: 'IN_PROGRESS',
            answeredAt: new Date(),
          })
          return { callId: call.id, changed: true, newStatus: 'IN_PROGRESS' }
        }

        return { callId: call.id, changed: false }
      })
    )

    let synced = 0
    let errors = 0
    let stillActive = 0

    for (const result of pollResults) {
      if (result.status === 'rejected') {
        errors++
        console.error('Sync poll error:', result.reason)
        continue
      }
      if (result.value.changed) {
        synced++
        const ns = result.value.newStatus
        if (ns === 'IN_PROGRESS' || ns === 'INITIATED') stillActive++
      } else {
        stillActive++
      }
    }

    // After processing all calls, check if campaign should advance
    let batchStarted = false
    if (synced > 0) {
      const completionResult = await checkCampaignCompletion(campaignId)
      batchStarted = completionResult === 'continued'
    }

    const updatedCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { status: true },
    })

    return {
      synced,
      stillActive,
      errors,
      batchStarted,
      campaignStatus: updatedCampaign?.status ?? 'UNKNOWN',
    }
  } finally {
    syncLocks.delete(campaignId)
  }
}
