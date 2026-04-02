import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  listAgents,
  createAgent,
  getAgent,
  updateAgent,
  deleteAgent,
  syncAgent,
  generateAgent,
} from '../../lib/services/agent-service'
import { getAdminUserIdForMcp } from '../utils'

export function registerAgentTools(server: McpServer) {
  server.registerTool('list_agents', {
    description: 'List all active voice AI agents',
  }, async () => {
    const userId = await getAdminUserIdForMcp()
    const agents = await listAgents(userId)
    return { content: [{ type: 'text' as const, text: JSON.stringify(agents, null, 2) }] }
  })

  server.registerTool('create_agent', {
    description: 'Create a new voice AI agent with system prompt, voice, and provider configuration',
    inputSchema: {
      name: z.string().min(1),
      description: z.string().optional(),
      systemPrompt: z.string().min(1),
      provider: z.enum(['ELEVENLABS']).optional().default('ELEVENLABS'),
      voice: z.string().optional(),
      language: z.string().optional(),
      temperature: z.number().min(0).max(1).optional(),
      maxDuration: z.number().int().min(30).max(3600).optional(),
    },
  }, async (args) => {
    const userId = await getAdminUserIdForMcp()
    const agent = await createAgent(userId, args)
    return { content: [{ type: 'text' as const, text: JSON.stringify(agent, null, 2) }] }
  })

  server.registerTool('get_agent', {
    description: 'Get detailed information about a specific agent including recent calls',
    inputSchema: {
      id: z.string(),
    },
  }, async (args) => {
    const agent = await getAgent(args.id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(agent, null, 2) }] }
  })

  server.registerTool('update_agent', {
    description: 'Update an existing voice AI agent. Changes are synced to ElevenLabs if the agent is registered.',
    inputSchema: {
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      systemPrompt: z.string().optional(),
      voice: z.string().optional(),
      language: z.string().optional(),
      temperature: z.number().min(0).max(1).optional(),
      maxDuration: z.number().int().min(30).max(3600).optional(),
      firstMessage: z.string().optional(),
    },
  }, async (args) => {
    const { id, ...data } = args
    const agent = await updateAgent(id, data)
    return { content: [{ type: 'text' as const, text: JSON.stringify(agent, null, 2) }] }
  })

  server.registerTool('delete_agent', {
    description: 'Soft-delete a voice AI agent. Also removes the agent from ElevenLabs if synced.',
    inputSchema: {
      id: z.string(),
    },
  }, async (args) => {
    await deleteAgent(args.id)
    return { content: [{ type: 'text' as const, text: JSON.stringify({ success: true, id: args.id }) }] }
  })

  server.registerTool('sync_agent', {
    description: 'Manually sync an agent to ElevenLabs. Creates the agent on ElevenLabs if not yet synced, or updates it if already synced.',
    inputSchema: {
      id: z.string(),
    },
  }, async (args) => {
    const result = await syncAgent(args.id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  })

  server.registerTool('generate_agent', {
    description: 'AI-generate a voice agent configuration from a natural language description. Uses Claude to create optimal name, system prompt, voice, and provider settings.',
    inputSchema: {
      description: z.string().min(1).describe('Description of what the agent should do'),
    },
  }, async (args) => {
    const config = await generateAgent(args.description)
    return { content: [{ type: 'text' as const, text: JSON.stringify(config, null, 2) }] }
  })
}
