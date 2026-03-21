import { prisma } from '@/lib/prisma'

export async function listContacts(params: {
  search?: string
  page?: number
  limit?: number
}) {
  const { search, page = 1, limit = 100 } = params

  const where = {
    userId: 'default-user',
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { phoneNumber: { contains: search } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: { _count: { select: { calls: true } } },
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
    prisma.campaignContact.deleteMany({ where: { contactId: id } }),
    prisma.contact.delete({ where: { id } }),
  ])
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
