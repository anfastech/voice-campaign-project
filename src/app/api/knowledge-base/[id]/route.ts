import { NextRequest, NextResponse } from 'next/server'
import { deleteDocument, retrySyncDocument } from '@/lib/services/knowledge-base-service'
import { requireAuth } from '@/lib/auth-utils'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    const userId = user.role === 'admin' ? user.id : user.adminUserId!

    const { id } = await params
    await deleteDocument(userId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete document'
    console.error('KB delete error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    const userId = user.role === 'admin' ? user.id : user.adminUserId!

    const { id } = await params
    const doc = await retrySyncDocument(userId, id)
    return NextResponse.json({ document: doc })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync document'
    console.error('KB sync error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
