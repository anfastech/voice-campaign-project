import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const contactSchema = z.object({
  phoneNumber: z.string().min(10),
  name: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  tags: z.array(z.string()).default([]),
  doNotCall: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where = {
      userId: 'default-user',
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { phoneNumber: { contains: search } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      } : {}),
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          _count: { select: { calls: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contact.count({ where }),
    ])

    return NextResponse.json({ contacts, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Contacts GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = contactSchema.parse(body)

    const contact = await prisma.contact.create({
      data: {
        phoneNumber: data.phoneNumber,
        name: data.name,
        email: data.email,
        tags: data.tags,
        doNotCall: data.doNotCall,
        userId: 'default-user',
      },
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Contacts POST error:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
