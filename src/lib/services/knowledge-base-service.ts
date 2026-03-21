import { prisma } from '@/lib/prisma'
import { elevenLabsProvider } from '@/lib/providers/elevenlabs'

export async function listDocuments(userId: string) {
  return prisma.knowledgeBaseDocument.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function addTextDocument(userId: string, name: string, content: string) {
  if (!name?.trim()) throw new Error('Name is required')
  if (!content?.trim()) throw new Error('Content is required')

  const doc = await prisma.knowledgeBaseDocument.create({
    data: { userId, name, type: 'TEXT', content, syncStatus: 'PENDING' },
  })

  try {
    const elevenLabsDocId = await elevenLabsProvider.uploadKBText(name, content)
    return prisma.knowledgeBaseDocument.update({
      where: { id: doc.id },
      data: { elevenLabsDocId, syncStatus: 'SYNCED', syncError: null },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.knowledgeBaseDocument.update({
      where: { id: doc.id },
      data: { syncStatus: 'FAILED', syncError: message },
    })
    throw err
  }
}

export async function addUrlDocument(userId: string, name: string, url: string) {
  if (!name?.trim()) throw new Error('Name is required')
  if (!url?.trim()) throw new Error('URL is required')

  const doc = await prisma.knowledgeBaseDocument.create({
    data: { userId, name, type: 'URL', url, syncStatus: 'PENDING' },
  })

  try {
    const elevenLabsDocId = await elevenLabsProvider.uploadKBUrl(name, url)
    return prisma.knowledgeBaseDocument.update({
      where: { id: doc.id },
      data: { elevenLabsDocId, syncStatus: 'SYNCED', syncError: null },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.knowledgeBaseDocument.update({
      where: { id: doc.id },
      data: { syncStatus: 'FAILED', syncError: message },
    })
    throw err
  }
}

export async function addFileDocument(
  userId: string,
  name: string,
  fileBuffer: Buffer,
  fileName: string
) {
  if (!name?.trim()) throw new Error('Name is required')

  const doc = await prisma.knowledgeBaseDocument.create({
    data: { userId, name, type: 'FILE', fileName, syncStatus: 'PENDING' },
  })

  try {
    const elevenLabsDocId = await elevenLabsProvider.uploadKBFile(name, fileBuffer, fileName)
    return prisma.knowledgeBaseDocument.update({
      where: { id: doc.id },
      data: { elevenLabsDocId, syncStatus: 'SYNCED', syncError: null },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await prisma.knowledgeBaseDocument.update({
      where: { id: doc.id },
      data: { syncStatus: 'FAILED', syncError: message },
    })
    throw err
  }
}

export async function retrySyncDocument(userId: string, id: string) {
  const doc = await prisma.knowledgeBaseDocument.findFirst({ where: { id, userId } })
  if (!doc) throw new Error('Document not found')

  await prisma.knowledgeBaseDocument.update({
    where: { id },
    data: { syncStatus: 'PENDING', syncError: null },
  })

  try {
    let elevenLabsDocId: string
    if (doc.type === 'TEXT') {
      if (!doc.content) throw new Error('Document has no content')
      elevenLabsDocId = await elevenLabsProvider.uploadKBText(doc.name, doc.content)
    } else if (doc.type === 'URL') {
      if (!doc.url) throw new Error('Document has no URL')
      elevenLabsDocId = await elevenLabsProvider.uploadKBUrl(doc.name, doc.url)
    } else {
      throw new Error('File re-upload is not supported; please delete and re-add the document')
    }

    return prisma.knowledgeBaseDocument.update({
      where: { id },
      data: { elevenLabsDocId, syncStatus: 'SYNCED', syncError: null },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return prisma.knowledgeBaseDocument.update({
      where: { id },
      data: { syncStatus: 'FAILED', syncError: message },
    })
  }
}

export async function deleteDocument(userId: string, id: string) {
  const doc = await prisma.knowledgeBaseDocument.findFirst({
    where: { id, userId },
  })

  if (!doc) throw new Error('Document not found')

  if (doc.elevenLabsDocId) {
    try {
      await elevenLabsProvider.deleteKBDocument(doc.elevenLabsDocId)
    } catch (err) {
      console.error('Failed to delete KB doc from ElevenLabs:', err)
    }
  }

  await prisma.knowledgeBaseDocument.delete({ where: { id } })
}
