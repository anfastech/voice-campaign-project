import { NextRequest, NextResponse } from 'next/server'
import { listContacts, createContact } from '@/lib/services/contact-service'
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
    const doNotCallParam = searchParams.get('doNotCall')
    const result = await listContacts({
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '100'),
      groupId: searchParams.get('groupId') || undefined,
      agentId: searchParams.get('agentId') || undefined,
      tag: searchParams.get('tag') || undefined,
      doNotCall: doNotCallParam === null ? undefined : doNotCallParam === 'true',
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Contacts GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = contactSchema.parse(body)
    const contact = await createContact(data)
    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Contacts POST error:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
