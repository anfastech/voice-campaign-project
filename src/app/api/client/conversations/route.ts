import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { prisma } from '@/lib/prisma'
import { getProvider } from '@/lib/providers'

export async function GET(req: NextRequest) {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user
  if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const agentIds = await getClientAgentIds(user.id)
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = { agentId: { in: agentIds } }
  if (status && status !== 'ALL') where.status = status

  const [calls, total] = await Promise.all([
    prisma.call.findMany({
      where,
      include: {
        agent: { select: { id: true, name: true, provider: true } },
        contact: { select: { id: true, name: true, phoneNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.call.count({ where }),
  ])

  // Inline: fetch transcripts from ElevenLabs for calls missing them
  const callsToBackfill = calls.filter(
    (c) => !c.transcript && c.providerCallId && c.status !== 'INITIATED'
  )

  if (callsToBackfill.length > 0) {
    await Promise.allSettled(
      callsToBackfill.slice(0, 5).map(async (call) => {
        try {
          const provider = getProvider(call.agent?.provider || 'ELEVENLABS')
          if (!provider.getCall) return

          const details = await provider.getCall(call.providerCallId!)

          const updateData: Record<string, unknown> = {}
          if (details.transcript) updateData.transcript = details.transcript
          if (details.durationSeconds && !call.duration) updateData.duration = details.durationSeconds
          if (details.hasAudio !== undefined) updateData.recordingAvailable = details.hasAudio
          if (details.endedAt && !call.endedAt) updateData.endedAt = new Date(details.endedAt)
          if (details.status && details.status !== 'UNKNOWN' && details.status !== call.status) {
            updateData.status = details.status
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.call.update({ where: { id: call.id }, data: updateData })
            // Update the in-memory call object so the response includes the transcript
            Object.assign(call, updateData)
          }
        } catch (err) {
          console.error(`Transcript fetch failed for call ${call.id}:`, err instanceof Error ? err.message : err)
        }
      })
    )
  }

  return NextResponse.json({ calls, total, page, totalPages: Math.ceil(total / limit) })
}
