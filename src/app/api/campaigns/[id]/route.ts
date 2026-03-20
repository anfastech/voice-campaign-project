import { NextRequest, NextResponse } from 'next/server'
import { getCampaign, updateCampaign, deleteCampaign } from '@/lib/services/campaign-service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const campaign = await getCampaign(id)
    return NextResponse.json(campaign)
  } catch (error) {
    if (error instanceof Error && error.message === 'Campaign not found') {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    console.error('Campaign GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const campaign = await updateCampaign(id, body)
    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Campaign PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteCampaign(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Campaign DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
