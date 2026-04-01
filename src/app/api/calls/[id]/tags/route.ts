import { NextRequest, NextResponse } from 'next/server'
import { updateCallMetadata } from '@/lib/services/call-service'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { tags } = await req.json()
    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'tags must be an array' }, { status: 400 })
    }
    const updated = await updateCallMetadata(id, { tags })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Call tags error:', error)
    return NextResponse.json({ error: 'Failed to update tags' }, { status: 500 })
  }
}
