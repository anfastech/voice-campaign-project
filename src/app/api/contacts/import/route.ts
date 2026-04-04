import { NextRequest, NextResponse } from 'next/server'
import { importContacts } from '@/lib/services/contact-service'
import { requireAuth } from '@/lib/auth-utils'
import Papa from 'papaparse'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    const userId = user.role === 'admin' ? user.id : user.adminUserId!

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text = await file.text()
    const { data } = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })

    // Use filename without extension as the group name
    const fileName = file.name?.replace(/\.[^.]+$/, '') || `CSV Import ${new Date().toLocaleDateString('en-GB')}`
    const result = await importContacts(userId, data, { sourceName: fileName, sourceType: 'csv' })
    return NextResponse.json(result)
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 })
  }
}
