import { NextRequest, NextResponse } from 'next/server'
import { syncAgent } from '@/lib/services/agent-service'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await syncAgent(id)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'Agent not found') {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }
    console.error('Agent sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync agent' },
      { status: 500 },
    )
  }
}
