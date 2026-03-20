import { NextRequest, NextResponse } from 'next/server'
import { startCampaign } from '@/lib/services/campaign-service'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await startCampaign(id)
    return NextResponse.json({ message: 'Campaign started', ...result })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Campaign not found') {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }
      if (error.message === 'No pending contacts to call') {
        return NextResponse.json({ error: 'No pending contacts to call' }, { status: 400 })
      }
    }
    console.error('Campaign start error:', error)
    return NextResponse.json({ error: 'Failed to start campaign' }, { status: 500 })
  }
}
