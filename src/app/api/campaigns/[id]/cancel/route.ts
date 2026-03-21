import { NextRequest, NextResponse } from 'next/server'
import { cancelCampaign } from '@/lib/services/campaign-service'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const result = await cancelCampaign(id)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Campaign not found') {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }
      if (error.message === 'Campaign is already finished') {
        return NextResponse.json({ error: 'Campaign is already finished' }, { status: 400 })
      }
    }
    console.error('Campaign cancel error:', error)
    return NextResponse.json({ error: 'Failed to cancel campaign' }, { status: 500 })
  }
}
