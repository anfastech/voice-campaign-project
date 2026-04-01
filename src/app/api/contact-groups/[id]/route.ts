import { NextRequest, NextResponse } from 'next/server'
import { updateContactGroup, deleteContactGroup } from '@/lib/services/contact-group-service'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = updateSchema.parse(body)
    const group = await updateContactGroup(id, data)
    return NextResponse.json(group)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Contact group PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update contact group' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteContactGroup(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact group DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete contact group' }, { status: 500 })
  }
}
