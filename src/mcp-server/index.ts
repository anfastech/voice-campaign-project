import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerCampaignTools } from './tools/campaign-tools'
import { registerAgentTools } from './tools/agent-tools'
import { registerAnalyticsTools } from './tools/analytics-tools'

const server = new McpServer({
  name: 'voice-campaign-platform',
  version: '1.0.0',
}, {
  instructions: 'Voice Campaign AI Platform — manage campaigns, agents, and view analytics for AI-powered outbound voice calling.',
  capabilities: {
    tools: {},
  },
})

// Register all tool groups
registerCampaignTools(server)
registerAgentTools(server)
registerAnalyticsTools(server)

// Start the server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Voice Campaign MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
