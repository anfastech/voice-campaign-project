import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'PAUSED' },
    })
    return NextResponse.json({ message: 'Campaign paused', campaign })
  } catch (error) {
    console.error('Campaign pause error:', error)
    return NextResponse.json({ error: 'Failed to pause campaign' }, { status: 500 })
  }
}
