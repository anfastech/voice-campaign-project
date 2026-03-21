import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

interface PooledConnection {
  client: Client
  transport: StdioClientTransport
  lastUsed: number
  healthy: boolean
}

const MAX_POOL_SIZE = 3
const IDLE_TIMEOUT_MS = 60_000

let pool: PooledConnection[] = []
let cleanupTimer: ReturnType<typeof setInterval> | null = null

export function getServerCommand(): { command: string; args: string[] } {
  const custom = process.env.ELEVENLABS_MCP_COMMAND
  if (custom) {
    const parts = custom.split(' ')
    return { command: parts[0], args: parts.slice(1) }
  }
  return {
    command: 'npx',
    args: ['-y', '@anthropic-ai/elevenlabs-mcp-server@latest'],
  }
}

async function createConnection(): Promise<PooledConnection> {
  const { command, args } = getServerCommand()

  const transport = new StdioClientTransport({
    command,
    args,
    env: {
      ...process.env as Record<string, string>,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
    },
    stderr: 'pipe',
  })

  const client = new Client(
    { name: 'voice-campaign-platform', version: '1.0.0' },
  )

  await client.connect(transport)

  const conn: PooledConnection = {
    client,
    transport,
    lastUsed: Date.now(),
    healthy: true,
  }

  transport.onclose = () => {
    conn.healthy = false
  }

  return conn
}

function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    pool = pool.filter((conn) => {
      if (!conn.healthy || now - conn.lastUsed > IDLE_TIMEOUT_MS) {
        conn.client.close().catch(() => {})
        return false
      }
      return true
    })
    if (pool.length === 0 && cleanupTimer) {
      clearInterval(cleanupTimer)
      cleanupTimer = null
    }
  }, 15_000)
}

export async function getElevenLabsMcpClient(): Promise<Client> {
  // Find a healthy idle connection
  const idle = pool.find((c) => c.healthy)
  if (idle) {
    idle.lastUsed = Date.now()
    return idle.client
  }

  // Create new connection if pool not full
  if (pool.length < MAX_POOL_SIZE) {
    const conn = await createConnection()
    pool.push(conn)
    startCleanup()
    return conn.client
  }

  // Pool full, evict oldest and create new
  const oldest = pool.shift()
  if (oldest) {
    oldest.client.close().catch(() => {})
  }
  const conn = await createConnection()
  pool.push(conn)
  return conn.client
}

export async function closeAllConnections(): Promise<void> {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
  }
  await Promise.allSettled(pool.map((c) => c.client.close()))
  pool = []
}
