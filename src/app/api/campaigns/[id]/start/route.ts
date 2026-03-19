import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getProvider } from '@/lib/providers'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        agent: true,
        contacts: {
          where: { status: 'PENDING' },
          include: { contact: true },
        },
      },
    })

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    if (campaign.contacts.length === 0) {
      return NextResponse.json({ error: 'No pending contacts to call' }, { status: 400 })
    }

    await prisma.campaign.update({
      where: { id },
      data: { status: 'RUNNING', startedAt: new Date() },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agent = campaign.agent as any
    const provider = getProvider(agent.provider || 'ULTRAVOX')
    const batchSize = Math.min(campaign.callsPerMinute || 5, campaign.contacts.length)
    const batch = campaign.contacts.slice(0, batchSize)

    const results = await Promise.allSettled(
      batch.map(async (cc) => {
        try {
          const result = await provider.createCall({
            systemPrompt: agent.systemPrompt,
            voice: agent.voice,
            temperature: agent.temperature,
            maxDuration: agent.maxDuration,
            phoneNumber: cc.contact.phoneNumber,
            metadata: {
              name: cc.contact.name || cc.contact.phoneNumber,
              campaignId: campaign.id,
              contactId: cc.contactId,
            },
          })

          // Build provider-specific call ID fields
          const providerCallFields: Record<string, string> = {
            providerCallId: result.providerCallId,
          }
          if (result.provider === 'ULTRAVOX') providerCallFields.ultravoxCallId = result.providerCallId
          if (result.provider === 'ELEVENLABS') providerCallFields.elevenLabsCallId = result.providerCallId
          if (result.provider === 'VAPI') providerCallFields.vapiCallId = result.providerCallId

          await prisma.call.create({
            data: {
              campaignId: campaign.id,
              agentId: campaign.agentId,
              contactId: cc.contactId,
              phoneNumber: cc.contact.phoneNumber,
              status: 'INITIATED',
              ...providerCallFields,
            },
          })

          await prisma.campaignContact.update({
            where: { id: cc.id },
            data: {
              status: 'CALLING',
              attempts: { increment: 1 },
              lastAttempt: new Date(),
            },
          })

          return { success: true, phone: cc.contact.phoneNumber, callId: result.providerCallId }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          console.error(`Call failed for ${cc.contact.phoneNumber}:`, message)

          await prisma.campaignContact.update({
            where: { id: cc.id },
            data: { status: 'FAILED' },
          })

          return { success: false, phone: cc.contact.phoneNumber, error: message }
        }
      })
    )

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as { success: boolean }).success
    ).length
    const failed = results.length - successful

    await prisma.campaign.update({
      where: { id },
      data: {
        failedCalls: { increment: failed },
      },
    })

    // If all contacts in this batch failed immediately and there are no more
    // pending contacts, mark the campaign as completed.
    if (successful === 0) {
      const remainingPending = await prisma.campaignContact.count({
        where: { campaignId: id, status: 'PENDING' },
      })
      if (remainingPending === 0) {
        await prisma.campaign.update({
          where: { id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        })
      }
    }

    return NextResponse.json({
      message: 'Campaign started',
      provider: provider.providerName,
      callsInitiated: batch.length,
      successful,
      failed,
    })
  } catch (error) {
    console.error('Campaign start error:', error)
    return NextResponse.json({ error: 'Failed to start campaign' }, { status: 500 })
  }
}
