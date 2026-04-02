import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { getClient, updateClient, deleteClient } from '@/lib/services/client-service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (user instanceof NextResponse) return user

  const { id } = await params
  const client = await getClient(user.id, id)
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (user instanceof NextResponse) return user

  const { id } = await params
  const data = await req.json()
  try {
    const client = await updateClient(user.id, id, data)
    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (user instanceof NextResponse) return user

  const { id } = await params
  try {
    await deleteClient(user.id, id)
    return NextResponse.json({ deleted: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
