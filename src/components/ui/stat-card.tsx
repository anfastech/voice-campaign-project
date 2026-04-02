import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  trend?: number
  className?: string
}

export function StatCard({ label, value, trend, className }: StatCardProps) {
  return (
    <Card className={cn('shadow-none', className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {trend !== undefined && (
            <span
              className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded',
                trend > 0 && 'text-emerald-600 bg-emerald-50',
                trend < 0 && 'text-red-500 bg-red-50',
                trend === 0 && 'text-muted-foreground bg-muted'
              )}
            >
              {trend > 0 ? '\u2191' : trend < 0 ? '\u2193' : '-'}{' '}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}
