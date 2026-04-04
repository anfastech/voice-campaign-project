import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({ topicIds: z.array(z.string()) })

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    const { id } = await params

    const body = await req.json()
    const { topicIds } = schema.parse(body)

    // Remove existing topics and set new ones
    await prisma.callTopic.deleteMany({ where: { callId: id } })
    if (topicIds.length > 0) {
      await prisma.callTopic.createMany({
        data: topicIds.map((topicId) => ({ callId: id, topicId })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }
    console.error('Call topics PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update topics' }, { status: 500 })
  }
}
