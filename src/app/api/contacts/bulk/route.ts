import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assignContactsToAgent, unassignContactsFromAgent, deleteContact } from '@/lib/services/contact-service'
import { addContactsToGroup, removeContactsFromGroup } from '@/lib/services/contact-group-service'
import { requireAuth } from '@/lib/auth-utils'
import { z } from 'zod'

const bulkSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('addToGroup'), contactIds: z.array(z.string()).min(1), groupId: z.string() }),
  z.object({ action: z.literal('removeFromGroup'), contactIds: z.array(z.string()).min(1), groupId: z.string() }),
  z.object({ action: z.literal('assignAgent'), contactIds: z.array(z.string()).min(1), agentId: z.string() }),
  z.object({ action: z.literal('unassignAgent'), contactIds: z.array(z.string()).min(1), agentId: z.string() }),
  z.object({ action: z.literal('delete'), contactIds: z.array(z.string()).min(1) }),
  z.object({ action: z.literal('markDnc'), contactIds: z.array(z.string()).min(1) }),
  z.object({ action: z.literal('unmarkDnc'), contactIds: z.array(z.string()).min(1) }),
])

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user

    const body = await req.json()
    const payload = bulkSchema.parse(body)

    switch (payload.action) {
      case 'addToGroup':
        await addContactsToGroup(payload.groupId, payload.contactIds)
        break
      case 'removeFromGroup':
        await removeContactsFromGroup(payload.groupId, payload.contactIds)
        break
      case 'assignAgent':
        await assignContactsToAgent(payload.contactIds, payload.agentId)
        break
      case 'unassignAgent':
        await unassignContactsFromAgent(payload.contactIds, payload.agentId)
        break
      case 'delete':
        for (const id of payload.contactIds) {
          await deleteContact(id)
        }
        break
      case 'markDnc':
        await prisma.contact.updateMany({
          where: { id: { in: payload.contactIds } },
          data: { doNotCall: true },
        })
        break
      case 'unmarkDnc':
        await prisma.contact.updateMany({
          where: { id: { in: payload.contactIds } },
          data: { doNotCall: false },
        })
        break
    }

    return NextResponse.json({ success: true, count: payload.contactIds.length })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Contacts bulk error:', error)
    return NextResponse.json({ error: 'Bulk operation failed' }, { status: 500 })
  }
}
