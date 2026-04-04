import { NextRequest, NextResponse } from 'next/server'
import { listCalls } from '@/lib/services/call-service'
import { prisma } from '@/lib/prisma'
import { getProvider } from '@/lib/providers'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const result = await listCalls({
      campaignId: searchParams.get('campaignId') || undefined,
      status: searchParams.get('status') || undefined,
      agentId: searchParams.get('agentId') || undefined,
      search: searchParams.get('search') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      minDuration: searchParams.has('minDuration') ? parseInt(searchParams.get('minDuration')!) : undefined,
      maxDuration: searchParams.has('maxDuration') ? parseInt(searchParams.get('maxDuration')!) : undefined,
      sentiment: searchParams.get('sentiment') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    })

    // Inline: fetch transcripts from ElevenLabs for calls missing them
    const calls = result.calls || []
    const callsToBackfill = calls.filter(
      (c: any) => !c.transcript && c.providerCallId && c.status !== 'INITIATED'
    )

    if (callsToBackfill.length > 0) {
      await Promise.allSettled(
        callsToBackfill.slice(0, 5).map(async (call: any) => {
          try {
            const provider = getProvider(call.agent?.provider || 'ELEVENLABS')
            if (!provider.getCall) return

            const details = await provider.getCall(call.providerCallId)
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
              Object.assign(call, updateData)
            }
          } catch (err) {
            console.error(`Transcript fetch failed for call ${call.id}:`, err instanceof Error ? err.message : err)
          }
        })
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Calls GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
  }
}
