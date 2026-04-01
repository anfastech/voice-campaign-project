import { prisma } from '@/lib/prisma'

export async function listContacts(params: {
  search?: string
  page?: number
  limit?: number
  groupId?: string
  agentId?: string
  tag?: string
  doNotCall?: boolean
}) {
  const { search, page = 1, limit = 100, groupId, agentId, tag, doNotCall } = params

  const where: Record<string, unknown> = { userId: 'default-user' }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phoneNumber: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (groupId) {
    where.groupMemberships = { some: { groupId } }
  }

  if (agentId === 'shared') {
    where.agentAssignments = { none: {} }
  } else if (agentId) {
    where.agentAssignments = { some: { agentId } }
  }

  if (tag) {
    where.tags = { has: tag }
  }

  if (doNotCall !== undefined) {
    where.doNotCall = doNotCall
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        _count: { select: { calls: true } },
        groupMemberships: { include: { group: { select: { id: true, name: true } } } },
        agentAssignments: { include: { agent: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contact.count({ where }),
  ])

  return { contacts, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function createContact(data: {
  phoneNumber: string
  name?: string
  email?: string
  tags?: string[]
  doNotCall?: boolean
}) {
  const contact = await prisma.contact.create({
    data: {
      phoneNumber: data.phoneNumber,
      name: data.name,
      email: data.email,
      tags: data.tags ?? [],
      doNotCall: data.doNotCall ?? false,
      userId: 'default-user',
    },
  })
  return contact
}

export async function getContact(id: string) {
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      calls: {
        take: 50,
        orderBy: { startedAt: 'desc' },
        include: {
          agent: { select: { name: true } },
          campaign: { select: { name: true } },
        },
      },
      _count: { select: { calls: true } },
      groupMemberships: { include: { group: { select: { id: true, name: true } } } },
      agentAssignments: { include: { agent: { select: { id: true, name: true } } } },
    },
  })

  if (!contact) {
    throw new Error(`Contact not found: ${id}`)
  }

  return contact
}

export async function updateContact(id: string, data: Record<string, unknown>) {
  const contact = await prisma.contact.update({
    where: { id },
    data,
  })
  return contact
}

export async function deleteContact(id: string) {
  await prisma.$transaction([
    prisma.contactGroupMember.deleteMany({ where: { contactId: id } }),
    prisma.contactAgentAssignment.deleteMany({ where: { contactId: id } }),
    prisma.campaignContact.deleteMany({ where: { contactId: id } }),
    prisma.call.deleteMany({ where: { contactId: id } }),
    prisma.contact.delete({ where: { id } }),
  ])
}

export async function assignContactsToAgent(contactIds: string[], agentId: string) {
  await prisma.contactAgentAssignment.createMany({
    data: contactIds.map((contactId) => ({ contactId, agentId })),
    skipDuplicates: true,
  })
}

export async function unassignContactsFromAgent(contactIds: string[], agentId: string) {
  await prisma.contactAgentAssignment.deleteMany({
    where: { contactId: { in: contactIds }, agentId },
  })
}

export async function importContacts(csvData: Array<Record<string, string>>) {
  const results = await Promise.allSettled(
    csvData.map(async (row) => {
      const phoneNumber = (
        row.phone_number || row.phoneNumber || row.phone || row.Phone || ''
      ).trim()
      if (!phoneNumber) return null

      return prisma.contact.upsert({
        where: {
          userId_phoneNumber: { userId: 'default-user', phoneNumber },
        },
        update: {
          name: row.name || row.Name || undefined,
          email: row.email || row.Email || undefined,
        },
        create: {
          phoneNumber,
          name: row.name || row.Name || undefined,
          email: row.email || row.Email || undefined,
          tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
          userId: 'default-user',
        },
      })
    })
  )

  const imported = results.filter(
    (r) => r.status === 'fulfilled' && r.value !== null
  ).length
  const failed = results.filter((r) => r.status === 'rejected').length

  return { imported, failed, total: csvData.length }
}
