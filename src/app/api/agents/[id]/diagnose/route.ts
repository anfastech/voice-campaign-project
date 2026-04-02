import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const EL_BASE = 'https://api.elevenlabs.io/v1'

async function elFetch(path: string) {
  const res = await fetch(`${EL_BASE}${path}`, {
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    return { error: `ElevenLabs API ${res.status}: ${text}` }
  }
  return res.json()
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const agent = await prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        elevenLabsAgentId: true,
        provider: true,
        calls: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            status: true,
            duration: true,
            providerCallId: true,
            elevenLabsCallId: true,
            errorMessage: true,
            createdAt: true,
            endedAt: true,
          },
        },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const diagnosis: Record<string, unknown> = {
      agent: {
        id: agent.id,
        name: agent.name,
        provider: agent.provider,
        elevenLabsAgentId: agent.elevenLabsAgentId,
      },
      recentCalls: agent.calls,
      webhookUrl: {
        configured: `${(process.env.APP_URL || '').replace(/\/$/, '')}/api/webhooks/elevenlabs`,
        appUrlEnv: process.env.APP_URL || '(not set)',
      },
    }

    // Fetch ElevenLabs agent details if synced
    if (agent.elevenLabsAgentId) {
      const elAgent = await elFetch(`/convai/agents/${agent.elevenLabsAgentId}`)
      diagnosis.elevenLabsAgent = {
        webhookUrl: elAgent?.platform_settings?.webhook?.url,
        status: elAgent.error ? 'error' : 'found',
        ...(elAgent.error ? { error: elAgent.error } : {}),
      }
    }

    // Fetch ElevenLabs conversation details for recent calls
    const conversationDiags = []
    for (const call of agent.calls.slice(0, 3)) {
      const convId = call.elevenLabsCallId || call.providerCallId
      if (!convId) continue
      const conv = await elFetch(`/convai/conversations/${convId}`)
      conversationDiags.push({
        callId: call.id,
        conversationId: convId,
        dbStatus: call.status,
        elStatus: conv.status,
        elDuration: conv.metadata?.call_duration_secs,
        terminationReason: conv.metadata?.termination_reason,
        errorMessage: conv.metadata?.error_message,
        transcript: conv.transcript
          ?.map((t: { role: string; message: string }) => `${t.role}: ${t.message}`)
          .join('\n'),
        ...(conv.error ? { fetchError: conv.error } : {}),
      })
    }
    diagnosis.conversationDetails = conversationDiags

    return NextResponse.json(diagnosis)
  } catch (error) {
    console.error('Agent diagnose error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Diagnosis failed' },
      { status: 500 },
    )
  }
}
