import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const adminUserId = user.adminUserId
    if (!adminUserId) return NextResponse.json({ error: 'No admin association' }, { status: 400 })

    const items = await prisma.customMenuItem.findMany({
      where: { userId: adminUserId, isActive: true },
      orderBy: { position: 'asc' },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Client menu GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}
