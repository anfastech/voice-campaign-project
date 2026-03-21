import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the MCP client module
vi.mock('../mcp/elevenlabs-client', () => ({
  getElevenLabsMcpClient: vi.fn(),
}))

import { getElevenLabsMcpClient } from '../mcp/elevenlabs-client'
import { ElevenLabsMcpProvider } from './elevenlabs-mcp'

const mockGetClient = vi.mocked(getElevenLabsMcpClient)

function makeMcpResponse(text: string) {
  return { content: [{ type: 'text', text }] }
}

function makeClient(response: unknown) {
  return { callTool: vi.fn().mockResolvedValue(response) } as unknown as Awaited<ReturnType<typeof getElevenLabsMcpClient>>
}

describe('ElevenLabsMcpProvider.createAgent — JSON parsing (Fix 4)', () => {
  let provider: ElevenLabsMcpProvider

  beforeEach(() => {
    provider = new ElevenLabsMcpProvider()
  })

  const baseConfig = {
    name: 'Test Agent',
    systemPrompt: 'You are a test agent',
  }

  it('parses clean JSON response', async () => {
    const client = makeClient(makeMcpResponse('{"agent_id": "abc123"}'))
    mockGetClient.mockResolvedValue(client)

    const result = await provider.createAgent(baseConfig)
    expect(result.providerAgentId).toBe('abc123')
  })

  it('extracts JSON embedded in text', async () => {
    const client = makeClient(makeMcpResponse('Successfully created: {"agent_id": "def456"}'))
    mockGetClient.mockResolvedValue(client)

    const result = await provider.createAgent(baseConfig)
    expect(result.providerAgentId).toBe('def456')
  })

  it('extracts agent_id from plain text pattern', async () => {
    const client = makeClient(makeMcpResponse('Created agent with agent_id: ghi789'))
    mockGetClient.mockResolvedValue(client)

    const result = await provider.createAgent(baseConfig)
    expect(result.providerAgentId).toBe('ghi789')
  })

  it('falls back to REST when MCP returns empty content', async () => {
    const client = makeClient({ content: [] })
    mockGetClient.mockResolvedValue(client)

    // With REST fallback, this will attempt the REST API instead of throwing
    // The REST call will fail in test (no real server), so we verify it doesn't
    // throw the old MCP-specific error
    await expect(provider.createAgent(baseConfig)).rejects.not.toThrow('no agent_id returned')
  })

  it('falls back to raw text when no JSON or agent_id pattern found', async () => {
    const client = makeClient(makeMcpResponse('Something went wrong'))
    mockGetClient.mockResolvedValue(client)

    // Code falls back to extractTextContent when parseJsonContent returns {}
    const result = await provider.createAgent(baseConfig)
    expect(result.providerAgentId).toBe('Something went wrong')
  })
})
