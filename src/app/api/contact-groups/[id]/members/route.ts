import { NextRequest, NextResponse } from 'next/server'
import { addContactsToGroup, removeContactsFromGroup } from '@/lib/services/contact-group-service'
import { z } from 'zod'

const membersSchema = z.object({
  contactIds: z.array(z.string()).min(1),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { contactIds } = membersSchema.parse(body)
    await addContactsToGroup(id, contactIds)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Group members POST error:', error)
    return NextResponse.json({ error: 'Failed to add contacts to group' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { contactIds } = membersSchema.parse(body)
    await removeContactsFromGroup(id, contactIds)
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Group members DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove contacts from group' }, { status: 500 })
  }
}
