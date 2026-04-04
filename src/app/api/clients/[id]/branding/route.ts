import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const brandingSchema = z.object({
  platformName: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user
    const { id } = await params

    const branding = await prisma.clientBranding.findUnique({ where: { clientId: id } })
    return NextResponse.json(branding || {})
  } catch (error) {
    console.error('Client branding GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user
    const { id } = await params

    // Verify client belongs to admin
    const client = await prisma.client.findFirst({ where: { id, userId: user.id } })
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const body = await req.json()
    const data = brandingSchema.parse(body)

    const branding = await prisma.clientBranding.upsert({
      where: { clientId: id },
      create: { clientId: id, ...data },
      update: data,
    })

    return NextResponse.json(branding)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 })
    }
    console.error('Client branding PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
  }
}
