export interface ProviderStatus {
  name: string
  configured: boolean
  latency: string
  pct: number
}

async function ping(url: string, headers: Record<string, string>): Promise<number | null> {
  try {
    const start = Date.now()
    const res = await fetch(url, { method: 'GET', headers, signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return Date.now() - start
  } catch {
    return null
  }
}

export async function checkProviderHealth(): Promise<ProviderStatus[]> {
  const results: ProviderStatus[] = []

  // Ultravox
  const ultravoxKey = process.env.ULTRAVOX_API_KEY
  const ultravoxBase = process.env.ULTRAVOX_BASE_URL || 'https://api.ultravox.ai/api'
  if (ultravoxKey) {
    const ms = await ping(`${ultravoxBase}/accounts/me`, { 'X-API-Key': ultravoxKey })
    results.push({
      name: 'Ultravox',
      configured: true,
      latency: ms !== null ? `${ms}ms` : 'err',
      pct: ms !== null ? Math.min(100, Math.max(0, 100 - Math.floor(ms / 10))) : 0,
    })
  } else {
    results.push({ name: 'Ultravox', configured: false, latency: '\u2014', pct: 0 })
  }

  // ElevenLabs
  const elKey = process.env.ELEVENLABS_API_KEY
  if (elKey) {
    const ms = await ping('https://api.elevenlabs.io/v1/user', { 'xi-api-key': elKey })
    results.push({
      name: 'ElevenLabs',
      configured: true,
      latency: ms !== null ? `${ms}ms` : 'err',
      pct: ms !== null ? Math.min(100, Math.max(0, 100 - Math.floor(ms / 10))) : 0,
    })
  } else {
    results.push({ name: 'ElevenLabs', configured: false, latency: '\u2014', pct: 0 })
  }

  // VAPI
  const vapiKey = process.env.VAPI_API_KEY
  if (vapiKey) {
    const ms = await ping('https://api.vapi.ai/call?limit=1', { Authorization: `Bearer ${vapiKey}` })
    results.push({
      name: 'VAPI',
      configured: true,
      latency: ms !== null ? `${ms}ms` : 'err',
      pct: ms !== null ? Math.min(100, Math.max(0, 100 - Math.floor(ms / 10))) : 0,
    })
  } else {
    results.push({ name: 'VAPI', configured: false, latency: '\u2014', pct: 0 })
  }

  return results
}
