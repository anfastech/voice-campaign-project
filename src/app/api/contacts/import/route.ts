import { NextRequest, NextResponse } from 'next/server'
import { importContacts } from '@/lib/services/contact-service'
import Papa from 'papaparse'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text = await file.text()
    const { data } = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })

    const result = await importContacts(data)
    return NextResponse.json(result)
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 })
  }
}
