import { NextRequest, NextResponse } from 'next/server'
import { processCallEvent } from '@/lib/services/webhook-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, callId, data } = body
    if (!callId) return NextResponse.json({ received: true })
    const result = await processCallEvent({ type: event, callId, data })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
