import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are an expert voice AI agent configurator. Given a description of what a voice agent should do, you generate the perfect configuration.

Return ONLY a valid JSON object — no explanation, no markdown, no code blocks.

The JSON must have these exact fields:
{
  "name": "short catchy agent name (2-4 words)",
  "description": "1-2 sentence description of what this agent does",
  "systemPrompt": "detailed system prompt for the voice agent — include persona, tone, objectives, how to greet, handle objections, and end calls gracefully. Minimum 150 words.",
  "firstMessage": "the very first thing the agent says when the call connects — natural, warm, professional. 1-2 sentences.",
  "voice": "one of: Mark, Alloy, Echo, Nova, Onyx, Shimmer (choose best match for the use case)",
  "language": "language code like en, es, fr, de",
  "temperature": 0.7,
  "suggestedProvider": "VAPI or ULTRAVOX or ELEVENLABS (choose based on use case)"
}`

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json()
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
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
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Generate a voice agent configuration for this use case:\n\n${description}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Parse JSON from the response
    let config: Record<string, unknown>
    try {
      // Handle potential markdown code blocks
      const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      config = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse AI response:', text)
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
