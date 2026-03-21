import { NextRequest, NextResponse } from 'next/server'
import { listAgentTools, createAgentTool } from '@/lib/services/agent-service'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tools = await listAgentTools(id)
    return NextResponse.json({ tools })
  } catch (error) {
    console.error('Tools list error:', error)
    return NextResponse.json({ error: 'Failed to list tools' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, description, parameters, webhookUrl } = body

    if (!name || !description || !parameters || !webhookUrl) {
      return NextResponse.json(
        { error: 'name, description, parameters, and webhookUrl are required' },
        { status: 400 }
      )
    }

    const tool = await createAgentTool(id, { name, description, parameters, webhookUrl })
    return NextResponse.json({ tool }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create tool'
    console.error('Tool create error:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
