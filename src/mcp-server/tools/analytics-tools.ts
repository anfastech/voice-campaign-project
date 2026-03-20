import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  getStats,
  getCampaignPerformance,
  getCostBreakdown,
} from '../../lib/services/analytics-service'

export function registerAnalyticsTools(server: McpServer) {
  server.registerTool('get_dashboard_stats', {
    description: 'Get real-time dashboard statistics: total calls, active campaigns, success rate, costs, and recent activity',
  }, async () => {
    const stats = await getStats()
    return { content: [{ type: 'text' as const, text: JSON.stringify(stats, null, 2) }] }
  })

  server.registerTool('get_campaign_performance', {
    description: 'Get detailed performance metrics for a specific campaign including status breakdown, success rate, duration, and costs',
    inputSchema: {
      campaignId: z.string(),
    },
  }, async (args) => {
    const performance = await getCampaignPerformance(args.campaignId)
    return { content: [{ type: 'text' as const, text: JSON.stringify(performance, null, 2) }] }
  })

  server.registerTool('get_cost_breakdown', {
    description: 'Get cost analysis grouped by provider, campaign, or day',
    inputSchema: {
      from: z.string().optional().describe('Start date (ISO 8601)'),
      to: z.string().optional().describe('End date (ISO 8601)'),
      groupBy: z.enum(['provider', 'campaign', 'day']).describe('How to group the cost data'),
    },
  }, async (args) => {
    const breakdown = await getCostBreakdown(args)
    return { content: [{ type: 'text' as const, text: JSON.stringify(breakdown, null, 2) }] }
  })
}
