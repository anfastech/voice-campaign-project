import { NextRequest, NextResponse } from 'next/server'
import { getAgent, updateAgent, deleteAgent } from '@/lib/services/agent-service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const agent = await getAgent(id)
    return NextResponse.json(agent)
  } catch (error) {
    if (error instanceof Error && error.message === 'Agent not found') {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }
    console.error('Agent GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const agent = await updateAgent(id, body)
    return NextResponse.json(agent)
  } catch (error) {
    console.error('Agent PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteAgent(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Agent DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 })
  }
}
