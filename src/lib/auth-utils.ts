import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export interface SessionUser {
  id: string
  name?: string | null
  email?: string | null
  role: 'admin' | 'client'
  adminUserId?: string
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth()
  if (!session?.user) return null
  return session.user as unknown as SessionUser
}

export async function getAdminUserId(): Promise<string | null> {
  const user = await getSessionUser()
  if (!user) return null
  return user.role === 'admin' ? user.id : user.adminUserId ?? null
}

export async function requireAuth(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return user
}

export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return user
}
