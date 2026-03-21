import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerCommand } from './elevenlabs-client'

describe('getServerCommand', () => {
  beforeEach(() => {
    delete process.env.ELEVENLABS_MCP_COMMAND
  })

  it('returns @anthropic-ai/elevenlabs-mcp-server@latest by default', () => {
    const { command, args } = getServerCommand()
    expect(command).toBe('npx')
    expect(args).toContain('@anthropic-ai/elevenlabs-mcp-server@latest')
  })

  it('does NOT use the old @angelogiacco package', () => {
    const { args } = getServerCommand()
    const joined = args.join(' ')
    expect(joined).not.toContain('@angelogiacco')
  })

  it('respects ELEVENLABS_MCP_COMMAND env var', () => {
    vi.stubEnv('ELEVENLABS_MCP_COMMAND', 'node /custom/server.js --port 3000')
    const { command, args } = getServerCommand()
    expect(command).toBe('node')
    expect(args).toEqual(['/custom/server.js', '--port', '3000'])
    vi.unstubAllEnvs()
  })
})
