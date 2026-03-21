import type { VoiceProviderService } from './types'
import { elevenLabsProvider } from './elevenlabs'
import { elevenLabsMcpProvider } from './elevenlabs-mcp'

export { elevenLabsProvider } from './elevenlabs'
export { elevenLabsMcpProvider } from './elevenlabs-mcp'
export * from './types'

function getElevenLabsProvider(): VoiceProviderService {
  if (process.env.USE_ELEVENLABS_MCP === 'true') {
    return elevenLabsMcpProvider
  }
  return elevenLabsProvider
}

const elevenlabs = getElevenLabsProvider()

export function getProvider(providerName?: string): VoiceProviderService {
  if (providerName && providerName.toUpperCase() !== 'ELEVENLABS') {
    console.warn(`Provider "${providerName}" is not enabled, using ElevenLabs`)
  }
  return elevenlabs
}
