import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const topicSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export async function GET() {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user

    const topics = await prisma.topic.findMany({
      where: { userId: user.id },
      include: { _count: { select: { calls: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(topics)
  } catch (error) {
    console.error('Topics GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user

    const body = await req.json()
    const { name, color } = topicSchema.parse(body)

    const topic = await prisma.topic.create({
      data: { name, color: color || '#3b82f6', userId: user.id },
    })
    return NextResponse.json(topic, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Topics POST error:', error)
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
  }
}
