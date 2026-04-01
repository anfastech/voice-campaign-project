import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const USER_ID = 'default-user'

export async function GET() {
  try {
    const workflows = await prisma.workflow.findMany({
      where: { userId: USER_ID },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(workflows)
  } catch (error) {
    console.error('Workflows GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, trigger, conditions, actions } = body

    if (!name || !trigger || !actions) {
      return NextResponse.json({ error: 'name, trigger, and actions are required' }, { status: 400 })
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        description: description || null,
        trigger,
        conditions: conditions || null,
        actions,
        userId: USER_ID,
      },
    })

    return NextResponse.json(workflow, { status: 201 })
  } catch (error) {
    console.error('Workflow create error:', error)
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const workflow = await prisma.workflow.update({
      where: { id },
      data,
    })

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('Workflow update error:', error)
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await prisma.workflow.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Workflow delete error:', error)
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }
}
