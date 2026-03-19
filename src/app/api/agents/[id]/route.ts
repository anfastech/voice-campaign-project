import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const agent = await prisma.agent.findUnique({
      where: { id },
      include: {
        _count: { select: { calls: true, campaigns: true } },
        calls: {
          orderBy: { startedAt: 'desc' },
          take: 20,
          include: { contact: { select: { name: true, phoneNumber: true } } },
        },
      },
    })
    if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    return NextResponse.json(agent)
  } catch (error) {
    console.error('Agent GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const agent = await prisma.agent.update({ where: { id }, data: body })
    return NextResponse.json(agent)
  } catch (error) {
    console.error('Agent PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.agent.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Agent DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 })
  }
}
