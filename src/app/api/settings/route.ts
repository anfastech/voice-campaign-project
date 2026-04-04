import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'

export async function GET() {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    const userId = user.role === 'admin' ? user.id : user.adminUserId!

    const branding = await prisma.brandingSettings.findUnique({
      where: { userId },
      select: { webhookUrl: true, webhookSecret: true },
    })

    const integrations = {
      voiceEngine: { connected: Boolean(process.env.ELEVENLABS_API_KEY) },
      aiModel: { connected: Boolean(process.env.ANTHROPIC_API_KEY) },
      telephony: { connected: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) },
    }

    return NextResponse.json({
      integrations,
      webhook: {
        url: branding?.webhookUrl || null,
        secret: branding?.webhookSecret ? '••••••••' : null,
        hasSecret: Boolean(branding?.webhookSecret),
      },
    })
  } catch (error) {
    console.error('Settings error:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    const userId = user.role === 'admin' ? user.id : user.adminUserId!

    const body = await req.json()
    const { webhookUrl, webhookSecret } = body

    const data: Record<string, string | null> = {}
    if (webhookUrl !== undefined) data.webhookUrl = webhookUrl || null
    if (webhookSecret !== undefined) data.webhookSecret = webhookSecret || null

    await prisma.brandingSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
