import { prisma } from '@/lib/prisma'

const CALL_SUMMARY_SYSTEM_PROMPT = `You are a call analysis assistant. Given a voice call transcript between an AI agent and a contact, produce a concise summary (2-4 sentences) covering: the call outcome, key info the contact shared, their receptiveness, and any follow-up needed. Be factual and concise.`

const CAMPAIGN_SUMMARY_SYSTEM_PROMPT = `You are a campaign analysis assistant. Given individual call summaries from a voice campaign, produce a concise overview (3-5 sentences) covering: overall reception, common responses or objections, patterns across calls, and recommended next steps. Be factual and actionable.`

async function callAnthropic(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Anthropic API error:', err)
    throw new Error('AI summary generation failed')
  }

  const data = await response.json()
  return data.content?.[0]?.text || ''
}

export async function generateCallSummary(callId: string): Promise<string | null> {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      contact: { select: { name: true } },
      agent: { select: { name: true } },
    },
  })

  if (!call?.transcript) return null

  const contactName = call.contact?.name || 'Unknown contact'
  const agentName = call.agent?.name || 'AI Agent'

  const summary = await callAnthropic(
    CALL_SUMMARY_SYSTEM_PROMPT,
    `Agent: ${agentName}\nContact: ${contactName}\n\nTranscript:\n${call.transcript}`
  )

  await prisma.call.update({
    where: { id: callId },
    data: { summary },
  })

  return summary
}

export async function generateCampaignSummary(campaignId: string): Promise<string | null> {
  const calls = await prisma.call.findMany({
    where: {
      campaignId,
      status: 'COMPLETED',
      summary: { not: null },
    },
    select: {
      summary: true,
      contact: { select: { name: true } },
    },
    orderBy: { startedAt: 'asc' },
  })

  if (calls.length < 2) return null

  const summariesText = calls
    .map((c, i) => `Call ${i + 1} (${c.contact?.name || 'Unknown'}): ${c.summary}`)
    .join('\n')

  return callAnthropic(
    CAMPAIGN_SUMMARY_SYSTEM_PROMPT,
    `Campaign has ${calls.length} completed calls:\n\n${summariesText}`
  )
}
