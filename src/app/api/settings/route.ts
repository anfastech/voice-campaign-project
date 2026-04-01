import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Settings are stored as environment variables and provider health checks.
// This API provides a view of the current configuration state.
export async function GET() {
  try {
    const [agentCount, callCount, campaignCount, contactCount, costAgg, durationAgg] = await Promise.all([
      prisma.agent.count({ where: { isActive: true } }),
      prisma.call.count(),
      prisma.campaign.count(),
      prisma.contact.count(),
      prisma.call.aggregate({ _sum: { cost: true } }),
      prisma.call.aggregate({ where: { status: 'COMPLETED' }, _sum: { duration: true } }),
    ])

    const totalMinutes = Math.round((durationAgg._sum.duration ?? 0) / 60)
    const totalCost = costAgg._sum.cost ?? 0

    // Generic integration status (provider-agnostic)
    const integrations = {
      voiceEngine: { connected: Boolean(process.env.ELEVENLABS_API_KEY) },
      aiModel: { connected: Boolean(process.env.ANTHROPIC_API_KEY) },
      telephony: { connected: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) },
    }

    // Webhook config (from env)
    const webhookUrl = process.env.WEBHOOK_URL || null
    const webhookSecret = process.env.WEBHOOK_SECRET ? '••••••••' : null

    return NextResponse.json({
      integrations,
      webhook: { url: webhookUrl, secret: webhookSecret },
      usage: {
        totalMinutes,
        totalCost,
        totalCalls: callCount,
        totalAgents: agentCount,
        totalCampaigns: campaignCount,
        totalContacts: contactCount,
      },
    })
  } catch (error) {
    console.error('Settings error:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}
