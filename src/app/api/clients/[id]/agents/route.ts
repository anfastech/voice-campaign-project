import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { assignAgentToClient, removeAgentFromClient } from '@/lib/services/client-service'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (user instanceof NextResponse) return user

  const { id } = await params
  const { agentId } = await req.json()
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

  try {
    const assignment = await assignAgentToClient(user.id, id, agentId)
    return NextResponse.json(assignment, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (user instanceof NextResponse) return user

  const { id } = await params
  const { agentId } = await req.json()
  if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })

  try {
    await removeAgentFromClient(user.id, id, agentId)
    return NextResponse.json({ removed: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
