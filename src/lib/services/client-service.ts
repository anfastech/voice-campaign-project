import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function listClients(adminUserId: string) {
  return prisma.client.findMany({
    where: { userId: adminUserId },
    include: {
      agents: { include: { agent: { select: { id: true, name: true } } } },
      _count: { select: { agents: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getClient(adminUserId: string, clientId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, userId: adminUserId },
    include: {
      agents: { include: { agent: { select: { id: true, name: true, provider: true, isActive: true } } } },
    },
  })
}

export async function createClient(adminUserId: string, data: {
  name: string
  email: string
  password: string
  companyName?: string
  notes?: string
}) {
  const passwordHash = await bcrypt.hash(data.password, 12)
  return prisma.client.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      companyName: data.companyName,
      notes: data.notes,
      userId: adminUserId,
    },
  })
}

export async function updateClient(adminUserId: string, clientId: string, data: {
  name?: string
  email?: string
  password?: string
  companyName?: string
  notes?: string
  isActive?: boolean
}) {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.email !== undefined) updateData.email = data.email
  if (data.companyName !== undefined) updateData.companyName = data.companyName
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.isActive !== undefined) updateData.isActive = data.isActive
  if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12)

  return prisma.client.update({
    where: { id: clientId, userId: adminUserId },
    data: updateData,
  })
}

export async function deleteClient(adminUserId: string, clientId: string) {
  return prisma.client.delete({
    where: { id: clientId, userId: adminUserId },
  })
}

export async function assignAgentToClient(adminUserId: string, clientId: string, agentId: string) {
  const client = await prisma.client.findFirst({ where: { id: clientId, userId: adminUserId } })
  if (!client) throw new Error('Client not found')

  const agent = await prisma.agent.findFirst({ where: { id: agentId, userId: adminUserId } })
  if (!agent) throw new Error('Agent not found')

  return prisma.clientAgent.upsert({
    where: { clientId_agentId: { clientId, agentId } },
    create: { clientId, agentId },
    update: {},
  })
}

export async function removeAgentFromClient(adminUserId: string, clientId: string, agentId: string) {
  const client = await prisma.client.findFirst({ where: { id: clientId, userId: adminUserId } })
  if (!client) throw new Error('Client not found')

  return prisma.clientAgent.delete({
    where: { clientId_agentId: { clientId, agentId } },
  })
}

export async function getClientAgentIds(clientId: string): Promise<string[]> {
  const assignments = await prisma.clientAgent.findMany({
    where: { clientId },
    select: { agentId: true },
  })
  return assignments.map((a) => a.agentId)
}
