import { NextRequest, NextResponse } from 'next/server'
import { generateCampaignSummary } from '@/lib/services/summary-service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const summary = await generateCampaignSummary(id)
    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Campaign summary error:', error)
    return NextResponse.json({ error: 'Failed to generate campaign summary' }, { status: 500 })
  }
}
