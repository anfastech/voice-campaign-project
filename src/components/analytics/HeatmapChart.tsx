'use client'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface HeatmapData {
  day: string
  dayIndex: number
  hour: number
  count: number
}

export function HeatmapChart({ data }: { data: HeatmapData[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  const getColor = (count: number) => {
    if (count === 0) return 'var(--muted)'
    const intensity = count / maxCount
    if (intensity < 0.25) return 'oklch(0.49 0.263 281 / 15%)'
    if (intensity < 0.5) return 'oklch(0.49 0.263 281 / 35%)'
    if (intensity < 0.75) return 'oklch(0.49 0.263 281 / 60%)'
    return 'oklch(0.49 0.263 281 / 90%)'
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] rounded-xl"
        style={{ background: 'oklch(0.49 0.263 281 / 4%)', border: '1px dashed oklch(0.49 0.263 281 / 20%)' }}>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No heatmap data</p>
      </div>
    )
  }

  const lookup = new Map(data.map((d) => [`${d.dayIndex}-${d.hour}`, d.count]))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Hour labels */}
        <div className="flex items-center gap-[2px] mb-1 pl-10">
          {HOURS.map((h) => (
            <div key={h} className="flex-1 text-center text-[9px] tabular-nums"
              style={{ color: 'var(--muted-foreground)' }}>
              {h % 3 === 0 ? `${h.toString().padStart(2, '0')}:00` : ''}
            </div>
          ))}
        </div>

        {/* Grid */}
        {DAYS.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-[2px] mb-[2px]">
            <span className="w-9 text-[10px] font-medium text-right pr-2 flex-shrink-0"
              style={{ color: 'var(--muted-foreground)' }}>
              {day}
            </span>
            {HOURS.map((hour) => {
              const count = lookup.get(`${dayIdx}-${hour}`) || 0
              return (
                <div key={hour} className="flex-1 aspect-square rounded-sm cursor-default relative group"
                  style={{ background: getColor(count), minHeight: '18px' }}
                  title={`${day} ${hour}:00 — ${count} call${count !== 1 ? 's' : ''}`}>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                    style={{ background: 'var(--popover)', border: '1px solid var(--border)', color: 'var(--foreground)' }}>
                    {count} call{count !== 1 ? 's' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-3 pr-1">
          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((i) => (
            <div key={i} className="w-3 h-3 rounded-sm"
              style={{ background: i === 0 ? 'var(--muted)' : `oklch(0.49 0.263 281 / ${i * 90}%)` }} />
          ))}
          <span className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>More</span>
        </div>
      </div>
    </div>
  )
}
