const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: {
    label: 'Draft',
    bg: 'oklch(0.6 0.015 285 / 8%)',
    text: 'oklch(0.52 0.015 285)',
    dot: 'oklch(0.6 0.015 285)',
  },
  SCHEDULED: {
    label: 'Scheduled',
    bg: 'oklch(0.6 0.19 220 / 10%)',
    text: 'oklch(0.5 0.19 220)',
    dot: 'oklch(0.6 0.19 220)',
  },
  RUNNING: {
    label: 'Running',
    bg: 'oklch(0.55 0.215 163 / 12%)',
    text: 'oklch(0.45 0.215 163)',
    dot: 'oklch(0.55 0.215 163)',
  },
  PAUSED: {
    label: 'Paused',
    bg: 'oklch(0.72 0.18 68 / 10%)',
    text: 'oklch(0.55 0.18 68)',
    dot: 'oklch(0.72 0.18 68)',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'oklch(0.49 0.263 281 / 8%)',
    text: 'oklch(0.49 0.263 281)',
    dot: 'oklch(0.49 0.263 281)',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'oklch(0.59 0.245 15 / 10%)',
    text: 'oklch(0.52 0.245 15)',
    dot: 'oklch(0.59 0.245 15)',
  },
}

export function CampaignStatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.DRAFT
  const isRunning = status === 'RUNNING'

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span
        className={isRunning ? 'live-dot w-1.5 h-1.5 rounded-full flex-shrink-0' : 'w-1.5 h-1.5 rounded-full flex-shrink-0'}
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  )
}
