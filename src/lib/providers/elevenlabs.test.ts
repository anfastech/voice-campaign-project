import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ElevenLabsProvider } from './elevenlabs'

describe('ElevenLabsProvider.createCall — outbound endpoint (Fix 1)', () => {
  let provider: ElevenLabsProvider
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    provider = new ElevenLabsProvider()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('ELEVENLABS_API_KEY', 'test-key')
    vi.stubEnv('ELEVENLABS_PHONE_NUMBER_ID', 'phone-123')
  })

  it('calls /convai/twilio/outbound-call endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ conversation_id: 'conv-1' }),
    })

    await provider.createCall({
      systemPrompt: 'Test prompt',
      phoneNumber: '+1234567890',
      providerAgentId: 'agent-abc',
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('/convai/twilio/outbound-call')
    expect(url).not.toContain('/convai/conversations/outbound')
  })

  it('creates throwaway agent first when no providerAgentId', async () => {
    // First call: create agent
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ agent_id: 'throwaway-agent' }),
    })
    // Second call: outbound call
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ conversation_id: 'conv-2' }),
    })

    await provider.createCall({
      systemPrompt: 'Test prompt',
      phoneNumber: '+1234567890',
      // no providerAgentId
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [firstUrl] = fetchMock.mock.calls[0]
    const [secondUrl] = fetchMock.mock.calls[1]
    expect(firstUrl).toContain('/convai/agents')
    expect(secondUrl).toContain('/convai/twilio/outbound-call')
  })

  it('passes correct body fields', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ conversation_id: 'conv-3' }),
    })

    await provider.createCall({
      systemPrompt: 'Test prompt',
      phoneNumber: '+1234567890',
      providerAgentId: 'agent-xyz',
    })

    const [, options] = fetchMock.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body).toEqual({
      agent_id: 'agent-xyz',
      agent_phone_number_id: 'phone-123',
      to_number: '+1234567890',
    })
  })
})
