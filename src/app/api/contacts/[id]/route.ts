import { NextRequest, NextResponse } from 'next/server'
import { getContact, updateContact, deleteContact } from '@/lib/services/contact-service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const contact = await getContact(id)
    return NextResponse.json(contact)
  } catch (error) {
    if (error instanceof Error && error.message === 'Contact not found') {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }
    console.error('Contact GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const contact = await updateContact(id, body)
    return NextResponse.json(contact)
  } catch (error) {
    console.error('Contact PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteContact(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
