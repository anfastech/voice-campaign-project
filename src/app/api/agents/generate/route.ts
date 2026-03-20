import { NextRequest, NextResponse } from 'next/server'
import { generateAgent } from '@/lib/services/agent-service'

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json()
    if (!description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }
    const config = await generateAgent(description)
    return NextResponse.json(config)
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
