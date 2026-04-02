import { NextRequest, NextResponse } from 'next/server'
import { listDocuments } from '@/lib/services/knowledge-base-service'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    const userId = user.role === 'admin' ? user.id : user.adminUserId!

    const { id } = await params
    const docs = await listDocuments(userId, id)
    return NextResponse.json(docs)
  } catch (error) {
    console.error('Agent KB list error:', error)
    return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 })
  }
}
