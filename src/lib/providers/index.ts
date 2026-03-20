import type { VoiceProviderService } from './types'
import { ultravoxProvider } from './ultravox'
import { elevenLabsProvider } from './elevenlabs'
import { elevenLabsMcpProvider } from './elevenlabs-mcp'
import { vapiProvider } from './vapi'

export { ultravoxProvider } from './ultravox'
export { elevenLabsProvider } from './elevenlabs'
export { elevenLabsMcpProvider } from './elevenlabs-mcp'
export { vapiProvider } from './vapi'
export * from './types'

type ProviderKey = 'ULTRAVOX' | 'ELEVENLABS' | 'VAPI'

function getElevenLabsProvider(): VoiceProviderService {
  if (process.env.USE_ELEVENLABS_MCP === 'true') {
    return elevenLabsMcpProvider
  }
  return elevenLabsProvider
}

const providers: Record<ProviderKey, VoiceProviderService> = {
  ULTRAVOX: ultravoxProvider,
  ELEVENLABS: getElevenLabsProvider(),
  VAPI: vapiProvider,
}

export function getProvider(providerName: string): VoiceProviderService {
  const key = (providerName || 'ULTRAVOX').toUpperCase() as ProviderKey
  const provider = providers[key]
  if (!provider) {
    console.warn(`Unknown provider "${providerName}", falling back to Ultravox`)
    return providers.ULTRAVOX
  }
  return provider
}
