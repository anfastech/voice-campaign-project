import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin()
  if (user instanceof NextResponse) return user

  const { id } = await params
  const client = await prisma.client.findFirst({ where: { id, userId: user.id } })
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const { accountSid, authToken } = await req.json()
  if (!accountSid || !authToken) {
    return NextResponse.json({ valid: false, error: 'Account SID and Auth Token required' }, { status: 400 })
  }

  try {
    // Test Twilio credentials by fetching account info
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
      headers: { Authorization: `Basic ${credentials}` },
    })

    if (!res.ok) {
      return NextResponse.json({ valid: false, error: 'Invalid credentials' })
    }

    const data = await res.json()
    return NextResponse.json({
      valid: true,
      accountName: data.friendly_name,
      status: data.status,
    })
  } catch {
    return NextResponse.json({ valid: false, error: 'Connection failed' })
  }
}
