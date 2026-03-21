import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const agent = await prisma.agent.findUnique({ where: { id } })
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

    // ElevenLabs uses phone-based (PSTN) calling — no browser WebRTC test calls
    return NextResponse.json(
      {
        provider: 'ELEVENLABS',
        message: 'ElevenLabs agents use phone-based calling. Create a campaign with a contact to place a call.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Test call error:', error)
    return NextResponse.json({ error: 'Failed to create test call' }, { status: 500 })
  }
}
