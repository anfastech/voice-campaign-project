# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Bidirectional ElevenLabs agent sync** — Agents created/updated/deleted in the dashboard are now automatically synced to ElevenLabs. The `AgentConfig` interface and optional `createAgent`/`updateAgent`/`deleteAgent` lifecycle methods were added to `VoiceProviderService`. Both ElevenLabs providers (MCP + HTTP) implement the full lifecycle. The agent-service layer orchestrates sync on every create, update, and delete. A new `syncAgent` function allows manual re-sync of agents missing their `elevenLabsAgentId`. (`src/lib/providers/types.ts`, `src/lib/providers/elevenlabs.ts`, `src/lib/providers/elevenlabs-mcp.ts`, `src/lib/services/agent-service.ts`)
- **Persistent agents in campaign calls** — Campaign calls now reuse the persistent `elevenLabsAgentId` stored on the agent instead of creating a throwaway ElevenLabs agent for every call. Falls back to throwaway creation when no synced ID exists. (`src/lib/services/campaign-service.ts`)
- **MCP tools: `update_agent`, `delete_agent`, `sync_agent`** — Three new MCP tools for full agent lifecycle management via Claude Code. (`src/mcp-server/tools/agent-tools.ts`)
- **ElevenLabs sync status in dashboard** — Agent list page shows a "Synced"/"Not synced" badge next to the provider label. Agent detail page shows a sync status row with the ElevenLabs agent ID. (`src/app/(dashboard)/agents/page.tsx`, `src/app/(dashboard)/agents/[id]/page.tsx`)
- **ElevenLabs MCP server in `.mcp.json`** — Added `elevenlabs` MCP server entry for direct Claude Code access to ElevenLabs tools. (`.mcp.json`)
- **Seed registers agent with ElevenLabs** — The seed script now creates the Creeto Welcome agent on ElevenLabs and stores the `elevenLabsAgentId` in the database. (`prisma/seed.ts`)

### Changed
- **Clean DB & seed Creeto Welcome agent** — Seed script now hard-deletes stale calls, campaign-contacts, campaigns, and agents (FK-safe order) before re-seeding. Creates a single "Creeto Welcome" agent (ElevenLabs, voice: rachel) with a professional system prompt for greeting inbound prospects and qualifying interest. Prisma config updated to use `npx tsx` as the seed command. (`prisma/seed.ts`, `prisma.config.ts`)
- **ElevenLabs-only provider mode** — Disabled ULTRAVOX, VAPI, and LIVEKIT providers; platform now defaults to ElevenLabs everywhere. Agent creation UI no longer shows a provider picker, default voice changed from `Mark` to `rachel`, provider registry always returns ElevenLabs, test-call endpoint returns informational message (phone-based calling only). Prisma schema default updated with migration. Provider files kept for future re-enablement.

### Fixed
- **Outbound call endpoint returns 405** — The REST provider used `/convai/conversations/outbound` which returns "Method Not Allowed". Changed to the correct `/convai/twilio/outbound-call` endpoint. (`src/lib/providers/elevenlabs.ts`)
- **Agent ElevenLabs sync errors silently swallowed** — `createAgent()` caught provider sync errors with only `console.error`, leaving `elevenLabsAgentId` null with no indication to the user. Now returns `syncStatus: 'failed'` and `syncError` in the response. API route returns HTTP 207 (Multi-Status) when the agent is saved but sync fails. (`src/lib/services/agent-service.ts`, `src/app/api/agents/route.ts`)
- **`firstMessage` not passed to database** — The `createAgent` input type was missing `firstMessage`, so the UI-collected value was silently dropped. Added to the input type. (`src/lib/services/agent-service.ts`)
- **MCP `parseJsonContent` fails on non-JSON responses** — If the ElevenLabs MCP server returns text instead of JSON, `parseJsonContent` returned `{}` silently. Now attempts to extract embedded JSON or agent IDs from text, and logs warnings on parse failure. (`src/lib/providers/elevenlabs-mcp.ts`)
- **MCP package name mismatch** — The hardcoded fallback used `@angelogiacco/elevenlabs-mcp-server` but `.mcp.json` uses `@anthropic-ai/elevenlabs-mcp-server@latest`. Aligned the fallback to match. (`src/lib/mcp/elevenlabs-client.ts`)
- **Contact deletion foreign key constraint error** — Deleting a contact linked to a campaign failed with Prisma error `P2003` (foreign key constraint violated on `CampaignContact_contactId_fkey`). The `deleteContact` function now uses a Prisma transaction to delete related `CampaignContact` records before deleting the contact itself, ensuring both deletions succeed or both roll back. (`src/lib/services/contact-service.ts`)

## [1.0.0] - Initial Release

### Added
- Voice Campaign AI Platform with dashboard
- Campaign management (create, start, pause)
- Agent management with ElevenLabs integration
- Contact management with CSV import
- Analytics API routes
- Platform MCP server with 12 tools for campaigns, agents, analytics
- ElevenLabs MCP adapter with connection pool
- Service layer architecture with thin API route wrappers
