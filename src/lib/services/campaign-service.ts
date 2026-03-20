import { prisma } from '@/lib/prisma'
import { getProvider } from '@/lib/providers'

export async function listCampaigns(params: {
  status?: string
  page?: number
  limit?: number
}) {
  const { status, page = 1, limit = 50 } = params

  const where = {
    userId: 'default-user',
    ...(status
      ? { status: status as 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'SCHEDULED' }
      : {}),
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

export async function createCampaign(data: {
  name: string
  description?: string
  agentId: string
  contactIds: string[]
  scheduledAt?: string
  maxRetries?: number
  retryDelayMinutes?: number
  callsPerMinute?: number
}) {
  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      description: data.description,
      agentId: data.agentId,
      userId: 'default-user',
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      maxRetries: data.maxRetries ?? 3,
      retryDelayMinutes: data.retryDelayMinutes ?? 60,
      callsPerMinute: data.callsPerMinute ?? 5,
      totalContacts: data.contactIds.length,
      status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      contacts: {
        create: data.contactIds.map((contactId) => ({ contactId })),
      },
    },
    include: {
      agent: true,
      _count: { select: { contacts: true } },
    },
  })

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

export async function startCampaign(id: string) {
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

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  if (campaign.contacts.length === 0) {
    throw new Error('No pending contacts to call')
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

  return {
    provider: provider.providerName,
    callsInitiated: batch.length,
    successful,
    failed,
  }
}

export async function pauseCampaign(id: string) {
  const campaign = await prisma.campaign.update({
    where: { id },
    data: { status: 'PAUSED' },
  })

  return campaign
}
