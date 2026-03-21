import { NextRequest, NextResponse } from 'next/server'
import { deleteDocument, retrySyncDocument } from '@/lib/services/knowledge-base-service'

const USER_ID = 'default-user'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteDocument(USER_ID, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete document'
    console.error('KB delete error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const doc = await retrySyncDocument(USER_ID, id)
    return NextResponse.json({ document: doc })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync document'
    console.error('KB sync error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
