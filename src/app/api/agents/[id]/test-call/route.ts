import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.ULTRAVOX_BASE_URL || 'https://api.ultravox.ai/api'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const agent = await prisma.agent.findUnique({ where: { id } })
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agentAny = agent as any

    if (agentAny.provider === 'ULTRAVOX' || !agentAny.provider) {
      // Create a browser-based Ultravox call (no phone number = WebRTC joinUrl)
      const apiKey = process.env.ULTRAVOX_API_KEY
      if (!apiKey) {
        return NextResponse.json({ error: 'ULTRAVOX_API_KEY not configured' }, { status: 500 })
      }

      const res = await fetch(`${BASE_URL}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          systemPrompt: agent.systemPrompt,
          voice: agent.voice || 'Mark',
          temperature: agent.temperature ?? 0.7,
          maxDuration: `${agent.maxDuration || 300}s`,
          model: 'fixie-ai/ultravox-70B',
          firstSpeaker: agentAny.firstMessage ? 'FIRST_SPEAKER_AGENT' : 'FIRST_SPEAKER_USER',
          ...(agentAny.firstMessage ? { initialOutputMedium: 'MESSAGE_MEDIUM_VOICE', firstSpeakerSettings: { agent: { uninterruptible: false, text: agentAny.firstMessage } } } : {}),
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        console.error('Ultravox test call error:', err)
        return NextResponse.json({ error: 'Failed to create Ultravox test call' }, { status: 500 })
      }

      const data = await res.json()
      return NextResponse.json({
        provider: 'ULTRAVOX',
        callId: data.callId,
        joinUrl: data.joinUrl,
      })
    }

    if (agentAny.provider === 'VAPI') {
      // For VAPI, return the assistant config so the client can start it using the web SDK
      // Map voice to VAPI format
      const voice = agent.voice || 'nova-openai'
      let vapiVoice: Record<string, unknown> = { provider: 'openai', voice: 'nova' }
      if (voice.endsWith('-11labs')) {
        const map: Record<string, string> = { 'rachel-11labs': '21m00Tcm4TlvDq8ikWAM', 'adam-11labs': 'pNInz6obpgDQGcFmaJgB' }
        vapiVoice = { provider: '11labs', voiceId: map[voice] || '21m00Tcm4TlvDq8ikWAM' }
      } else if (voice.endsWith('-openai')) {
        vapiVoice = { provider: 'openai', voice: voice.replace('-openai', '') }
      } else if (voice.endsWith('-playht')) {
        const map: Record<string, string> = { 'jennifer-playht': 'jennifer', 'matt-playht': 'matt' }
        vapiVoice = { provider: 'playht', voice: map[voice] || 'jennifer' }
      }

      const assistantConfig = {
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: agent.systemPrompt }],
          temperature: agent.temperature ?? 0.7,
        },
        voice: vapiVoice,
        firstMessage: agentAny.firstMessage || undefined,
        maxDurationSeconds: agent.maxDuration || 300,
        endCallFunctionEnabled: true,
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: agent.language || 'en',
        },
      }

      return NextResponse.json({
        provider: 'VAPI',
        assistantConfig,
      })
    }

    return NextResponse.json(
      { error: `Browser testing not yet supported for ${agentAny.provider}. Use ULTRAVOX or VAPI for live testing.` },
      { status: 400 }
    )
  } catch (error) {
    console.error('Test call error:', error)
    return NextResponse.json({ error: 'Failed to create test call' }, { status: 500 })
  }
}
