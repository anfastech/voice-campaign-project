import { NextRequest, NextResponse } from 'next/server'
import { updateAgentTool, deleteAgentTool } from '@/lib/services/agent-service'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; toolId: string }> }) {
  try {
    const { toolId } = await params
    const body = await req.json()
    const tool = await updateAgentTool(toolId, body)
    return NextResponse.json({ tool })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update tool'
    console.error('Tool update error:', error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; toolId: string }> }) {
  try {
    const { toolId } = await params
    await deleteAgentTool(toolId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tool delete error:', error)
    return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 })
  }
}
