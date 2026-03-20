import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  listCampaigns,
  createCampaign,
  getCampaign,
  startCampaign,
  pauseCampaign,
} from '../../lib/services/campaign-service'

export function registerCampaignTools(server: McpServer) {
  server.registerTool('list_campaigns', {
    description: 'List voice campaigns with optional status filter and pagination',
    inputSchema: {
      status: z.enum(['DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
      page: z.number().int().positive().optional(),
      limit: z.number().int().positive().max(100).optional(),
    },
  }, async (args) => {
    const result = await listCampaigns({
      status: args.status,
      page: args.page,
      limit: args.limit,
    })
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  })

  server.registerTool('create_campaign', {
    description: 'Create a new voice campaign with an agent and contacts',
    inputSchema: {
      name: z.string().min(1),
      description: z.string().optional(),
      agentId: z.string(),
      contactIds: z.array(z.string()),
      scheduledAt: z.string().optional(),
      maxRetries: z.number().int().min(0).max(10).optional(),
      retryDelayMinutes: z.number().int().min(1).max(1440).optional(),
      callsPerMinute: z.number().int().min(1).max(60).optional(),
    },
  }, async (args) => {
    const campaign = await createCampaign(args)
    return { content: [{ type: 'text' as const, text: JSON.stringify(campaign, null, 2) }] }
  })

  server.registerTool('get_campaign', {
    description: 'Get detailed information about a specific campaign including contacts and calls',
    inputSchema: {
      id: z.string(),
    },
  }, async (args) => {
    const campaign = await getCampaign(args.id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(campaign, null, 2) }] }
  })

  server.registerTool('start_campaign', {
    description: 'Start a campaign — begins making outbound calls to pending contacts',
    inputSchema: {
      id: z.string(),
    },
  }, async (args) => {
    const result = await startCampaign(args.id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
  })

  server.registerTool('pause_campaign', {
    description: 'Pause a running campaign — stops making new calls',
    inputSchema: {
      id: z.string(),
    },
  }, async (args) => {
    const campaign = await pauseCampaign(args.id)
    return { content: [{ type: 'text' as const, text: JSON.stringify(campaign, null, 2) }] }
  })
}
