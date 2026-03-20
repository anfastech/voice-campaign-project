import { NextResponse } from 'next/server'
import { checkProviderHealth } from '@/lib/services/provider-health-service'

export async function GET() {
  const results = await checkProviderHealth()
  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  })
}
