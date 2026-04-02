# Changelog

All notable changes to this project will be documented in this file.

## [2026-04-03] — White-Label Branding Settings

### Added
- **api/branding/route.ts** — GET/PATCH API for branding settings (platform name, logo URL, favicon URL, primary/accent colors). Admin-only, upserts per user.
- **branding/page.tsx** — Admin branding page with platform identity card (name, logo, favicon), color pickers with hex input, live preview strip, and reset-to-defaults button.

## [2026-04-03] — Client Management UI

### Added
- **clients/page.tsx** — Client list page with card-per-client layout, active/inactive toggle badge, delete button, agent count badge, and empty state.
- **clients/new/page.tsx** — New client form with name, email, password, company name, and notes fields. Redirects to detail page on success.
- **clients/[id]/page.tsx** — Client detail page with client info card, password reset section, agent assignment toggle list, and danger zone for deletion.
- **Sidebar** — Added "Clients" nav item with Building2 icon between "Your Agents" and "Settings".

## [2026-04-03] — NextAuth Credentials Auth for Admin & Client Login

### Added
- **auth.ts** — NextAuth v5 configuration with two Credentials providers (`admin-login` and `client-login`). JWT-based sessions with role/userId/adminUserId claims.
- **auth-utils.ts** — Helper functions: `getSessionUser`, `getAdminUserId`, `requireAuth`, `requireAdmin` for use in API routes and server components.
- **[...nextauth]/route.ts** — API route handler exporting GET/POST from NextAuth handlers.
- **Providers.tsx** — Wrapped app in `SessionProvider` from `next-auth/react` for client-side session access.

## [2026-04-02] — shadcn/ui Clean Dashboard Overhaul

### Changed
- **globals.css** — Stripped all glassmorphism, mesh-bg, gradient-text, glow, shimmer, and live-dot utilities. Replaced oklch color palette with clean hex neutral palette.
- **Sidebar** — Rebuilt as clean white sidebar with shadcn primitives (Separator, cn). Removed decorative gradient blobs and inline styles.
- **Header** — Simplified to minimal title + date/refresh/theme-toggle. Removed breadcrumbs, notification bell, user menu, and subtitle pill.
- **Analytics page** — Replaced 6 KPI cards with 4 clean StatCard components. Replaced gradient date selector with shadcn Buttons. Replaced inline-styled tables with Tailwind classes.
- **VolumeChart** — Converted from stacked bar chart to line chart with shadcn Card wrapper.
- **OutcomeChart** — Wrapped in shadcn Card, replaced oklch colors with CSS variables.
- **CallChart** — Converted to smooth line chart with Latest/Previous comparison.
- **Agents pages** — Replaced gradient buttons with shadcn Button, cards with shadcn Card, form inputs with shadcn Input/Textarea/Select/Switch/Slider/Label.
- **Contacts page** — Replaced inline styles with Tailwind, buttons with shadcn Button, badges with shadcn Badge, inputs with shadcn Input.
- **Campaigns page** — Replaced gradient filter tabs and action buttons with shadcn Button, cards with shadcn Card.
- **Conversations page** — Replaced status badges with Tailwind classes, search/filter with shadcn Input/Select, table rows with hover:bg-muted.
- **Settings page** — Replaced custom toggles with shadcn Switch, wrapped sections in shadcn Card with Separator.
- **Knowledge Base page** — Replaced form inputs with shadcn Input/Textarea/Select, status badges with shadcn Badge, buttons with shadcn Button.

### Added
- **stat-card.tsx** — New reusable StatCard component with trend badges, built on shadcn Card.

## [2026-04-02] — Fix Self-Cancelling Calls (3-Second Drop)

### Fixed
- **APP_URL pointed to dead ngrok tunnel** — Updated from stale ngrok URL to Vercel deployment (`https://voice-agents-dun.vercel.app`). ElevenLabs post-call webhooks were being sent to an unreachable URL, leaving calls stuck in `INITIATED` status.
- **Stuck INITIATED calls cleaned up** — Marked 2 orphaned calls (`cmnh1gtuz`, `cmnh635k6`) as `FAILED` with explanatory error message via SQL.

### Added
- **Agent diagnose API route** (`GET /api/agents/[id]/diagnose`) — Fetches ElevenLabs agent config and recent conversation details to debug call failures. Shows webhook URL mismatch, termination reasons, and transcript data.

## [Unreleased]

### Added — Contacts: Groups, Agent Assignment, Sidebar

- **Schema** (`prisma/schema.prisma`) — Added three new models: `ContactGroup` (folder-like groups per user), `ContactGroupMember` (many-to-many contact↔group), `ContactAgentAssignment` (many-to-many contact↔agent). Added reverse relations to `Contact`, `Agent`, and `User`. Applied via `npx prisma db push`.
- **Contact Group Service** (`src/lib/services/contact-group-service.ts`) — New service with `listContactGroups`, `createContactGroup`, `updateContactGroup`, `deleteContactGroup`, `addContactsToGroup`, `removeContactsFromGroup`.
- **Contact Service** (`src/lib/services/contact-service.ts`) — Extended `listContacts` with `groupId`, `agentId`, `tag`, `doNotCall` filters (fixed previously broken tag/DNC params). `getContact` and `listContacts` now include `groupMemberships` and `agentAssignments` in their includes. `deleteContact` now cleans up group memberships and agent assignments before deleting. Added `assignContactsToAgent` and `unassignContactsFromAgent` helpers.
- **API Routes** — Four new routes: `GET/POST /api/contact-groups`, `PATCH/DELETE /api/contact-groups/[id]`, `POST/DELETE /api/contact-groups/[id]/members`, `POST /api/contacts/bulk` (bulk ops: addToGroup, removeFromGroup, assignAgent, unassignAgent, delete, markDnc, unmarkDnc). Updated `GET /api/contacts` to pass `groupId`, `agentId`, `tag`, `doNotCall` params through to the service.
- **Sidebar** (`src/components/layout/Sidebar.tsx`) — Added "Contacts" as 6th nav item (position 3, between Conversations and Knowledge Base) with `Users` icon.
- **ContactGroupSidebar** (`src/components/contacts/ContactGroupSidebar.tsx`) — Left panel (220px) showing "All Contacts", "Shared", and each group with member count, plus inline rename/delete and a "New Group" button.
- **GroupManageDialog** (`src/components/contacts/GroupManageDialog.tsx`) — Modal for creating or renaming a contact group (name + description).
- **AgentAssignDialog** (`src/components/contacts/AgentAssignDialog.tsx`) — Modal for assigning a selection of contacts to a specific agent.
- **BulkActionsBar** (`src/components/contacts/BulkActionsBar.tsx`) — Floating bottom bar that appears when contacts are selected; supports Add to Group, Assign Agent, Mark DNC, and Delete in bulk.
- **Contacts Page** (`src/app/(dashboard)/contacts/page.tsx`) — Full rewrite: group sidebar on the left, agent filter dropdown in toolbar, checkbox column for bulk selection, Groups column (max 2 chips + "+N"), Agent column ("Shared" badge or agent name chips), bulk actions bar, contact detail drawer shows groups and agent assignments.
- **Campaign Creation** (`src/app/(dashboard)/campaigns/new/page.tsx`) — Step 3 (Select Contacts) now shows Group and Agent filter dropdowns above the contact list so users can pre-filter by group or agent assignment.

### Fixed — Contacts: Tag and DNC Filters

- `listContacts` in `contact-service.ts` previously ignored `tag` and `doNotCall` params passed from the API route. Both filters are now correctly applied (`tags: { has: tag }` and `doNotCall: boolean`).

### Fixed — Phase 0: Prisma Schema Mismatch

- **DB schema synced** — Ran `npx prisma db push` to align the database with `prisma/schema.prisma`. Columns `backchannel`, `voiceId`, `evaluationCriteria`, `dataCollection`, `interruptionSensitivity`, `ambientSound` on `Agent` and `folderName`, `folderElevenLabsId`, `syncStatus`, `syncError` on `KnowledgeBaseDocument` now exist in the database, resolving P2022 errors on the agents page.

### Added — Phase 3.1-3.4: Per-Agent Knowledge Base (Backend)

- **Schema** (`prisma/schema.prisma`) — Added `agentId String?` and `agent Agent? @relation(...)` to `KnowledgeBaseDocument` model with `@@index([agentId])`. Added `knowledgeBaseDocuments KnowledgeBaseDocument[]` reverse relation to `Agent` model. Applied via `npx prisma db push`.
- **KB service** (`src/lib/services/knowledge-base-service.ts`) — `listDocuments(userId, agentId?)` now accepts optional `agentId` filter. `addTextDocument`, `addUrlDocument`, `addFileDocument` each accept optional `agentId` and pass it to `prisma.create()`.
- **Agent service** (`src/lib/services/agent-service.ts`) — `createAgent()` and `syncAgent()` now scope KB doc queries to `agentId: agent.id` instead of all user docs.
- **KB API** (`src/app/api/knowledge-base/route.ts`) — GET accepts `?agentId=X` query param; POST accepts optional `agentId` in request body.
- **Agent KB API** (`src/app/api/agents/[id]/knowledge-base/route.ts`) — New GET endpoint returning KB documents scoped to a specific agent.

### Changed — Phase 5: Settings Simplification

- **Settings API** (`src/app/api/settings/route.ts`) — Replaced named provider objects (ElevenLabs, Ultravox, VAPI, Anthropic, Twilio) with generic `integrations` object containing `voiceEngine`, `aiModel`, and `telephony` keys with just a `connected` boolean each.
- **Settings page** (`src/app/(dashboard)/settings/page.tsx`) — Replaced 5 named provider cards with 3 generic integration cards: "Voice Engine", "AI Model", "Telephony". Removed "Environment" section that named providers. Merged "Appearance" (theme toggle) and "Notifications" sections from the former account page.
- **Account redirect** (`src/app/(dashboard)/account/page.tsx`) — `/account` now server-redirects to `/settings`.

### Changed — Phase 4: Agent Pages — Prompt-First UX Overhaul

#### 4.1 Agent Creation Form (`src/app/(dashboard)/agents/new/page.tsx`)
- Reordered manual form sections: **Mode toggle → Identity → System Prompt → First Message → Voice & Style → Knowledge Base → Advanced**.
- **System Prompt** is now the most prominent section: highlighted with a thicker purple border (`2px solid`) and outer glow, `min-height: 200px`, bold heading, and a "Required" pill badge.
- **Identity** section now lays Name and Description side-by-side in a 2-column grid.
- **Voice & Style** section merges the former "Voice & Language" and "Advanced Settings" and "Voice Behavior" sections into one card: voice picker (from `VOICE_OPTIONS`), language, temperature slider, max duration, interruption sensitivity, backchannel toggle, and ambient sound.
- **Knowledge Base** section replaced the old toggle + KB count card with a placeholder note ("Documents can be added from the agent detail page after creation") plus a simple `useKnowledgeBase` toggle — no longer fetches KB count here.
- **Advanced** section (Evaluation Criteria + Data Collection) is now a collapsible disclosure collapsed by default, using `advancedOpen` state and a `ChevronDown` icon. Added `ChevronDown` to lucide-react imports.
- Removed "ElevenLabs ConvAI Features" heading (was absent already); no "Powered by" text anywhere.

#### 4.2 Agent Detail Page (`src/app/(dashboard)/agents/[id]/page.tsx`)
- **System Prompt hero section** inserted as the first content block (before the Config card): prominent card with 2px purple border + glow, `min-height: 150px`, `max-height: 320px` overflow scroll, `text-xs font-mono` at full foreground color.
- The old inline system prompt display inside the Config card was removed (no longer duplicated).
- Added `BarChart2` to lucide-react imports.
- Added **`['agent-campaigns', id]`** React Query fetching `/api/campaigns?agentId=${id}`, extracting `campaignsData.campaigns`.
- New **Campaigns section** placed after Knowledge Base, before Agent Tools:
  - Header with BarChart2 icon, campaign count badge, and "New Campaign" button linking to `/campaigns/new?agentId=${id}`.
  - Per-campaign rows showing name, status badge (color-coded), and a progress bar (`calls / contacts` count).
  - Empty state with "No campaigns yet" text and a "Create Campaign" gradient button.

#### 4.3 Agent List Page (`src/app/(dashboard)/agents/page.tsx`)
- System prompt preview: increased from `text-[11px] line-clamp-2` to **`text-xs line-clamp-3`**.
- Added **campaign count stat** in the stats row (shows only when `agent._count?.campaigns != null`) with a BarChart2 icon.
- Added `BarChart2` to lucide-react imports.

#### API / Services
- **`src/lib/services/agent-service.ts`** — `listAgents` now includes `campaigns: true` in `_count.select` (was only `calls`).
- **`src/lib/services/campaign-service.ts`** — `listCampaigns` accepts optional `agentId` param and adds `{ agentId }` to the Prisma `where` clause when provided.
- **`src/app/api/campaigns/route.ts`** — Reads `agentId` from `searchParams` and passes it to `listCampaigns`.

### Changed — Phase 3.5–3.6: KB Agent Filter + Agent Detail KB Section

- **Knowledge base page** (`src/app/(dashboard)/knowledge-base/page.tsx`) — Added per-agent filtering and agent assignment to the global KB document page.
  - Added `agentFilter` state (`'all' | 'unassigned' | <agentId>`). Added `['agents-list']` React Query (fetches `/api/agents`, `staleTime: 60000`) to populate filter options.
  - Added an **agent filter dropdown** in the page header (alongside the title) with options: "All Documents", "Unassigned", and one option per agent. When `agentFilter` is a specific agent ID, appends `?agentId=${agentFilter}` to the KB fetch URL. When `agentFilter === 'unassigned'`, fetches all docs then filters client-side by `!doc.agentId`.
  - Query key is now `['knowledge-base', agentFilter]` so switching filters triggers a fresh fetch.
  - Extended `KBDoc` type to include `agentId?: string | null`.
  - Added **"Assign to Agent" dropdown** inside the Add Document form (all three tab types). Optional — defaults to none/global. Passes `agentId` in the JSON body or as a FormData field when set.
  - Added **agent badge** on each document row: when `doc.agentId` is set, looks up the agent name from the agents list and renders a small purple badge with a Bot icon next to the doc name.

- **Agent detail page** (`src/app/(dashboard)/agents/[id]/page.tsx`) — Replaced the `useKnowledgeBase` boolean toggle section with a full inline KB document management section.
  - Added `['agent-kb', id]` React Query fetching `/api/agents/${id}/knowledge-base` (returns a flat array). Added `KBDoc` type for the response shape.
  - Added `createDocMutation` (POST to `/api/knowledge-base` with `{ agentId: id, type, name, content/url }`) and `deleteDocMutation` (DELETE to `/api/knowledge-base/${docId}`), both invalidating `['agent-kb', id]` on success.
  - Added KB form state: `kbFormOpen`, `kbActiveTab` (TEXT/URL), `kbTextForm`, `kbUrlForm`, `kbError`.
  - New **Knowledge Base section** placed after the Config card and before the Custom Tools section:
    - Header row with BookOpen icon, "Knowledge Base" title, doc count badge, and "Add Document" / "Close" toggle button.
    - Inline add form (toggled) with TEXT/URL tab switcher, name + content/URL fields, error display, and a gradient submit button.
    - Document list showing icon, name, type badge, date, and a delete button per row.
    - Empty state when no documents are assigned.
  - Removed the old `useKnowledgeBase` toggle switch card (the section that showed the boolean toggle and "Manage documents" link).
  - Added `DOC_TYPE_ICONS` / `DOC_TYPE_LABELS` maps. Added `FileText`, `Type`, and `Link as LinkIcon` to the lucide-react imports.

### Changed — Phase 2: Analytics Page — Dashboard KPI Merge

- **Analytics page** (`src/app/(dashboard)/analytics/page.tsx`) — Merged dashboard KPIs into the analytics page, which now serves as the single home page (replacing the old `/dashboard` stub).
  - Added two new React Query hooks: `['dashboard-stats', datePreset]` fetching `/api/dashboard/stats?period=X` and `['dashboard-chart', datePreset]` fetching `/api/dashboard/chart?period=X`.
  - Added a **Dashboard KPI row** (4 `StatsCard` components) placed immediately after the date selector showing Total Calls, Successful Calls, Avg Duration, and Total Cost for the selected period, each with period-over-period trend badges sourced from `period.trends.*` on the stats API response.
  - Added a **`ConversationChart`** component (imported from `src/components/dashboard/ConversationChart.tsx`) showing latest-vs-previous-period call volume area comparison, using `dataKey="total"` / `previousKey="previousTotal"` from the chart API.
  - Added a **`RecentActivity`** component (imported from `src/components/dashboard/RecentActivity.tsx`) at the bottom of the page, fed `recentCalls` from the dashboard stats API.
  - Removed unused `Calendar` import from lucide-react.
  - All existing 6 analytics KPI cards and all charts/tables are preserved unchanged.

### Changed — Phase 1.6-1.9: Provider Name Removal

- **types.ts** (`src/lib/providers/types.ts`) — Added `VOICE_OPTIONS` export (mapped from `PROVIDER_VOICES.ELEVENLABS`) for generic voice list consumption without importing provider-specific identifiers.
- **layout.tsx** (`src/app/layout.tsx`) — Metadata description no longer mentions "Ultravox, ElevenLabs, and VAPI"; changed to "AI-powered outbound voice campaign management platform".
- **Landing page** (`src/app/page.tsx`) — Removed `providers` array and the "Integrates with" trust bar section. Hero badge changed from "Powered by Ultravox · ElevenLabs · VAPI" to "Powered by Advanced AI". Feature card description no longer names specific AI providers. Removed unused `Globe` import.
- **Agents list page** (`src/app/(dashboard)/agents/page.tsx`) — Removed `PROVIDER_META` import. Removed `provider`/`providerMeta` variables inside agent map. Removed provider badge. Replaced dynamic provider colors with fixed generic purple (`oklch(0.49 0.263 281)`). Sync badge now shows "Deployed"/"Draft" instead of "Synced"/"Not synced". Empty state no longer mentions ElevenLabs.
- **Agent detail page** (`src/app/(dashboard)/agents/[id]/page.tsx`) — Removed `PROVIDER_META` import, `provider`/`meta` variables, and provider badge in header. "ElevenLabs Sync Status" section renamed to "Agent Status"; status text shows "Deployed"/"Not deployed"; button label changed to "Deploy Agent" / "Re-sync". KB description changed from "ElevenLabs config" to "agent config".
- **New agent page** (`src/app/(dashboard)/agents/new/page.tsx`) — Import changed to `VOICE_OPTIONS` from `PROVIDER_VOICES, PROVIDER_META`. Removed `provider`, `voices`, `providerMeta` variables. Voice select uses `VOICE_OPTIONS` directly. Removed "Powered by {providerMeta.label}" subtitle. Section comment renamed "ElevenLabs ConvAI Features" → "Advanced Features".
- **Agent test page** (`src/app/(dashboard)/agents/[id]/test/page.tsx`) — Removed `PROVIDER_META` import and `provider`/`meta` variables. All `meta.color`/`meta.bg`/`meta.label` references replaced with fixed generic accent (`oklch(0.49 0.263 281)`). Provider badge shows "AI Agent". Status text and live bar no longer show provider names. Test Setup table removed "Provider" row. VAPI-specific key warning removed.
- **Knowledge base page** (`src/app/(dashboard)/knowledge-base/page.tsx`) — Error message changed from "ElevenLabs sync failed. Check your API key or try again." to "Sync failed. Check your API key or try again."
- **Analytics page** (`src/app/(dashboard)/analytics/page.tsx`) — Removed "Provider" column from Agent Comparison table header and body. Updated `exportAgents` CSV function accordingly. Fixed `colSpan` from 7 to 6.
- **Campaign detail page** (`src/app/(dashboard)/campaigns/[id]/page.tsx`) — Comment `// Auto-sync: poll ElevenLabs every 30s` changed to `// Auto-sync: poll provider every 30s`.

### Changed — Phase 1.1-1.5: UX Overhaul — Sidebar, Header, Navigation

- **Sidebar redesigned** (`src/components/layout/Sidebar.tsx`) — Replaced 10-item nav with 5 focused items: Analytics, Conversations, Knowledge Base, Your Agents, Settings. Removed the bottom "Providers Active" status card. Active check for `/analytics` also matches `/dashboard` for redirect compatibility.
- **Header updated** (`src/components/layout/Header.tsx`) — Removed `/dashboard`, `/workflows`, `/live` page meta entries. Added `/conversations` meta. Updated `/agents` subtitle to "Your configured AI agents". "View all activity" link now points to `/conversations`. UserMenu "Account" click now navigates to `/settings`.
- **Conversations page created** (`src/app/(dashboard)/conversations/page.tsx`) — Full-featured call history page (copied from former calls page) with updated function name `ConversationsPage`, "conversations" count label, "Start a campaign to generate conversations." empty state, and CSV export filename `conversations-`.
- **Dashboard redirect** (`src/app/(dashboard)/dashboard/page.tsx`) — `/dashboard` now server-redirects to `/analytics`.
- **Calls redirect** (`src/app/(dashboard)/calls/page.tsx`) — `/calls` now server-redirects to `/conversations`.

### Added — Phase 7: Account & Settings

- **Settings page** (`/settings`) — API key management with masked display and show/hide toggle for ElevenLabs, Ultravox, VAPI, Anthropic, and Twilio. Webhook configuration display with event documentation. Usage dashboard showing total calls, minutes, cost, agents, campaigns, and contacts. Environment info section. (`src/app/(dashboard)/settings/page.tsx`, `src/app/api/settings/route.ts`)
- **Account page** (`/account`) — User profile editor with name, email, timezone. Theme selector (light/dark/system) with visual previews. Notification preferences with toggle switches for campaign completion, call failures, daily digest, and weekly reports. Security section placeholder. (`src/app/(dashboard)/account/page.tsx`)
- **Settings API** (`GET /api/settings`) — Returns provider configuration status (masked keys), webhook config, and usage aggregates from the database. (`src/app/api/settings/route.ts`)

### Added — Phase 8: Real-time & Polish

- **Live Monitor page** (`/live`) — Real-time call monitoring with 3-second auto-refresh polling. Shows active calls with elapsed time, running campaigns with progress bars, queued contacts count, and a recent calls feed (last 5 minutes). Status badges with live-dot animations for in-progress calls. (`src/app/(dashboard)/live/page.tsx`, `src/app/api/live/route.ts`)
- **Notification dropdown** — Bell icon in header now opens a dropdown showing the 5 most recent call events with status icons (completed/failed/no answer), contact names, agent info, and timestamps. Links to full call history. (`src/components/layout/Header.tsx`)
- **User menu enhanced** — Added Settings link to the user avatar dropdown menu. (`src/components/layout/Header.tsx`)

### Changed — Dashboard Enhanced (chat-dash.com style)

- **Period comparison** — Dashboard now supports date range selection (Today, 7D, 30D, 90D) with a tab-style period selector. All KPI cards and charts update based on selected period. (`src/app/(dashboard)/dashboard/page.tsx`)
- **Trend percentages** — KPI cards show period-over-period trend badges with up/down arrows and color coding (green for positive, red for negative). Compares current period against the previous equivalent period. (`src/app/(dashboard)/dashboard/page.tsx`)
- **"Latest vs Previous" comparison charts** — New `ConversationChart` component renders area charts with solid line for current period and dashed line for previous period, matching chat-dash.com's comparison visualization. Two charts: Call Volume and Successful Calls. (`src/components/dashboard/ConversationChart.tsx`)
- **Updated timestamp with refresh** — Dashboard shows "Updated [time]" with a manual refresh button, matching chat-dash.com. (`src/app/(dashboard)/dashboard/page.tsx`)
- **Analytics service period comparison** — `getStats()` and `getChartData()` now accept a `period` parameter and return comparison data (current vs previous period metrics and trend percentages). (`src/lib/services/analytics-service.ts`)
- **Dashboard API routes** — `/api/dashboard/stats` and `/api/dashboard/chart` now accept `?period=7d` query parameter. (`src/app/api/dashboard/stats/route.ts`, `src/app/api/dashboard/chart/route.ts`)

### Fixed

- **TypeScript error in `updateCallMetadata`** — Fixed type error where `Record<string, unknown>` was not assignable to Prisma's `NullableJsonNullValueInput`. (`src/lib/services/call-service.ts`)

### Fixed — Agent not answering from knowledge base

- **Auto-inject KB instruction into system prompt** — when an agent has `useKnowledgeBase: true` and KB documents are linked, a standard knowledge base consultation instruction is automatically appended to the system prompt before it is sent to ElevenLabs (at create and sync time). The stored system prompt is unchanged — the instruction is injected only at the provider call level. Agents that already mention "knowledge base" in their prompt are not affected (deduplication check). (`src/lib/services/agent-service.ts`)

### Fixed — "Calling..." badge stuck after call ends

- **Periodic auto-sync added** — the campaign detail page now triggers an ElevenLabs status sync every 30 seconds while the campaign is RUNNING, so call statuses update even when the webhook doesn't fire. (`src/app/(dashboard)/campaigns/[id]/page.tsx`)
- **Immediate sync on page load** — navigating to an already-running campaign now triggers an instant sync instead of waiting for the user to click Sync manually. (`src/app/(dashboard)/campaigns/[id]/page.tsx`)
- **Live-status badges refresh immediately after sync** — previously, after clicking Sync, badges could take up to 10 seconds to update; now they refresh as soon as the sync completes. (`src/app/(dashboard)/campaigns/[id]/page.tsx`)

### Fixed — PDF and file uploads to Knowledge Base

- **Blob MIME type now set from file extension** — `uploadKBFile` in both `elevenlabs.ts` and `elevenlabs-mcp.ts` previously created a `Blob` without a `type`, causing ElevenLabs to receive an unknown Content-Type and reject the upload with 400 "invalid_file_type". The fix infers the correct MIME type from the file extension (pdf → `application/pdf`, docx → `application/vnd...docx`, etc.) and passes it to the Blob constructor. (`src/lib/providers/elevenlabs.ts`, `src/lib/providers/elevenlabs-mcp.ts`)

### Changed — KB toggle in AI generation step

- **AI agent generation now accepts a `useKnowledgeBase` flag** — when enabled, the generated `systemPrompt` is tailored to instruct the agent to consult the knowledge base for specific information. (`src/lib/services/agent-service.ts`, `src/app/api/agents/generate/route.ts`)
- **Added KB toggle to the AI generation step in `/agents/new`** — users can enable "Tailor for Knowledge Base" before clicking Generate; shows synced doc count or a link to add documents. State is preserved when AI generation switches to manual mode. (`src/app/(dashboard)/agents/new/page.tsx`)

### Added — Knowledge base selection during agent creation

- **`useKnowledgeBase` accepted at agent creation** — `POST /api/agents` Zod schema now includes `useKnowledgeBase: z.boolean().optional().default(false)`. (`src/app/api/agents/route.ts`)
- **KB docs included in initial ElevenLabs agent create** — `createAgent()` now fetches synced KB documents when `useKnowledgeBase=true` and passes them as `knowledge_base` to `provider.createAgent()`, mirroring the logic in `syncAgent()`. (`src/lib/services/agent-service.ts`)
- **Knowledge Base section on agent creation form** — `/agents/new` manual mode now shows a "Knowledge Base" card with a toggle. When enabled, displays the count of synced documents ("N documents will be included") or a link to `/knowledge-base` if none are synced yet. (`src/app/(dashboard)/agents/new/page.tsx`)

### Fixed — KB upload 404 errors (ElevenLabs API path change)

- **Removed `/documents/` prefix from all Knowledge Base endpoints** — ElevenLabs changed their API paths. Updated `uploadKBText`, `uploadKBUrl`, `uploadKBFile`, and `deleteKBDocument` in both `elevenlabs.ts` and `elevenlabs-mcp.ts` to use the new paths (`/convai/knowledge-base/text`, `/convai/knowledge-base/url`, `/convai/knowledge-base/file`, `/convai/knowledge-base/{id}`). (`src/lib/providers/elevenlabs.ts`, `src/lib/providers/elevenlabs-mcp.ts`)
- **Fixed response field `document_id` → `id`** — ElevenLabs now returns `id` instead of `document_id` in upload responses. All providers updated accordingly. MCP response parsing now checks `data.id ?? data.document_id` for backwards compatibility. (`src/lib/providers/elevenlabs.ts`, `src/lib/providers/elevenlabs-mcp.ts`)

### Added — ElevenLabs Knowledge Base folder support

- **Folder assignment for KB documents** — Documents can now be assigned to a named folder when uploading. A new `createKBFolder(name)` method on both providers calls `POST /convai/knowledge-base/folder` to create the folder in ElevenLabs and returns the folder ID. All three upload methods (`uploadKBText`, `uploadKBUrl`, `uploadKBFile`) accept an optional `parentFolderId` parameter. (`src/lib/providers/elevenlabs.ts`, `src/lib/providers/elevenlabs-mcp.ts`)
- **`folderName` and `folderElevenLabsId` fields on `KnowledgeBaseDocument`** — Two new optional fields stored in the DB. `folderName` is the user-visible label; `folderElevenLabsId` is the ID returned by ElevenLabs and reused for subsequent uploads to the same folder. Migration: `20260321154924_add_kb_folder`. (`prisma/schema.prisma`)
- **`getOrCreateFolder` helper in KB service** — Looks up an existing ElevenLabs folder ID for a given user+folderName (from existing DB records) before creating a new one, preventing duplicate folder creation. (`src/lib/services/knowledge-base-service.ts`)
- **Folder threaded through all add functions and retry** — `addTextDocument`, `addUrlDocument`, `addFileDocument` accept an optional `folderName` parameter and pass the resolved folder ID to the provider. `retrySyncDocument` re-uses the stored `folderElevenLabsId` so retried uploads land in the same folder. (`src/lib/services/knowledge-base-service.ts`)
- **API route accepts `folderName`** — `POST /api/knowledge-base` now extracts `folderName` from both JSON body and multipart FormData and passes it to service functions. (`src/app/api/knowledge-base/route.ts`)
- **Folder input in KB upload form** — Each tab (TEXT, URL, FILE) in the Knowledge Base page now has an optional "Folder (optional)" text input. Folder name is included in the request when provided. Documents with a folder name show a small folder badge next to the document name in the list. (`src/app/(dashboard)/knowledge-base/page.tsx`)

### Fixed — syncAgent 404 when ElevenLabs agent no longer exists

- **Stale `elevenLabsAgentId` no longer causes sync to fail** — `syncAgent` in `agent-service.ts` now catches 404/Not Found errors from `provider.updateAgent`. On a 404, it clears the stale `elevenLabsAgentId` from the database and falls through to the `createAgent` branch, re-creating the agent on ElevenLabs instead of surfacing an error to the user. (`src/lib/services/agent-service.ts`)

### Changed — Route KB ops through ElevenLabs MCP provider

- **KB uploads/deletes now route through MCP provider** — `knowledge-base-service.ts` now imports `elevenLabsMcpProvider` instead of the plain REST `elevenLabsProvider`. When `USE_ELEVENLABS_MCP=true`, text and URL uploads attempt the MCP tools (`add_knowledge_base_document_from_text`, `add_knowledge_base_document_from_url`) before falling back to REST. File uploads always use REST (binary data can't be JSON-serialised for MCP). Deletes attempt MCP `delete_knowledge_base_document` then fall back to REST. (`src/lib/services/knowledge-base-service.ts`, `src/lib/providers/elevenlabs-mcp.ts`)
- **Fix `updateAgent` in MCP provider silently dropping KB, tools, and webhook** — `ElevenLabsMcpProvider.updateAgent` now includes `knowledge_base` (in `conversation_config.agent`), `tools`, and `platform_settings.webhook` — matching the REST provider's behaviour. Agents synced with `USE_ELEVENLABS_MCP=true` will now have their knowledge base and webhook correctly set in ElevenLabs. (`src/lib/providers/elevenlabs-mcp.ts`)
- **Add `getWebhookUrl` helper to MCP provider** — Mirrors the helper in `elevenlabs.ts`; used by the fixed `updateAgent`. (`src/lib/providers/elevenlabs-mcp.ts`)

### Fixed — Knowledge Base sync error visibility

- **Human-readable ElevenLabs errors** — `elFetch` and `uploadKBFile` in `elevenlabs.ts` now parse the JSON error body returned by ElevenLabs and extract `detail` (string or object) instead of throwing the raw JSON string. E.g. `{"detail":"The URL could not be scraped."}` becomes `"The URL could not be scraped."`. A new `parseElError` helper handles all cases with a safe fallback. (`src/lib/providers/elevenlabs.ts`)
- **Error text no longer clipped in Knowledge Base list** — The doc list row was `flex items-center`, which prevented the row from growing when `SyncBadge` expanded with error text; the error paragraph was hidden by the outer `overflow-hidden` wrapper. Changed to `flex items-start` with `mt-0.5` on the icon and right-side buttons to keep visual alignment. Error text uses `text-xs break-words` (up from `text-[10px]`) for readability. A fallback message is shown when `syncError` is null. (`src/app/(dashboard)/knowledge-base/page.tsx`)

### Fixed — Knowledge Base sync status and retry

- **KB documents no longer stuck on "Pending"** — `addTextDocument`, `addUrlDocument`, and `addFileDocument` in `knowledge-base-service.ts` previously swallowed ElevenLabs upload errors and returned the original record with `elevenLabsDocId: null`. They now persist `syncStatus: 'FAILED'` and `syncError` on failure, then re-throw so the API route can surface the error. On success, `syncStatus: 'SYNCED'` is written alongside the `elevenLabsDocId`. (`src/lib/services/knowledge-base-service.ts`)
- **New `syncStatus` / `syncError` fields on `KnowledgeBaseDocument`** — Prisma schema extended with `syncStatus String @default("PENDING")` and `syncError String?`. Migration: `20260321134743_kb_sync_status`. (`prisma/schema.prisma`, `prisma/migrations/20260321134743_kb_sync_status/`)
- **`POST /api/knowledge-base/[id]` retry endpoint** — Calls `retrySyncDocument(userId, id)` which resets status to `PENDING`, re-runs the appropriate ElevenLabs upload, then updates the record to `SYNCED` or `FAILED`. File re-upload returns a descriptive error (delete and re-add required). (`src/app/api/knowledge-base/[id]/route.ts`, `src/lib/services/knowledge-base-service.ts`)
- **`POST /api/knowledge-base` returns HTTP 207 on partial failure** — Document is saved to the DB even when ElevenLabs upload fails; the response includes `{ document, syncError }` so the UI can display the record with its `FAILED` status. (`src/app/api/knowledge-base/route.ts`)
- **3-state sync badges + retry button in Knowledge Base UI** — Replaced binary Synced/Pending badge with `SYNCED` (green CheckCircle), `FAILED` (red XCircle with error tooltip), and `PENDING` (grey Clock). `FAILED` and `PENDING` docs show a `RefreshCw` retry button that calls the new sync endpoint with a `Loader2` spinner while in-flight. (`src/app/(dashboard)/knowledge-base/page.tsx`)
- **Sync error message shown as visible text** — The `syncError` string is now rendered as a small red paragraph directly below the "Sync Failed" badge instead of only being accessible via a hover tooltip. Users immediately see the ElevenLabs error (e.g. "ElevenLabs API 401: Unauthorized") without needing to hover. (`src/app/(dashboard)/knowledge-base/page.tsx`)

### Fixed — TypeScript compilation errors

- **Zod v4 `z.record` requires two arguments** — Updated `toolParametersSchema` in `agent-service.ts` to use `z.record(z.string(), z.unknown())` instead of `z.record(z.unknown())`. (`src/lib/services/agent-service.ts`)
- **`Prisma.InputJsonValue` cast for `parameters` in `updateAgentTool`** — Destructured `parameters` from `data` before spreading into the Prisma update call to correctly cast to `InputJsonValue`. (`src/lib/services/agent-service.ts`)
- **`Buffer<ArrayBufferLike>` not assignable to `BlobPart`** — Fixed `uploadKBFile` by extracting the underlying `ArrayBuffer` from the Node.js `Buffer` before passing to `new Blob([...])`. (`src/lib/providers/elevenlabs.ts`)
- **`unknown` not assignable to `ReactNode`** — Fixed short-circuit render expressions that returned `unknown` by adding `!!` prefix to boolean-coerce the condition. (`src/app/(dashboard)/agents/[id]/page.tsx`, `src/app/(dashboard)/campaigns/[id]/page.tsx`)

### Added — Sprint 1: Call Recording + Real-time Status UI

- **Call recording playback and download** — Completed calls with `has_audio = true` from ElevenLabs now set `recordingAvailable = true` on the `Call` record. A new proxy endpoint `GET /api/calls/[id]/recording` fetches the audio stream from ElevenLabs and forwards it with `Accept-Ranges: bytes` for browser seeking. The `TranscriptModal` shows an `<audio controls>` player and download link when `recordingAvailable` is true. (`prisma/schema.prisma`, `src/lib/providers/elevenlabs.ts`, `src/lib/services/campaign-sync-service.ts`, `src/lib/services/webhook-service.ts`, `src/app/api/calls/[id]/recording/route.ts`, `src/components/calls/TranscriptModal.tsx`)
- **Live-status API endpoint** — New lightweight `GET /api/campaigns/[id]/live-status` returns `{ campaignStatus, contacts[] }` with per-contact status using a minimal DB query (no heavy aggregations). (`src/app/api/campaigns/[id]/live-status/route.ts`)
- **Real-time animated contact badges** — Campaign detail page now polls `/live-status` every 10s while `RUNNING`, auto-stops on terminal statuses, and clears interval on unmount. `CALLING` contacts show a blue `animate-pulse` dot. The heavy `syncMutation` auto-poll is removed; a manual Sync button remains for on-demand full sync. (`src/app/(dashboard)/campaigns/[id]/page.tsx`)

### Added — Sprint 2: Shared Knowledge Base

- **Knowledge Base documents** — New `KnowledgeBaseDocument` model and `KBDocType` enum (TEXT/FILE/URL). Documents are uploaded to ElevenLabs once; their `elevenLabsDocId` is stored in the DB. When `useKnowledgeBase = true` on an agent, `syncAgent()` includes all synced doc IDs in the ElevenLabs agent config. (`prisma/schema.prisma`, `src/lib/providers/elevenlabs.ts`, `src/lib/services/knowledge-base-service.ts`, `src/lib/services/agent-service.ts`)
- **Knowledge Base API** — `GET/POST /api/knowledge-base` (list + create text/URL/file) and `DELETE /api/knowledge-base/[id]`. (`src/app/api/knowledge-base/route.ts`, `src/app/api/knowledge-base/[id]/route.ts`)
- **Knowledge Base management page** — New `/knowledge-base` page with tabs for Text, URL, and File uploads; document list with sync status badges and delete buttons. (`src/app/(dashboard)/knowledge-base/page.tsx`, `src/components/layout/Sidebar.tsx`)
- **Knowledge Base toggle on agent page** — Agent detail page includes a toggle to enable `useKnowledgeBase` with a link to the KB management page. (`src/app/(dashboard)/agents/[id]/page.tsx`)
- **`AgentConfig` extended** — Added `knowledge_base` and `tools` arrays to the `AgentConfig` interface. (`src/lib/providers/types.ts`)

### Added — Sprint 3: Conversation Webhooks

- **ElevenLabs webhook endpoint** — `POST /api/webhooks/elevenlabs` verifies HMAC-SHA256 signatures (header `ElevenLabs-Signature: t=<ts>,v0=<hex>`, secret from `ELEVENLABS_WEBHOOK_SECRET`), normalizes the payload, and calls `applyCallOutcome`. (`src/app/api/webhooks/elevenlabs/route.ts`)
- **Idempotency guard in `applyCallOutcome`** — Terminal-status outcomes (`COMPLETED`/`FAILED`/`NO_ANSWER`) are skipped if the call is already in a terminal state. Prevents double-incrementing campaign stats when both webhook and polling fire. (`src/lib/services/webhook-service.ts`)
- **Webhook URL in agent ElevenLabs config** — `createAgent()` and `updateAgent()` in the ElevenLabs provider include `platform_settings.webhook.url` when `APP_URL` or `NEXTAUTH_URL` is set. (`src/lib/providers/elevenlabs.ts`)

### Added — Sprint 4: Custom Agent Tools

- **`AgentTool` model** — Stores tool name, description, JSON Schema parameters, webhook URL, and active status per agent. (`prisma/schema.prisma`)
- **SSRF-safe URL validator** — Shared util rejects `http://`, private/loopback IPs (RFC 1918, 127/8, 169.254, etc.), and reserved hostnames before saving webhook URLs. (`src/lib/utils/validate-webhook-url.ts`)
- **Tool CRUD API** — `GET/POST /api/agents/[id]/tools` and `PATCH/DELETE /api/agents/[id]/tools/[toolId]`. URL and parameters validated on every write. (`src/app/api/agents/[id]/tools/route.ts`, `src/app/api/agents/[id]/tools/[toolId]/route.ts`)
- **Tools included in `syncAgent()`** — Active tools are pushed to ElevenLabs agent config on sync. (`src/lib/services/agent-service.ts`)
- **Tools section on agent page** — Collapsible form to add tools with name, description, webhook URL, and JSON Schema parameters; list shows toggle (active/inactive) and delete per tool. (`src/app/(dashboard)/agents/[id]/page.tsx`)

### Fixed
- **Delete contact FK error** — Deleting a contact with call history no longer fails with `Call_contactId_fkey` constraint error. `deleteContact` now deletes associated `Call` records before removing the contact. (`src/lib/services/contact-service.ts`)

### Added
- **AI call summaries** — New `summary-service.ts` auto-generates 2-4 sentence summaries for completed calls using Anthropic API (claude-haiku-4-5). Summaries are generated fire-and-forget after call completion in both sync and webhook flows. (`src/lib/services/summary-service.ts`, `src/lib/services/campaign-sync-service.ts`, `src/lib/services/webhook-service.ts`)
- **Campaign insights** — New `generateCampaignSummary` function aggregates individual call summaries into a campaign-level overview (3-5 sentences). Exposed via `GET /api/campaigns/[id]/summary`. (`src/lib/services/summary-service.ts`, `src/app/api/campaigns/[id]/summary/route.ts`)
- **Campaign Insights card** — Campaign detail page shows an AI-generated campaign overview when 2+ calls have summaries, with a Refresh button. (`src/app/(dashboard)/campaigns/[id]/page.tsx`)
- **Clickable call rows with TranscriptModal** — Call history rows on campaign detail page are now clickable, opening the existing `TranscriptModal` to view transcript + summary. A `FileText` icon indicates calls with transcripts. (`src/app/(dashboard)/campaigns/[id]/page.tsx`)

### Added
- **Polling-based call sync for ElevenLabs** — New `campaign-sync-service.ts` polls ElevenLabs via `provider.getCall()` to update call statuses (COMPLETED/FAILED/IN_PROGRESS) since ElevenLabs doesn't push webhook events. Stale INITIATED calls (>10 min) are auto-timed out. Uses in-memory locking to prevent concurrent syncs. (`src/lib/services/campaign-sync-service.ts`)
- **Batch continuation** — Campaigns now automatically start the next batch of calls when the current batch finishes. `checkCampaignCompletion` detects remaining PENDING contacts and calls `startNextBatch`. (`src/lib/services/webhook-service.ts`, `src/lib/services/campaign-service.ts`)
- **Campaign cancel** — New `cancelCampaign()` function marks all PENDING/CALLING contacts as SKIPPED and sets campaign to CANCELLED. API route at `POST /api/campaigns/[id]/cancel`. (`src/lib/services/campaign-service.ts`, `src/app/api/campaigns/[id]/cancel/route.ts`)
- **Sync API endpoint** — `POST /api/campaigns/[id]/sync` triggers a poll-based sync for a running campaign. (`src/app/api/campaigns/[id]/sync/route.ts`)
- **Auto-sync polling in UI** — Campaign detail page polls sync endpoint every 10s while campaign is RUNNING. First sync fires 5s after starting a campaign. (`src/app/(dashboard)/campaigns/[id]/page.tsx`)
- **Cancel button in UI** — Destructive cancel button shown for RUNNING/PAUSED/DRAFT campaigns with confirmation dialog. (`src/app/(dashboard)/campaigns/[id]/page.tsx`)
- **Contact status table** — New section on campaign detail page showing each contact's name, phone, status badge, and attempt count. (`src/app/(dashboard)/campaigns/[id]/page.tsx`)

### Changed
- **Extracted `applyCallOutcome` helper** — Shared function in webhook-service for updating Call, CampaignContact, and campaign aggregate stats. Used by both webhook event processing and polling sync. (`src/lib/services/webhook-service.ts`)
- **Extracted `startNextBatch` from `startCampaign`** — Batch-calling logic is now a standalone exported function, reusable by both `startCampaign` and `checkCampaignCompletion`. (`src/lib/services/campaign-service.ts`)
- **Enhanced `checkCampaignCompletion`** — Now returns a status string ('waiting'/'continued'/'paused'/'completed') and triggers batch continuation for PENDING contacts. (`src/lib/services/webhook-service.ts`)

- **Campaign retry for unresponsive contacts** — Contacts that don't answer or immediately drop calls are now classified as `NO_ANSWER` (short calls <15s or provider signals like busy/timeout/rejected). When all calls finish and retryable NO_ANSWER contacts remain, the campaign auto-pauses instead of completing. Users can click "Retry" to re-call those contacts. A new "No Answer" stat card (orange, PhoneOff icon) and info banner are shown on the campaign detail page. (`prisma/schema.prisma`, `src/lib/services/webhook-service.ts`, `src/lib/services/campaign-service.ts`, `src/app/(dashboard)/campaigns/[id]/page.tsx`)

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
