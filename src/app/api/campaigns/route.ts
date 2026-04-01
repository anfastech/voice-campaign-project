import { NextRequest, NextResponse } from 'next/server'
import { listCampaigns, createCampaign } from '@/lib/services/campaign-service'
import { z } from 'zod'

const campaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  agentId: z.string(),
  contactIds: z.array(z.string()),
  scheduledAt: z.string().datetime().optional(),
  maxRetries: z.number().int().min(0).max(10).default(3),
  retryDelayMinutes: z.number().int().min(1).max(1440).default(60),
  callsPerMinute: z.number().int().min(1).max(60).default(5),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const result = await listCampaigns({
      status: searchParams.get('status') || undefined,
      agentId: searchParams.get('agentId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Campaigns GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = campaignSchema.parse(body)
    const campaign = await createCampaign(data)
    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Campaigns POST error:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
