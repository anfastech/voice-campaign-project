import { prisma } from '@/lib/prisma'

export async function listContactGroups() {
  return prisma.contactGroup.findMany({
    where: { userId: 'default-user' },
    include: { _count: { select: { members: true } } },
    orderBy: { name: 'asc' },
  })
}

export async function createContactGroup(data: { name: string; description?: string }) {
  return prisma.contactGroup.create({
    data: { ...data, userId: 'default-user' },
    include: { _count: { select: { members: true } } },
  })
}

export async function updateContactGroup(id: string, data: { name?: string; description?: string }) {
  return prisma.contactGroup.update({
    where: { id },
    data,
    include: { _count: { select: { members: true } } },
  })
}

export async function deleteContactGroup(id: string) {
  await prisma.contactGroup.delete({ where: { id } })
}

export async function addContactsToGroup(groupId: string, contactIds: string[]) {
  await prisma.contactGroupMember.createMany({
    data: contactIds.map((contactId) => ({ groupId, contactId })),
    skipDuplicates: true,
  })
}

export async function removeContactsFromGroup(groupId: string, contactIds: string[]) {
  await prisma.contactGroupMember.deleteMany({
    where: { groupId, contactId: { in: contactIds } },
  })
}
