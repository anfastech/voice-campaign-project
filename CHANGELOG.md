# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
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
