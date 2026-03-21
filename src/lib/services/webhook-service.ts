import { prisma } from '@/lib/prisma'
import { startNextBatch } from './campaign-service'
import { generateCallSummary } from './summary-service'

// ---------------------------------------------------------------------------
// Shared helper: apply a call outcome to Call + CampaignContact + Campaign stats
// ---------------------------------------------------------------------------

export async function applyCallOutcome(params: {
  callId: string
  campaignId: string | null
  contactId: string
  newStatus: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'NO_ANSWER'
  duration?: number | null
  cost?: number | null
  transcript?: string | null
  summary?: string | null
  endedAt?: Date | null
  answeredAt?: Date | null
  errorMessage?: string | null
}) {
  const {
    callId, campaignId, contactId, newStatus,
    duration, cost, transcript, summary, endedAt, answeredAt, errorMessage,
  } = params

  // Update the Call record
  await prisma.call.update({
    where: { id: callId },
    data: {
      status: newStatus,
      ...(duration != null ? { duration } : {}),
      ...(cost != null ? { cost } : {}),
      ...(transcript != null ? { transcript } : {}),
      ...(summary != null ? { summary } : {}),
      ...(endedAt != null ? { endedAt } : {}),
      ...(answeredAt != null ? { answeredAt } : {}),
      ...(errorMessage != null ? { errorMessage } : {}),
    },
  })

  if (!campaignId) return

  // Update CampaignContact status (skip for IN_PROGRESS — contact stays CALLING)
  if (newStatus !== 'IN_PROGRESS') {
    await prisma.campaignContact.updateMany({
      where: { campaignId, contactId },
      data: { status: newStatus },
    })
  }

  // Update campaign aggregate stats (only for terminal statuses)
  if (newStatus === 'COMPLETED' || newStatus === 'FAILED' || newStatus === 'NO_ANSWER') {
    const isSuccess = newStatus === 'COMPLETED'
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        completedCalls: { increment: 1 },
        ...(isSuccess
          ? { successfulCalls: { increment: 1 } }
          : { failedCalls: { increment: 1 } }),
        ...(cost != null ? { totalCost: { increment: cost } } : {}),
        ...(duration != null ? { totalDuration: { increment: duration } } : {}),
      },
    })
  }
}

// ---------------------------------------------------------------------------
// Webhook event processor (for providers that push events)
// ---------------------------------------------------------------------------

export async function processCallEvent(event: {
  type: string
  callId: string
  data?: Record<string, unknown>
}) {
  const { type, callId, data } = event

  const call = await prisma.call.findFirst({
    where: {
      OR: [
        { ultravoxCallId: callId },
        { vapiCallId: callId },
        { elevenLabsCallId: callId },
        { providerCallId: callId },
      ],
    },
  })

  if (!call) {
    return { received: true }
  }

  switch (type) {
    case 'call.started':
    case 'call_started': {
      await applyCallOutcome({
        callId: call.id,
        campaignId: call.campaignId,
        contactId: call.contactId,
        newStatus: 'IN_PROGRESS',
        answeredAt: new Date(),
      })
      break
    }

    case 'call.ended':
    case 'call_ended': {
      const endReason = (data?.endReason as string) ?? ''
      const isSuccess = /normal|completed/i.test(endReason)

      const duration =
        typeof data?.duration === 'number'
          ? data.duration
          : typeof data?.durationSeconds === 'number'
            ? data.durationSeconds
            : null

      const isNoAnswer = !isSuccess && (
        (duration != null && duration < 15) ||
        /no.?answer|busy|rejected|timeout|not.?answered/i.test(endReason)
      )

      const cost =
        typeof data?.costCents === 'number'
          ? data.costCents / 100
          : typeof data?.cost === 'number'
            ? data.cost
            : null

      const transcript = (data?.transcript as string) ?? null
      const summary = (data?.summary as string) ?? null
      const callStatus = isSuccess ? 'COMPLETED' : isNoAnswer ? 'NO_ANSWER' : 'FAILED'

      await applyCallOutcome({
        callId: call.id,
        campaignId: call.campaignId,
        contactId: call.contactId,
        newStatus: callStatus,
        duration,
        cost,
        transcript,
        summary,
        endedAt: new Date(),
      })

      if (callStatus === 'COMPLETED' && transcript && !summary) {
        generateCallSummary(call.id).catch((err) =>
          console.error('Summary generation failed for call', call.id, err)
        )
      }

      if (call.campaignId) {
        await checkCampaignCompletion(call.campaignId)
      }
      break
    }

    case 'call.failed':
    case 'call_failed': {
      const errorMessage =
        (data?.error as string) ?? (data?.errorMessage as string) ?? 'Unknown error'

      const isNoAnswer = /no.?answer|busy|unavailable|timeout|rejected/i.test(errorMessage)
      const callStatus = isNoAnswer ? 'NO_ANSWER' : 'FAILED'

      await applyCallOutcome({
        callId: call.id,
        campaignId: call.campaignId,
        contactId: call.contactId,
        newStatus: callStatus,
        endedAt: new Date(),
        errorMessage,
      })

      if (call.campaignId) {
        await checkCampaignCompletion(call.campaignId)
      }
      break
    }
  }

  return { received: true }
}

// ---------------------------------------------------------------------------
// Campaign completion / batch continuation logic
// ---------------------------------------------------------------------------

export async function checkCampaignCompletion(
  campaignId: string
): Promise<'waiting' | 'continued' | 'paused' | 'completed'> {
  // 1. Any contacts still being called? → wait
  const callingContacts = await prisma.campaignContact.count({
    where: { campaignId, status: 'CALLING' },
  })

  if (callingContacts > 0) {
    return 'waiting'
  }

  // 2. Any PENDING contacts left? → start next batch
  const pendingContacts = await prisma.campaignContact.count({
    where: { campaignId, status: 'PENDING' },
  })

  if (pendingContacts > 0) {
    await startNextBatch(campaignId)
    return 'continued'
  }

  // 3. Any retryable NO_ANSWER contacts?
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { maxRetries: true },
  })

  if (!campaign) return 'completed'

  const retryable = await prisma.campaignContact.count({
    where: {
      campaignId,
      status: 'NO_ANSWER',
      attempts: { lt: campaign.maxRetries },
    },
  })

  if (retryable > 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'PAUSED' },
    })
    return 'paused'
  }

  // 4. All done
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: 'COMPLETED', completedAt: new Date() },
  })
  return 'completed'
}
