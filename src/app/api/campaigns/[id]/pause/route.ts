import { NextRequest, NextResponse } from 'next/server'
import { pauseCampaign } from '@/lib/services/campaign-service'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const campaign = await pauseCampaign(id)
    return NextResponse.json({ message: 'Campaign paused', campaign })
  } catch (error) {
    console.error('Campaign pause error:', error)
    return NextResponse.json({ error: 'Failed to pause campaign' }, { status: 500 })
  }
}
