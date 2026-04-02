import { NextRequest, NextResponse } from 'next/server'
import { listDocuments, addTextDocument, addUrlDocument, addFileDocument } from '@/lib/services/knowledge-base-service'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    const userId = user.role === 'admin' ? user.id : user.adminUserId!

    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId') ?? undefined
    const docs = await listDocuments(userId, agentId)
    return NextResponse.json({ documents: docs })
  } catch (error) {
    console.error('KB list error:', error)
    return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user instanceof NextResponse) return user
    const userId = user.role === 'admin' ? user.id : user.adminUserId!

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const name = (formData.get('name') as string)?.trim()
      const file = formData.get('file') as File | null
      const folderName = (formData.get('folderName') as string | null) ?? undefined
      const agentId = (formData.get('agentId') as string | null) ?? undefined

      if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
      if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })

      const buffer = Buffer.from(await file.arrayBuffer())
      try {
        const doc = await addFileDocument(userId, name, buffer, file.name, folderName, agentId)
        return NextResponse.json({ document: doc }, { status: 201 })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ElevenLabs sync failed'
        // The doc was saved to DB; return 207 so UI can show the record with FAILED status
        const { listDocuments: list } = await import('@/lib/services/knowledge-base-service')
        const docs = await list(userId, agentId)
        const doc = docs[0] // most recent
        return NextResponse.json({ document: doc, syncError: message }, { status: 207 })
      }
    }

    const body = await req.json()
    const { type, name, content, url, folderName, agentId } = body

    if (!type || !name) {
      return NextResponse.json({ error: 'type and name are required' }, { status: 400 })
    }

    if (type === 'TEXT') {
      if (!content) return NextResponse.json({ error: 'content is required for TEXT type' }, { status: 400 })
      try {
        const doc = await addTextDocument(userId, name, content, folderName, agentId)
        return NextResponse.json({ document: doc }, { status: 201 })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ElevenLabs sync failed'
        const docs = await listDocuments(userId, agentId)
        const doc = docs[0]
        return NextResponse.json({ document: doc, syncError: message }, { status: 207 })
      }
    }

    if (type === 'URL') {
      if (!url) return NextResponse.json({ error: 'url is required for URL type' }, { status: 400 })
      try {
        const doc = await addUrlDocument(userId, name, url, folderName, agentId)
        return NextResponse.json({ document: doc }, { status: 201 })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ElevenLabs sync failed'
        const docs = await listDocuments(userId, agentId)
        const doc = docs[0]
        return NextResponse.json({ document: doc, syncError: message }, { status: 207 })
      }
    }

    return NextResponse.json({ error: 'type must be TEXT or URL (use multipart for FILE)' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create document'
    console.error('KB create error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
