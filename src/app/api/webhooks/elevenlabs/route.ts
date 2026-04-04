import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { applyCallOutcome, checkCampaignCompletion } from '@/lib/services/webhook-service'
import { generateCallSummary } from '@/lib/services/summary-service'
import { executeWorkflows, callStatusToEvent } from '@/lib/services/workflow-engine'

// ElevenLabs webhook signature format: "t=<timestamp>,v0=<hex>"
function verifySignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  try {
    const parts = Object.fromEntries(
      signatureHeader.split(',').map((p) => p.split('=') as [string, string])
    )
    const timestamp = parts['t']
    const receivedSig = parts['v0']
    if (!timestamp || !receivedSig) return false

    const signedPayload = `${timestamp}.${rawBody}`
    const expectedSig = createHmac('sha256', secret).update(signedPayload).digest('hex')

    return timingSafeEqual(Buffer.from(receivedSig, 'hex'), Buffer.from(expectedSig, 'hex'))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET

    // Verify signature if secret is configured
    if (secret) {
      const signatureHeader = req.headers.get('ElevenLabs-Signature') || ''
      if (!signatureHeader || !verifySignature(rawBody, signatureHeader, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Normalize ElevenLabs webhook payload
    // ElevenLabs sends conversation data after call ends
    const conversationId =
      (payload.conversation_id as string) ||
      (payload.data as Record<string, unknown>)?.conversation_id as string

    if (!conversationId) {
      // Not a conversation event — acknowledge and ignore
      return NextResponse.json({ received: true })
    }

    // Find the call in our DB
    const call = await prisma.call.findFirst({
      where: {
        OR: [
          { elevenLabsCallId: conversationId },
          { providerCallId: conversationId },
        ],
      },
    })

    if (!call) {
      return NextResponse.json({ received: true })
    }

    // Extract conversation data from payload
    const data = (payload.data as Record<string, unknown>) || payload

    const rawStatus = (data.status as string) || (payload.status as string) || ''
    const hasAudio = data.has_audio === true || payload.has_audio === true

    // Extract duration
    const metadata = (data.metadata as Record<string, unknown>) || {}
    const durationSeconds = typeof metadata.call_duration_secs === 'number'
      ? metadata.call_duration_secs
      : null

    // Extract transcript
    const rawTranscript = data.transcript || payload.transcript
    let transcript: string | null = null
    if (Array.isArray(rawTranscript)) {
      transcript = rawTranscript
        .map((t: { role: string; message: string }) => `${t.role}: ${t.message}`)
        .join('\n')
    } else if (typeof rawTranscript === 'string') {
      transcript = rawTranscript
    }

    // Map status to internal
    const statusMap: Record<string, string> = {
      done: 'COMPLETED',
      completed: 'COMPLETED',
      failed: 'FAILED',
      error: 'FAILED',
    }
    const mappedStatus = statusMap[rawStatus.toLowerCase()] || 'COMPLETED'

    // Determine if NO_ANSWER: very short duration
    const isNoAnswer = mappedStatus === 'FAILED' && durationSeconds != null && durationSeconds < 15
    const finalStatus = isNoAnswer ? 'NO_ANSWER' : mappedStatus as 'COMPLETED' | 'FAILED' | 'NO_ANSWER'

    await applyCallOutcome({
      callId: call.id,
      campaignId: call.campaignId,
      contactId: call.contactId,
      newStatus: finalStatus,
      duration: durationSeconds,
      transcript,
      endedAt: new Date(),
      recordingAvailable: hasAudio,
    })

    if (finalStatus === 'COMPLETED' && transcript) {
      generateCallSummary(call.id).catch((err) =>
        console.error('Summary generation failed for call', call.id, err)
      )
    }

    // Fire workflow engine for call events
    const workflowEvent = callStatusToEvent(finalStatus)
    if (workflowEvent) {
      const agent = call.agentId
        ? await prisma.agent.findUnique({ where: { id: call.agentId }, select: { name: true, userId: true } })
        : null
      const contact = call.contactId
        ? await prisma.contact.findUnique({ where: { id: call.contactId }, select: { name: true, phoneNumber: true } })
        : null
      const campaign = call.campaignId
        ? await prisma.campaign.findUnique({ where: { id: call.campaignId }, select: { name: true } })
        : null

      const userId = agent?.userId || ''
      if (userId) {
        executeWorkflows(userId, workflowEvent, {
          callId: call.id,
          status: finalStatus,
          duration: durationSeconds ?? undefined,
          transcript: transcript ?? undefined,
          contactId: call.contactId,
          contactName: contact?.name ?? undefined,
          contactPhone: contact?.phoneNumber ?? undefined,
          agentId: call.agentId ?? undefined,
          agentName: agent?.name ?? undefined,
          campaignId: call.campaignId ?? undefined,
          campaignName: campaign?.name ?? undefined,
        }).catch((err) => console.error('Workflow execution failed:', err))
      }
    }

    if (call.campaignId) {
      const result = await checkCampaignCompletion(call.campaignId)

      // Fire workflow for campaign completion
      if (result === 'completed') {
        const campaign = await prisma.campaign.findUnique({
          where: { id: call.campaignId },
          select: { name: true, userId: true, _count: { select: { contacts: true, calls: true } }, completedCalls: true, successfulCalls: true },
        })
        if (campaign) {
          executeWorkflows(campaign.userId, 'campaign.completed', {
            campaignId: call.campaignId,
            campaignName: campaign.name,
            totalContacts: campaign._count.contacts,
            completedCalls: campaign.completedCalls,
            successfulCalls: campaign.successfulCalls,
          }).catch((err) => console.error('Campaign workflow execution failed:', err))
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('ElevenLabs webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
