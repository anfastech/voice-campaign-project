import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (user instanceof NextResponse) return user

  const { id } = await params
  const client = await prisma.client.findFirst({ where: { id, userId: user.id } })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const integration = await prisma.clientIntegration.findUnique({
    where: { clientId: id },
  })

  if (integration?.authToken) {
    const masked = '•'.repeat(Math.max(0, integration.authToken.length - 4)) + integration.authToken.slice(-4)
    return NextResponse.json({ ...integration, authToken: masked, hasAuthToken: true })
  }

  return NextResponse.json(integration || { isConnected: false, hasAuthToken: false })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (user instanceof NextResponse) return user

  const { id } = await params
  const client = await prisma.client.findFirst({ where: { id, userId: user.id } })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const data = await req.json()
  const updateData: Record<string, unknown> = {}

  if (data.accountSid !== undefined) updateData.accountSid = data.accountSid
  if (data.authToken !== undefined) updateData.authToken = data.authToken
  if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber
  if (data.webhookUrl !== undefined) updateData.webhookUrl = data.webhookUrl

  // Auto-set isConnected if account SID and auth token are both provided
  if (data.accountSid && data.authToken) updateData.isConnected = true
  if (data.accountSid === '' || data.authToken === '') updateData.isConnected = false

  const integration = await prisma.clientIntegration.upsert({
    where: { clientId: id },
    create: { clientId: id, ...updateData },
    update: updateData,
  })

  // Mask auth token in response
  const masked = integration.authToken
    ? '•'.repeat(Math.max(0, integration.authToken.length - 4)) + integration.authToken.slice(-4)
    : null

  return NextResponse.json({ ...integration, authToken: masked, hasAuthToken: !!integration.authToken })
}
