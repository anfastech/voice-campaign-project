import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const USER_ID = 'default-user'

export async function GET() {
  try {
    const templates = await prisma.campaignTemplate.findMany({
      where: { userId: USER_ID },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Templates GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, agentConfig } = body

    if (!name || !agentConfig) {
      return NextResponse.json({ error: 'name and agentConfig are required' }, { status: 400 })
    }

    const template = await prisma.campaignTemplate.create({
      data: {
        name,
        description: description || null,
        agentConfig,
        userId: USER_ID,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Template create error:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}
