import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { getClientAgentIds } from '@/lib/services/client-service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET() {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const agentIds = await getClientAgentIds(user.id)

    const documents = await prisma.knowledgeBaseDocument.findMany({
      where: {
        OR: [
          { agentId: { in: agentIds } },
          { clientId: user.id },
        ],
      },
      include: { agent: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Client KB GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['TEXT', 'URL']),
  content: z.string().optional(),
  url: z.string().url().optional(),
  agentId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const agentIds = await getClientAgentIds(user.id)
    const body = await req.json()
    const data = createSchema.parse(body)

    // Verify agent belongs to client
    if (data.agentId && !agentIds.includes(data.agentId)) {
      return NextResponse.json({ error: 'Agent not assigned to your account' }, { status: 403 })
    }

    const doc = await prisma.knowledgeBaseDocument.create({
      data: {
        name: data.name,
        type: data.type,
        content: data.type === 'TEXT' ? data.content : undefined,
        url: data.type === 'URL' ? data.url : undefined,
        agentId: data.agentId,
        userId: user.adminUserId!,
        clientId: user.id,
        syncStatus: 'PENDING',
      },
    })

    return NextResponse.json({ document: doc }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Client KB POST error:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
