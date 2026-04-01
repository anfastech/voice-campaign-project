import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs API key not configured' }, { status: 500 })
    }

    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch voices' }, { status: res.status })
    }

    const data = await res.json()
    const voices = (data.voices || []).map((v: any) => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category,
      labels: v.labels,
      preview_url: v.preview_url,
      description: v.description,
    }))

    return NextResponse.json(voices)
  } catch (error) {
    console.error('Voices error:', error)
    return NextResponse.json({ error: 'Failed to fetch voices' }, { status: 500 })
  }
}
