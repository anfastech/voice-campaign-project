import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user
    const { id } = await params

    await prisma.topic.deleteMany({ where: { id, userId: user.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Topic DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 })
  }
}
