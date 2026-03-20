import { prisma } from '@/lib/prisma'

export async function processCallEvent(event: {
  type: string
  callId: string
  data?: Record<string, unknown>
}) {
  const { type, callId, data } = event

  // Look up call by callId across all provider ID fields
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
      await prisma.call.update({
        where: { id: call.id },
        data: {
          status: 'IN_PROGRESS',
          answeredAt: new Date(),
        },
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

      const cost =
        typeof data?.costCents === 'number'
          ? data.costCents / 100
          : typeof data?.cost === 'number'
            ? data.cost
            : null

      const transcript = (data?.transcript as string) ?? null
      const summary = (data?.summary as string) ?? null

      await prisma.call.update({
        where: { id: call.id },
        data: {
          status: isSuccess ? 'COMPLETED' : 'FAILED',
          duration,
          cost,
          transcript,
          summary,
          endedAt: new Date(),
        },
      })

      if (call.campaignId) {
        // Update campaign aggregate stats
        await prisma.campaign.update({
          where: { id: call.campaignId },
          data: {
            completedCalls: { increment: 1 },
            ...(isSuccess
              ? { successfulCalls: { increment: 1 } }
              : { failedCalls: { increment: 1 } }),
            ...(cost != null ? { totalCost: { increment: cost } } : {}),
            ...(duration != null ? { totalDuration: { increment: duration } } : {}),
          },
        })

        // Update CampaignContact status
        await prisma.campaignContact.updateMany({
          where: {
            campaignId: call.campaignId,
            contactId: call.contactId,
          },
          data: {
            status: isSuccess ? 'COMPLETED' : 'FAILED',
          },
        })

        await checkCampaignCompletion(call.campaignId)
      }
      break
    }

    case 'call.failed':
    case 'call_failed': {
      const errorMessage =
        (data?.error as string) ?? (data?.errorMessage as string) ?? 'Unknown error'

      await prisma.call.update({
        where: { id: call.id },
        data: {
          status: 'FAILED',
          errorMessage,
          endedAt: new Date(),
        },
      })

      if (call.campaignId) {
        await prisma.campaign.update({
          where: { id: call.campaignId },
          data: {
            completedCalls: { increment: 1 },
            failedCalls: { increment: 1 },
          },
        })

        await prisma.campaignContact.updateMany({
          where: {
            campaignId: call.campaignId,
            contactId: call.contactId,
          },
          data: {
            status: 'FAILED',
          },
        })

        await checkCampaignCompletion(call.campaignId)
      }
      break
    }
  }

  return { received: true }
}

async function checkCampaignCompletion(campaignId: string) {
  const remaining = await prisma.campaignContact.count({
    where: {
      campaignId,
      status: { in: ['PENDING', 'CALLING'] },
    },
  })

  if (remaining === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })
  }
}
