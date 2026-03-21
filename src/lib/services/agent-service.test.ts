import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    agent: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

// Mock providers
vi.mock('@/lib/providers', () => ({
  getProvider: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { getProvider } from '@/lib/providers'
import { createAgent } from './agent-service'

const mockPrisma = vi.mocked(prisma)
const mockGetProvider = vi.mocked(getProvider)

describe('createAgent — sync error handling (Fix 2)', () => {
  beforeEach(() => {
    mockGetProvider.mockReturnValue({
      providerName: 'ELEVENLABS',
      createAgent: vi.fn(),
      createCall: vi.fn(),
      getCall: vi.fn(),
    })
  })

  it('returns syncStatus "failed" and syncError when provider throws', async () => {
    const fakeAgent = { id: 'a1', name: 'Test', provider: 'ELEVENLABS', systemPrompt: 'Hi', firstMessage: null, voice: 'rachel', language: 'en', maxDuration: 300 }
    mockPrisma.agent.create.mockResolvedValue(fakeAgent as never)

    const provider = mockGetProvider()
    vi.mocked(provider.createAgent!).mockRejectedValue(new Error('MCP connection failed'))

    const result = await createAgent({ name: 'Test', systemPrompt: 'Hi' })

    expect(result).toHaveProperty('syncStatus', 'failed')
    expect(result).toHaveProperty('syncError', 'MCP connection failed')
  })

  it('returns "Unknown sync error" for non-Error throws', async () => {
    const fakeAgent = { id: 'a2', name: 'Test', provider: 'ELEVENLABS', systemPrompt: 'Hi', firstMessage: null, voice: 'rachel', language: 'en', maxDuration: 300 }
    mockPrisma.agent.create.mockResolvedValue(fakeAgent as never)

    const provider = mockGetProvider()
    vi.mocked(provider.createAgent!).mockRejectedValue('string error')

    const result = await createAgent({ name: 'Test', systemPrompt: 'Hi' })

    expect(result).toHaveProperty('syncStatus', 'failed')
    expect(result).toHaveProperty('syncError', 'Unknown sync error')
  })

  it('returns elevenLabsAgentId on successful sync', async () => {
    const fakeAgent = { id: 'a3', name: 'Test', provider: 'ELEVENLABS', systemPrompt: 'Hi', firstMessage: null, voice: 'rachel', language: 'en', maxDuration: 300 }
    mockPrisma.agent.create.mockResolvedValue(fakeAgent as never)
    mockPrisma.agent.update.mockResolvedValue({ ...fakeAgent, elevenLabsAgentId: 'el-123' } as never)

    const provider = mockGetProvider()
    vi.mocked(provider.createAgent!).mockResolvedValue({ providerAgentId: 'el-123' })

    const result = await createAgent({ name: 'Test', systemPrompt: 'Hi' })

    expect(result).not.toHaveProperty('syncStatus')
    expect(result).toHaveProperty('elevenLabsAgentId', 'el-123')
  })
})

describe('createAgent — firstMessage flow (Fix 3)', () => {
  beforeEach(() => {
    mockGetProvider.mockReturnValue({
      providerName: 'ELEVENLABS',
      createAgent: vi.fn().mockResolvedValue({ providerAgentId: 'el-456' }),
      createCall: vi.fn(),
      getCall: vi.fn(),
    })
    mockPrisma.agent.update.mockResolvedValue({} as never)
  })

  it('passes firstMessage to prisma.agent.create', async () => {
    const fakeAgent = { id: 'a4', name: 'Test', provider: 'ELEVENLABS', systemPrompt: 'Hi', firstMessage: 'Welcome!', voice: 'rachel', language: 'en', maxDuration: 300 }
    mockPrisma.agent.create.mockResolvedValue(fakeAgent as never)

    await createAgent({ name: 'Test', systemPrompt: 'Hi', firstMessage: 'Welcome!' })

    expect(mockPrisma.agent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstMessage: 'Welcome!',
        }),
      })
    )
  })

  it('passes firstMessage to provider.createAgent', async () => {
    const fakeAgent = { id: 'a5', name: 'Test', provider: 'ELEVENLABS', systemPrompt: 'Hi', firstMessage: 'Welcome!', voice: 'rachel', language: 'en', maxDuration: 300 }
    mockPrisma.agent.create.mockResolvedValue(fakeAgent as never)

    await createAgent({ name: 'Test', systemPrompt: 'Hi', firstMessage: 'Welcome!' })

    const provider = mockGetProvider()
    expect(provider.createAgent).toHaveBeenCalledWith(
      expect.objectContaining({ firstMessage: 'Welcome!' })
    )
  })

  it('passes undefined to provider when firstMessage is null in DB', async () => {
    const fakeAgent = { id: 'a6', name: 'Test', provider: 'ELEVENLABS', systemPrompt: 'Hi', firstMessage: null, voice: 'rachel', language: 'en', maxDuration: 300 }
    mockPrisma.agent.create.mockResolvedValue(fakeAgent as never)

    await createAgent({ name: 'Test', systemPrompt: 'Hi' })

    const provider = mockGetProvider()
    expect(provider.createAgent).toHaveBeenCalledWith(
      expect.objectContaining({ firstMessage: undefined })
    )
  })
})
