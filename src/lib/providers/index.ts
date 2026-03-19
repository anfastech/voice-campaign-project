import type { VoiceProviderService } from './types'
import { ultravoxProvider } from './ultravox'
import { elevenLabsProvider } from './elevenlabs'
import { vapiProvider } from './vapi'

export { ultravoxProvider } from './ultravox'
export { elevenLabsProvider } from './elevenlabs'
export { vapiProvider } from './vapi'
export * from './types'

type ProviderKey = 'ULTRAVOX' | 'ELEVENLABS' | 'VAPI'

const providers: Record<ProviderKey, VoiceProviderService> = {
  ULTRAVOX: ultravoxProvider,
  ELEVENLABS: elevenLabsProvider,
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
