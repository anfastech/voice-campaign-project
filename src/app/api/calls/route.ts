import { NextRequest, NextResponse } from 'next/server'
import { listCalls } from '@/lib/services/call-service'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const result = await listCalls({
      campaignId: searchParams.get('campaignId') || undefined,
      status: searchParams.get('status') || undefined,
      agentId: searchParams.get('agentId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Calls GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 })
  }
}
