import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { elevenLabsProvider } from '@/lib/providers/elevenlabs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const call = await prisma.call.findUnique({
      where: { id },
      select: { elevenLabsCallId: true, recordingAvailable: true },
    })

    if (!call || !call.elevenLabsCallId) {
      return new Response(JSON.stringify({ error: 'Call not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!call.recordingAvailable) {
      return new Response(JSON.stringify({ error: 'Recording not available for this call' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const audioResponse = await elevenLabsProvider.getConversationAudio(call.elevenLabsCallId)

    const headers = new Headers()
    headers.set('Content-Type', audioResponse.headers.get('Content-Type') || 'audio/mpeg')
    const contentLength = audioResponse.headers.get('Content-Length')
    if (contentLength) headers.set('Content-Length', contentLength)
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Content-Disposition', `attachment; filename="recording-${id}.mp3"`)

    return new Response(audioResponse.body, { headers })
  } catch (error) {
    console.error('Recording fetch error:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch recording' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
