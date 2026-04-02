import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await requireAuth()
  if (user instanceof NextResponse) return user
  if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const assignments = await prisma.clientAgent.findMany({
    where: { clientId: user.id },
    include: {
      agent: {
        select: {
          id: true, name: true, description: true, voice: true,
          language: true, isActive: true, createdAt: true,
        },
      },
    },
  })

  return NextResponse.json(assignments.map((a) => a.agent))
}
