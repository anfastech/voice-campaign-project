import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function checkCampaignCompletion(campaignId: string) {
  const remaining = await prisma.campaignContact.count({
    where: { campaignId, status: { in: ['PENDING', 'CALLING'] } },
  })
  if (remaining === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, callId, data } = body

    if (!callId) return NextResponse.json({ received: true })

    // Look up by any provider-specific call ID field
    const call = await prisma.call.findFirst({
      where: {
        OR: [
          { ultravoxCallId: callId },
          { vapiCallId: callId },
          { elevenLabsCallId: callId },
          { providerCallId: callId },
        ],
      },
      include: { campaign: true },
    })

    if (!call) {
      console.warn(`Webhook: no call found for callId=${callId}`)
      return NextResponse.json({ received: true })
    }

    if (event === 'call.started' || event === 'call_started') {
      await prisma.call.update({
        where: { id: call.id },
        data: { status: 'IN_PROGRESS', answeredAt: new Date() },
      })
    } else if (event === 'call.ended' || event === 'call_ended') {
      const isSuccess = data?.endReason === 'normal' || data?.endReason === 'completed'
      const duration = data?.durationSeconds || data?.duration || 0
      const cost = data?.costCents ? data.costCents / 100 : (data?.cost || 0)

      await prisma.call.update({
        where: { id: call.id },
        data: {
          status: isSuccess ? 'COMPLETED' : 'FAILED',
          duration,
          cost,
          transcript: data?.transcript || null,
          summary: data?.summary || null,
          endedAt: new Date(),
        },
      })

      if (call.campaignId) {
        await prisma.campaign.update({
          where: { id: call.campaignId },
          data: {
            completedCalls: { increment: 1 },
            ...(isSuccess ? { successfulCalls: { increment: 1 } } : { failedCalls: { increment: 1 } }),
            totalCost: { increment: cost },
            totalDuration: { increment: duration },
          },
        })

        await prisma.campaignContact.updateMany({
          where: { campaignId: call.campaignId, contactId: call.contactId, status: 'CALLING' },
          data: { status: isSuccess ? 'COMPLETED' : 'FAILED' },
        })

        await checkCampaignCompletion(call.campaignId)
      }
    } else if (event === 'call.failed' || event === 'call_failed') {
      await prisma.call.update({
        where: { id: call.id },
        data: {
          status: 'FAILED',
          errorMessage: data?.reason || 'Unknown failure',
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
          where: { campaignId: call.campaignId, contactId: call.contactId, status: 'CALLING' },
          data: { status: 'FAILED' },
        })

        await checkCampaignCompletion(call.campaignId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
