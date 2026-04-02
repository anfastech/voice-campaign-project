import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await requireAdmin()
  if (user instanceof NextResponse) return user

  const settings = await prisma.brandingSettings.findUnique({
    where: { userId: user.id },
  })

  return NextResponse.json(settings || {
    platformName: 'Voice Campaign Platform',
    primaryColor: '#171717',
    accentColor: '#3b82f6',
  })
}

export async function PATCH(req: NextRequest) {
  const user = await requireAdmin()
  if (user instanceof NextResponse) return user

  const data = await req.json()

  const settings = await prisma.brandingSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...data,
    },
    update: data,
  })

  return NextResponse.json(settings)
}
