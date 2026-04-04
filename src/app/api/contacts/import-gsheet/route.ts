import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'
import { importContacts } from '@/lib/services/contact-service'
import Papa from 'papaparse'

const SHEET_ID_REGEX = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    const userId = user.role === 'admin' ? user.id : user.adminUserId!

    const { url, name: sheetName } = await req.json()
    const match = url?.match(SHEET_ID_REGEX)
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid Google Sheets URL' },
        { status: 400 }
      )
    }

    const sheetId = match[1]
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`

    let csvText: string
    try {
      const res = await fetch(csvUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      csvText = await res.text()
    } catch {
      return NextResponse.json(
        {
          error:
            'Could not fetch Google Sheet. Make sure it is shared publicly (Anyone with the link can view).',
        },
        { status: 400 }
      )
    }

    const { data } = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
    })

    const sourceName = sheetName?.trim() || `GSheet Import ${new Date().toLocaleDateString('en-GB')}`
    const result = await importContacts(userId, data, { sourceName, sourceType: 'gsheet' })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Google Sheet import error:', error)
    return NextResponse.json(
      { error: 'Failed to import contacts from Google Sheet' },
      { status: 500 }
    )
  }
}
