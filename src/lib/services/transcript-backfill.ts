import { prisma } from '@/lib/prisma'
import { getProvider } from '@/lib/providers'

/**
 * For calls that have a providerCallId but no transcript,
 * fetch the transcript from ElevenLabs and update the DB.
 * Runs in the background — does not block the response.
 */
export async function backfillTranscripts(callIds: string[]) {
  if (callIds.length === 0) return

  const calls = await prisma.call.findMany({
    where: {
      id: { in: callIds },
      providerCallId: { not: null },
      transcript: null,
      status: { not: 'INITIATED' },
    },
    include: { agent: { select: { provider: true } } },
    take: 5, // Limit to avoid overloading ElevenLabs API
  })

  for (const call of calls) {
    try {
      const provider = getProvider(call.agent?.provider || 'ELEVENLABS')
      if (!provider.getTranscript) continue

      const transcript = await provider.getTranscript(call.providerCallId!)
      if (transcript) {
        await prisma.call.update({
          where: { id: call.id },
          data: { transcript },
        })
      }

      // Also fetch call details to update status/duration if still missing
      if (provider.getCall && (call.status === 'IN_PROGRESS' || !call.duration)) {
        const details = await provider.getCall(call.providerCallId!)
        const updateData: Record<string, unknown> = {}
        if (details.durationSeconds && !call.duration) updateData.duration = details.durationSeconds
        if (details.status && details.status !== call.status && details.status !== 'UNKNOWN') {
          updateData.status = details.status
        }
        if (details.endedAt && !call.endedAt) updateData.endedAt = new Date(details.endedAt)
        if (details.hasAudio !== undefined) updateData.recordingAvailable = details.hasAudio
        if (Object.keys(updateData).length > 0) {
          await prisma.call.update({ where: { id: call.id }, data: updateData })
        }
      }
    } catch (err) {
      // Silently continue — backfill is best-effort
      console.error(`Transcript backfill failed for call ${call.id}:`, err instanceof Error ? err.message : err)
    }
  }
}
