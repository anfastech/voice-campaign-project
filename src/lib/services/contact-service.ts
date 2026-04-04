import { prisma } from '@/lib/prisma'

export async function listContacts(userId: string, params: {
  search?: string
  page?: number
  limit?: number
  groupId?: string
  agentId?: string
  tag?: string
  doNotCall?: boolean
}) {
  const { search, page = 1, limit = 100, groupId, agentId, tag, doNotCall } = params

  const where: Record<string, unknown> = { userId }

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

export async function createContact(userId: string, data: {
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
      userId,
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

export async function importContacts(
  userId: string,
  csvData: Array<Record<string, string>>,
  options?: { sourceName?: string; sourceType?: 'csv' | 'gsheet' }
) {
  const results = await Promise.allSettled(
    csvData.map(async (row) => {
      const phoneNumber = (
        row.phone_number || row.phoneNumber || row.phone || row.Phone || ''
      ).trim()
      if (!phoneNumber) return null

      return prisma.contact.upsert({
        where: {
          userId_phoneNumber: { userId, phoneNumber },
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
          userId,
        },
      })
    })
  )

  const importedContacts = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
    .map((r) => r.value)
  const imported = importedContacts.length
  const failed = results.filter((r) => r.status === 'rejected').length

  // Auto-create a contact group for this import batch
  let groupId: string | undefined
  if (imported > 0 && options?.sourceName) {
    const groupName = options.sourceName
    try {
      const group = await prisma.contactGroup.upsert({
        where: { userId_name: { userId, name: groupName } },
        update: {},
        create: { name: groupName, description: `Imported from ${options.sourceType === 'gsheet' ? 'Google Sheets' : 'CSV'} on ${new Date().toLocaleDateString('en-GB')}`, userId },
      })
      groupId = group.id

      // Add imported contacts to the group
      await prisma.contactGroupMember.createMany({
        data: importedContacts.map((c: any) => ({ contactId: c.id, groupId: group.id })),
        skipDuplicates: true,
      })
    } catch (err) {
      console.error('Failed to create import group:', err)
    }
  }

  return { imported, failed, total: csvData.length, groupId }
}
