import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const agent = await prisma.agent.findUnique({ where: { id } })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const cloned = await prisma.agent.create({
      data: {
        name: `${agent.name} (Copy)`,
        description: agent.description,
        systemPrompt: agent.systemPrompt,
        provider: agent.provider,
        voice: agent.voice,
        voiceId: agent.voiceId,
        language: agent.language,
        temperature: agent.temperature,
        firstMessage: agent.firstMessage,
        maxDuration: agent.maxDuration,
        evaluationCriteria: agent.evaluationCriteria ?? undefined,
        dataCollection: agent.dataCollection ?? undefined,
        interruptionSensitivity: agent.interruptionSensitivity,
        ambientSound: agent.ambientSound,
        backchannel: agent.backchannel,
        providerConfig: agent.providerConfig ?? undefined,
        useKnowledgeBase: agent.useKnowledgeBase,
        userId: agent.userId,
      },
    })

    // Clone tools
    const tools = await prisma.agentTool.findMany({ where: { agentId: id } })
    if (tools.length > 0) {
      await prisma.agentTool.createMany({
        data: tools.map((t) => ({
          agentId: cloned.id,
          name: t.name,
          description: t.description,
          parameters: t.parameters as any,
          webhookUrl: t.webhookUrl,
          isActive: t.isActive,
        })),
      })
    }

    return NextResponse.json(cloned)
  } catch (error) {
    console.error('Agent clone error:', error)
    return NextResponse.json({ error: 'Failed to clone agent' }, { status: 500 })
  }
}
