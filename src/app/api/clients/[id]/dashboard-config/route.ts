import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'
import { resolveDashboardConfig, dashboardConfigSchema } from '@/lib/dashboard-config'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    if (user instanceof NextResponse) return user
    const { id } = await params

    const client = await prisma.client.findFirst({
      where: { id, userId: user.id },
      select: { dashboardConfig: true },
    })
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    return NextResponse.json(resolveDashboardConfig(client.dashboardConfig))
  } catch (error) {
    console.error('Dashboard config GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
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

    const client = await prisma.client.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    })
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const body = await req.json()
    const parsed = dashboardConfigSchema.parse(body)

    // Resolve the full config to store (merge with defaults)
    const resolved = resolveDashboardConfig(parsed)

    await prisma.client.update({
      where: { id },
      data: { dashboardConfig: resolved as any },
    })

    return NextResponse.json(resolved)
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json({ error: 'Invalid config', details: (error as any).issues }, { status: 400 })
    }
    console.error('Dashboard config PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}
