import { prisma } from '@/lib/prisma'
import { getProvider } from '@/lib/providers'
import { syncAgent } from '@/lib/services/agent-service'
import { checkCampaignCompletion } from '@/lib/services/webhook-service'

export async function listCampaigns(userId: string, params: {
  status?: string
  agentId?: string
  page?: number
  limit?: number
}) {
  const { status, agentId, page = 1, limit = 50 } = params

  const where = {
    userId,
    ...(status
      ? { status: status as 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'SCHEDULED' }
      : {}),
    ...(agentId ? { agentId } : {}),
  }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true, voice: true } },
        _count: { select: { contacts: true, calls: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campaign.count({ where }),
  ])

  return { campaigns, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function createCampaign(userId: string, data: {
  name: string
  description?: string
  agentId: string
  contactIds: string[]
  scheduledAt?: string
  autoStart?: boolean
  maxRetries?: number
  retryDelayMinutes?: number
  callsPerMinute?: number
}) {
  const status = data.autoStart ? 'RUNNING' : data.scheduledAt ? 'SCHEDULED' : 'DRAFT'

  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      description: data.description,
      agentId: data.agentId,
      userId,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      maxRetries: data.maxRetries ?? 3,
      retryDelayMinutes: data.retryDelayMinutes ?? 60,
      callsPerMinute: data.callsPerMinute ?? 5,
      totalContacts: data.contactIds.length,
      status,
      startedAt: data.autoStart ? new Date() : undefined,
      contacts: {
        create: data.contactIds.map((contactId) => ({ contactId })),
      },
    },
    include: {
      agent: true,
      _count: { select: { contacts: true } },
    },
  })

  // Auto-start: kick off the first batch of calls
  if (data.autoStart) {
    try {
      await startNextBatch(campaign.id)
    } catch (err) {
      console.error('Auto-start batch error:', err)
    }
  }

  return campaign
}

export async function getCampaign(id: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      agent: true,
      contacts: {
        include: { contact: true },
        orderBy: { createdAt: 'asc' },
      },
      calls: {
        orderBy: { startedAt: 'desc' },
        take: 100,
        include: {
          contact: { select: { name: true, phoneNumber: true } },
        },
      },
    },
  })

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  return campaign
}

export async function updateCampaign(id: string, data: Record<string, unknown>) {
  const campaign = await prisma.campaign.update({
    where: { id },
    data,
    include: { agent: true },
  })

  return campaign
}

export async function deleteCampaign(id: string) {
  await prisma.campaign.delete({ where: { id } })
}

// ---------------------------------------------------------------------------
// Start next batch of calls for a RUNNING campaign
// ---------------------------------------------------------------------------

export async function startNextBatch(campaignId: string): Promise<{
  callsInitiated: number; successful: number; failed: number
} | null> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      agent: true,
      contacts: {
        where: { status: 'PENDING' },
        include: { contact: true },
      },
    },
  })

  if (!campaign || campaign.contacts.length === 0) return null

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
          providerAgentId: agent.elevenLabsAgentId || undefined,
          metadata: {
            name: cc.contact.name || cc.contact.phoneNumber,
            campaignId: campaign.id,
            contactId: cc.contactId,
          },
        })

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

  if (failed > 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { failedCalls: { increment: failed } },
    })
  }

  // If all contacts in this batch failed immediately, check completion
  if (successful === 0) {
    await checkCampaignCompletion(campaignId)
  }

  return { callsInitiated: batch.length, successful, failed }
}

// ---------------------------------------------------------------------------
// Start campaign (sets RUNNING + kicks off first batch)
// ---------------------------------------------------------------------------

export async function startCampaign(id: string) {
  const campaignCheck = await prisma.campaign.findUnique({
    where: { id },
    select: { status: true, maxRetries: true, startedAt: true },
  })

  if (!campaignCheck) {
    throw new Error('Campaign not found')
  }

  // On retry: reset retryable NO_ANSWER contacts back to PENDING
  if (campaignCheck.status === 'PAUSED') {
    await prisma.campaignContact.updateMany({
      where: {
        campaignId: id,
        status: 'NO_ANSWER',
        attempts: { lt: campaignCheck.maxRetries },
      },
      data: { status: 'PENDING' },
    })
  }

  // Verify there are pending contacts
  const pendingCount = await prisma.campaignContact.count({
    where: { campaignId: id, status: 'PENDING' },
  })

  if (pendingCount === 0) {
    throw new Error('No pending contacts to call')
  }

  // Ensure agent is synced to provider with latest config (end_call tool, webhook URL, etc.)
  const agent = await prisma.agent.findFirst({
    where: { campaigns: { some: { id } } },
    select: { id: true, provider: true, elevenLabsAgentId: true },
  })
  if (agent) {
    try {
      await syncAgent(agent.id)
    } catch (err) {
      console.error('Pre-start agent sync failed (continuing):', err instanceof Error ? err.message : err)
    }
  }

  await prisma.campaign.update({
    where: { id },
    data: { status: 'RUNNING', startedAt: campaignCheck.startedAt ?? new Date() },
  })

  const batchResult = await startNextBatch(id)
  const providerName = agent?.provider || 'ELEVENLABS'

  return {
    provider: providerName,
    callsInitiated: batchResult?.callsInitiated ?? 0,
    successful: batchResult?.successful ?? 0,
    failed: batchResult?.failed ?? 0,
  }
}

export async function pauseCampaign(id: string) {
  const campaign = await prisma.campaign.update({
    where: { id },
    data: { status: 'PAUSED' },
  })

  return campaign
}

// ---------------------------------------------------------------------------
// Cancel campaign
// ---------------------------------------------------------------------------

export async function cancelCampaign(id: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { status: true },
  })

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  if (campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED') {
    throw new Error('Campaign is already finished')
  }

  // Mark all PENDING/CALLING contacts as SKIPPED
  await prisma.campaignContact.updateMany({
    where: {
      campaignId: id,
      status: { in: ['PENDING', 'CALLING'] },
    },
    data: { status: 'SKIPPED' },
  })

  const updated = await prisma.campaign.update({
    where: { id },
    data: { status: 'CANCELLED', completedAt: new Date() },
    include: { agent: true },
  })

  return updated
}
