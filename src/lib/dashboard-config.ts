import { z } from 'zod'

// ─── Analytics sub-features ─────────────────────────────────────────────────

const analyticsFeatures = {
  totalCalls: 'Total Calls',
  successfulCalls: 'Successful Calls',
  successRate: 'Success Rate',
  avgDuration: 'Average Duration',
  totalCallMinutes: 'Total Call Minutes',
  contactsReached: 'Contacts Reached',
  leadPipeline: 'Lead Pipeline',
  outcomeChart: 'Outcome Chart',
  volumeChart: 'Volume Chart',
  successRateTrend: 'Success Rate Trend',
  callHeatmap: 'Call Heatmap',
  reasonCallEnded: 'Reason Call Ended',
  agentComparison: 'Agent Comparison',
} as const

export type AnalyticsFeatureKey = keyof typeof analyticsFeatures

// ─── Agent sub-features ─────────────────────────────────────────────────────

const agentFeatures = {
  viewDetails: 'View Agent Details',
  editSettings: 'Edit Agent Settings',
} as const

export type AgentFeatureKey = keyof typeof agentFeatures

// ─── Section registry ───────────────────────────────────────────────────────

export const SECTION_REGISTRY = {
  analytics: {
    label: 'Analytics',
    href: '/client/dashboard',
    icon: 'BarChart3',
    features: analyticsFeatures,
  },
  conversations: {
    label: 'Conversations',
    href: '/client/conversations',
    icon: 'MessageSquare',
    features: {},
  },
  contacts: {
    label: 'Contacts',
    href: '/client/contacts',
    icon: 'Users',
    features: {},
  },
  campaigns: {
    label: 'Campaigns',
    href: '/client/campaigns',
    icon: 'Megaphone',
    features: {},
  },
  leads: {
    label: 'Leads',
    href: '/client/leads',
    icon: 'Target',
    features: {},
  },
  agents: {
    label: 'Agents',
    href: '/client/agents',
    icon: 'Bot',
    features: agentFeatures,
  },
  knowledgeBase: {
    label: 'Knowledge Base',
    href: '/client/knowledge-base',
    icon: 'BookOpen',
    features: {},
  },
  topics: {
    label: 'Topics',
    href: '/client/topics',
    icon: 'Tags',
    features: {},
  },
} as const

export type SectionKey = keyof typeof SECTION_REGISTRY

// ─── Config type ────────────────────────────────────────────────────────────

export type AnalyticsFeatures = Record<AnalyticsFeatureKey, boolean>
export type AgentFeatures = Record<AgentFeatureKey, boolean>

export type DashboardConfig = {
  sections: {
    analytics: { enabled: boolean; features: AnalyticsFeatures }
    conversations: { enabled: boolean }
    contacts: { enabled: boolean }
    campaigns: { enabled: boolean }
    leads: { enabled: boolean }
    agents: { enabled: boolean; features: AgentFeatures }
    knowledgeBase: { enabled: boolean }
    topics: { enabled: boolean }
  }
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_ANALYTICS_FEATURES: AnalyticsFeatures = {
  totalCalls: true,
  successfulCalls: true,
  successRate: true,
  avgDuration: true,
  totalCallMinutes: true,
  contactsReached: true,
  leadPipeline: true,
  outcomeChart: true,
  volumeChart: true,
  successRateTrend: true,
  callHeatmap: true,
  reasonCallEnded: true,
  agentComparison: true,
}

const DEFAULT_AGENT_FEATURES: AgentFeatures = {
  viewDetails: true,
  editSettings: false,
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  sections: {
    analytics: { enabled: true, features: { ...DEFAULT_ANALYTICS_FEATURES } },
    conversations: { enabled: true },
    contacts: { enabled: true },
    campaigns: { enabled: true },
    leads: { enabled: true },
    agents: { enabled: true, features: { ...DEFAULT_AGENT_FEATURES } },
    knowledgeBase: { enabled: false },
    topics: { enabled: false },
  },
}

// ─── Resolver (deep-merge stored config with defaults) ──────────────────────

export function resolveDashboardConfig(raw: unknown): DashboardConfig {
  if (!raw || typeof raw !== 'object') return structuredClone(DEFAULT_DASHBOARD_CONFIG)

  const stored = raw as Record<string, unknown>
  const sections = (stored.sections || {}) as Record<string, unknown>
  const result = structuredClone(DEFAULT_DASHBOARD_CONFIG)

  for (const key of Object.keys(result.sections) as SectionKey[]) {
    const s = sections[key] as Record<string, unknown> | undefined
    if (!s) continue

    if (typeof s.enabled === 'boolean') {
      (result.sections[key] as { enabled: boolean }).enabled = s.enabled
    }

    // Deep-merge features for sections that have them
    if (s.features && typeof s.features === 'object') {
      const stored_f = s.features as Record<string, unknown>
      if (key === 'analytics') {
        for (const fk of Object.keys(result.sections.analytics.features) as AnalyticsFeatureKey[]) {
          if (typeof stored_f[fk] === 'boolean') {
            result.sections.analytics.features[fk] = stored_f[fk] as boolean
          }
        }
      } else if (key === 'agents') {
        for (const fk of Object.keys(result.sections.agents.features) as AgentFeatureKey[]) {
          if (typeof stored_f[fk] === 'boolean') {
            result.sections.agents.features[fk] = stored_f[fk] as boolean
          }
        }
      }
    }
  }

  return result
}

// ─── Zod schema for API validation ──────────────────────────────────────────

const analyticsFeaturesSchema = z.object({
  totalCalls: z.boolean(),
  successfulCalls: z.boolean(),
  successRate: z.boolean(),
  avgDuration: z.boolean(),
  totalCallMinutes: z.boolean(),
  contactsReached: z.boolean(),
  leadPipeline: z.boolean(),
  outcomeChart: z.boolean(),
  volumeChart: z.boolean(),
  successRateTrend: z.boolean(),
  callHeatmap: z.boolean(),
  reasonCallEnded: z.boolean(),
  agentComparison: z.boolean(),
}).partial()

const agentFeaturesSchema = z.object({
  viewDetails: z.boolean(),
  editSettings: z.boolean(),
}).partial()

export const dashboardConfigSchema = z.object({
  sections: z.object({
    analytics: z.object({
      enabled: z.boolean(),
      features: analyticsFeaturesSchema.optional(),
    }).optional(),
    conversations: z.object({ enabled: z.boolean() }).optional(),
    contacts: z.object({ enabled: z.boolean() }).optional(),
    campaigns: z.object({ enabled: z.boolean() }).optional(),
    leads: z.object({ enabled: z.boolean() }).optional(),
    agents: z.object({
      enabled: z.boolean(),
      features: agentFeaturesSchema.optional(),
    }).optional(),
    knowledgeBase: z.object({ enabled: z.boolean() }).optional(),
    topics: z.object({ enabled: z.boolean() }).optional(),
  }).optional(),
})
