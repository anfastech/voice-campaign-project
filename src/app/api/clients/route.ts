import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { listClients, createClient } from '@/lib/services/client-service'

export async function GET() {
  const user = await requireAdmin()
  if (user instanceof NextResponse) return user

  const clients = await listClients(user.id)
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (user instanceof NextResponse) return user

  try {
    const data = await req.json()
    if (!data.name || !data.email || !data.password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }
    const client = await createClient(user.id, data)
    return NextResponse.json(client, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create client' }, { status: 500 })
  }
}
