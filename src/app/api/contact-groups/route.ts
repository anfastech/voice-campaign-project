import { NextRequest, NextResponse } from 'next/server'
import { listContactGroups, createContactGroup } from '@/lib/services/contact-group-service'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const groups = await listContactGroups()
    return NextResponse.json(groups)
  } catch (error) {
    console.error('Contact groups GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch contact groups' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = createSchema.parse(body)
    const group = await createContactGroup(data)
    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Contact groups POST error:', error)
    return NextResponse.json({ error: 'Failed to create contact group' }, { status: 500 })
  }
}
