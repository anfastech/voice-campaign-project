import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id } = await params

    // Only allow deleting docs the client created
    const doc = await prisma.knowledgeBaseDocument.findFirst({
      where: { id, clientId: user.id },
    })
    if (!doc) return NextResponse.json({ error: 'Document not found or not yours' }, { status: 404 })

    await prisma.knowledgeBaseDocument.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Client KB DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
