import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const client = await prisma.client.findUnique({
      where: { id: user.id },
      select: { userId: true },
    })
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const groups = await prisma.contactGroup.findMany({
      where: { userId: client.userId },
      include: {
        _count: { select: { members: true } },
        members: {
          select: { contactId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Include contactIds array for easy campaign creation
    const result = groups.map((g) => ({
      ...g,
      contactIds: g.members.map((m) => m.contactId),
      members: undefined,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Client contact-groups GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch contact groups' }, { status: 500 })
  }
}
