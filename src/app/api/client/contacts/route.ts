import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createContactSchema = z.object({
  phoneNumber: z.string().min(1),
  name: z.string().optional(),
  email: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const client = await prisma.client.findUnique({
      where: { id: user.id },
      select: { userId: true },
    })
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { userId: client.userId }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        _count: { select: { calls: true, leads: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Client contacts GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const client = await prisma.client.findUnique({
      where: { id: user.id },
      select: { userId: true },
    })
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const body = await req.json()
    const data = createContactSchema.parse(body)

    const contact = await prisma.contact.upsert({
      where: {
        userId_phoneNumber: {
          userId: client.userId,
          phoneNumber: data.phoneNumber,
        },
      },
      create: {
        phoneNumber: data.phoneNumber,
        name: data.name,
        email: data.email,
        tags: data.tags ?? [],
        userId: client.userId,
      },
      update: {
        name: data.name,
        email: data.email,
        tags: data.tags ?? [],
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Client contacts POST error:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
