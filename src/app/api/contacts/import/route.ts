import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Papa from 'papaparse'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const text = await file.text()
    const { data } = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })

    const results = await Promise.allSettled(
      data.map(async (row) => {
        const phoneNumber = (row.phone_number || row.phoneNumber || row.phone || row.Phone || '').trim()
        if (!phoneNumber) return null

        return prisma.contact.upsert({
          where: { userId_phoneNumber: { userId: 'default-user', phoneNumber } },
          update: {
            name: row.name || row.Name || undefined,
            email: row.email || row.Email || undefined,
          },
          create: {
            phoneNumber,
            name: row.name || row.Name || undefined,
            email: row.email || row.Email || undefined,
            tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
            userId: 'default-user',
          },
        })
      })
    )

    const imported = results.filter(r => r.status === 'fulfilled' && r.value !== null).length
    const failed = results.filter(r => r.status === 'rejected').length

    return NextResponse.json({ imported, failed, total: data.length })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ error: 'Failed to import contacts' }, { status: 500 })
  }
}
