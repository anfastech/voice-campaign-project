import { NextRequest, NextResponse } from 'next/server'
import { listDocuments } from '@/lib/services/knowledge-base-service'

const USER_ID = 'default-user'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const docs = await listDocuments(USER_ID, id)
    return NextResponse.json(docs)
  } catch (error) {
    console.error('Agent KB list error:', error)
    return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 })
  }
}
