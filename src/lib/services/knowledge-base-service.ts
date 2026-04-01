import { prisma } from '@/lib/prisma'
import { elevenLabsMcpProvider as elevenLabsProvider } from '@/lib/providers/elevenlabs-mcp'

export async function listDocuments(userId: string, agentId?: string) {
  return prisma.knowledgeBaseDocument.findMany({
    where: { userId, ...(agentId ? { agentId } : {}) },
    orderBy: { createdAt: 'desc' },
  })
}

async function getOrCreateFolder(userId: string, folderName: string): Promise<string> {
  const existing = await prisma.knowledgeBaseDocument.findFirst({
    where: { userId, folderName, folderElevenLabsId: { not: null } },
    select: { folderElevenLabsId: true },
  })
  if (existing?.folderElevenLabsId) return existing.folderElevenLabsId
  return elevenLabsProvider.createKBFolder(folderName)
}

export async function addTextDocument(userId: string, name: string, content: string, folderName?: string, agentId?: string) {
  if (!name?.trim()) throw new Error('Name is required')
  if (!content?.trim()) throw new Error('Content is required')

  let folderElevenLabsId: string | undefined
  if (folderName?.trim()) {
    folderElevenLabsId = await getOrCreateFolder(userId, folderName.trim())
  }

  const doc = await prisma.knowledgeBaseDocument.create({
    data: { userId, name, type: 'TEXT', content, syncStatus: 'PENDING', folderName: folderName?.trim() || null, folderElevenLabsId: folderElevenLabsId || null, agentId: agentId || null },
  })

  try {
    const elevenLabsDocId = await elevenLabsProvider.uploadKBText(name, content, folderElevenLabsId)
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

export async function addUrlDocument(userId: string, name: string, url: string, folderName?: string, agentId?: string) {
  if (!name?.trim()) throw new Error('Name is required')
  if (!url?.trim()) throw new Error('URL is required')

  let folderElevenLabsId: string | undefined
  if (folderName?.trim()) {
    folderElevenLabsId = await getOrCreateFolder(userId, folderName.trim())
  }

  const doc = await prisma.knowledgeBaseDocument.create({
    data: { userId, name, type: 'URL', url, syncStatus: 'PENDING', folderName: folderName?.trim() || null, folderElevenLabsId: folderElevenLabsId || null, agentId: agentId || null },
  })

  try {
    const elevenLabsDocId = await elevenLabsProvider.uploadKBUrl(name, url, folderElevenLabsId)
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
  fileName: string,
  folderName?: string,
  agentId?: string
) {
  if (!name?.trim()) throw new Error('Name is required')

  let folderElevenLabsId: string | undefined
  if (folderName?.trim()) {
    folderElevenLabsId = await getOrCreateFolder(userId, folderName.trim())
  }

  const doc = await prisma.knowledgeBaseDocument.create({
    data: { userId, name, type: 'FILE', fileName, syncStatus: 'PENDING', folderName: folderName?.trim() || null, folderElevenLabsId: folderElevenLabsId || null, agentId: agentId || null },
  })

  try {
    const elevenLabsDocId = await elevenLabsProvider.uploadKBFile(name, fileBuffer, fileName, folderElevenLabsId)
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
    const parentFolderId = doc.folderElevenLabsId ?? undefined
    if (doc.type === 'TEXT') {
      if (!doc.content) throw new Error('Document has no content')
      elevenLabsDocId = await elevenLabsProvider.uploadKBText(doc.name, doc.content, parentFolderId)
    } else if (doc.type === 'URL') {
      if (!doc.url) throw new Error('Document has no URL')
      elevenLabsDocId = await elevenLabsProvider.uploadKBUrl(doc.name, doc.url, parentFolderId)
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
