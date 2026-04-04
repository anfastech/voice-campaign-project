import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { LeadStatus } from '@prisma/client'

const updateLeadSchema = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  score: z.number().int().min(0).max(100).optional(),
  value: z.number().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user

    const { id } = await params

    const lead = await prisma.lead.findFirst({
      where: { id, userId: user.id },
      include: {
        contact: true,
        agent: { select: { id: true, name: true } },
        call: true,
      },
    })

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    return NextResponse.json(lead)
  } catch (error) {
    console.error('Lead GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user

    const { id } = await params
    const body = await req.json()
    const data = updateLeadSchema.parse(body)

    const updateData: Record<string, unknown> = { ...data }
    if (data.status === LeadStatus.WON || data.status === LeadStatus.LOST) {
      updateData.closedAt = new Date()
    }

    const lead = await prisma.lead.updateMany({
      where: { id, userId: user.id },
      data: updateData,
    })

    if (lead.count === 0) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Lead PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user

    const { id } = await params

    const result = await prisma.lead.deleteMany({
      where: { id, userId: user.id },
    })

    if (result.count === 0) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Lead DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
