import { prisma } from '@/lib/prisma'

type WorkflowEvent = 'call.completed' | 'call.failed' | 'call.no_answer' | 'campaign.completed'

interface CallEventPayload {
  callId: string
  status: string
  duration?: number
  cost?: number
  transcript?: string
  summary?: string
  contactId?: string
  contactName?: string
  contactPhone?: string
  agentId?: string
  agentName?: string
  campaignId?: string
  campaignName?: string
}

interface CampaignEventPayload {
  campaignId: string
  campaignName?: string
  agentId?: string
  agentName?: string
  totalContacts?: number
  completedCalls?: number
  successfulCalls?: number
}

/**
 * Execute all active workflows matching a given event trigger.
 * Called from call-status webhook and campaign completion logic.
 */
export async function executeWorkflows(
  userId: string,
  event: WorkflowEvent,
  payload: CallEventPayload | CampaignEventPayload,
) {
  try {
    const workflows = await prisma.workflow.findMany({
      where: {
        userId,
        trigger: event,
        isActive: true,
      },
    })

    if (workflows.length === 0) return

    const results = await Promise.allSettled(
      workflows.map((wf) => executeWorkflowActions(wf, event, payload))
    )

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === 'rejected') {
        console.error(`Workflow "${workflows[i].name}" (${workflows[i].id}) failed:`, result.reason)
      }
    }
  } catch (error) {
    console.error('Workflow engine error:', error)
  }
}

async function executeWorkflowActions(
  workflow: { id: string; name: string; actions: unknown },
  event: string,
  payload: CallEventPayload | CampaignEventPayload,
) {
  const actions = Array.isArray(workflow.actions) ? workflow.actions : []

  for (const action of actions) {
    switch (action.type) {
      case 'webhook':
        await executeWebhookAction(action, workflow, event, payload)
        break
      case 'tag_contact':
        await executeTagAction(action, payload)
        break
      case 'add_to_campaign':
        await executeAddToCampaignAction(action, payload)
        break
      default:
        console.warn(`Unknown workflow action type: ${action.type}`)
    }
  }
}

async function executeWebhookAction(
  action: { url?: string },
  workflow: { id: string; name: string },
  event: string,
  payload: CallEventPayload | CampaignEventPayload,
) {
  if (!action.url) return

  const body = {
    event,
    timestamp: new Date().toISOString(),
    workflow: { id: workflow.id, name: workflow.name },
    ...(isCallPayload(payload)
      ? {
          call: {
            id: payload.callId,
            status: payload.status,
            duration: payload.duration,
            cost: payload.cost,
            transcript: payload.transcript,
            summary: payload.summary,
          },
          contact: {
            id: payload.contactId,
            name: payload.contactName,
            phone: payload.contactPhone,
          },
          agent: { id: payload.agentId, name: payload.agentName },
          campaign: payload.campaignId
            ? { id: payload.campaignId, name: payload.campaignName }
            : null,
        }
      : {
          campaign: {
            id: payload.campaignId,
            name: payload.campaignName,
            totalContacts: payload.totalContacts,
            completedCalls: payload.completedCalls,
            successfulCalls: payload.successfulCalls,
          },
          agent: { id: payload.agentId, name: payload.agentName },
        }),
  }

  const res = await fetch(action.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    throw new Error(`Webhook failed: ${res.status} ${res.statusText}`)
  }
}

async function executeTagAction(
  action: { tag?: string },
  payload: CallEventPayload | CampaignEventPayload,
) {
  if (!action.tag || !isCallPayload(payload) || !payload.contactId) return

  const contact = await prisma.contact.findUnique({
    where: { id: payload.contactId },
    select: { tags: true },
  })

  if (!contact) return

  const currentTags = Array.isArray(contact.tags) ? contact.tags as string[] : []
  if (currentTags.includes(action.tag)) return

  await prisma.contact.update({
    where: { id: payload.contactId },
    data: { tags: [...currentTags, action.tag] },
  })
}

async function executeAddToCampaignAction(
  action: { campaignId?: string },
  payload: CallEventPayload | CampaignEventPayload,
) {
  if (!action.campaignId || !isCallPayload(payload) || !payload.contactId) return

  const campaign = await prisma.campaign.findUnique({
    where: { id: action.campaignId },
    select: { id: true, status: true },
  })

  if (!campaign || campaign.status === 'COMPLETED' || campaign.status === 'CANCELLED') return

  const existing = await prisma.campaignContact.findFirst({
    where: { campaignId: action.campaignId, contactId: payload.contactId },
  })

  if (existing) return

  await prisma.campaignContact.create({
    data: {
      campaignId: action.campaignId,
      contactId: payload.contactId,
    },
  })
}

function isCallPayload(p: CallEventPayload | CampaignEventPayload): p is CallEventPayload {
  return 'callId' in p
}

/**
 * Helper: map a call status to a workflow event name.
 */
export function callStatusToEvent(status: string): WorkflowEvent | null {
  switch (status) {
    case 'COMPLETED':
      return 'call.completed'
    case 'FAILED':
      return 'call.failed'
    case 'NO_ANSWER':
      return 'call.no_answer'
    default:
      return null
  }
}
