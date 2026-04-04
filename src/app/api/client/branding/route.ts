import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    if (user.role !== 'client') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch client-specific branding
    const clientBranding = await prisma.clientBranding.findUnique({
      where: { clientId: user.id },
    })

    // Fetch admin's default branding as fallback
    const adminBranding = await prisma.brandingSettings.findUnique({
      where: { userId: user.adminUserId! },
    })

    // Merge: client values override admin defaults
    const resolved = {
      platformName: clientBranding?.platformName || adminBranding?.platformName || 'Voice Platform',
      logoUrl: clientBranding?.logoUrl || adminBranding?.logoUrl || null,
      primaryColor: clientBranding?.primaryColor || adminBranding?.primaryColor || '#171717',
      accentColor: clientBranding?.accentColor || adminBranding?.accentColor || '#3b82f6',
    }

    return NextResponse.json(resolved)
  } catch (error) {
    console.error('Client branding GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 })
  }
}
