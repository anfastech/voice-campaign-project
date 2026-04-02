'use client'

import { useQuery } from '@tanstack/react-query'
import { StatCard } from '@/components/ui/stat-card'
import { formatDuration, formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Bot } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function ClientDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['client-analytics'],
    queryFn: () => fetch('/api/client/analytics').then((r) => r.json()),
    refetchInterval: 30000,
  })

  const { data: agents } = useQuery({
    queryKey: ['client-agents'],
    queryFn: () => fetch('/api/client/agents').then((r) => r.json()),
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Overview of your voice agent performance</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-lg animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Calls" value={stats?.totalCalls ?? 0} />
          <StatCard label="Successful" value={stats?.successfulCalls ?? 0} />
          <StatCard label="Avg Duration" value={formatDuration(stats?.avgDuration)} />
          <StatCard label="Total Cost" value={formatCurrency(stats?.totalCost)} />
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Your Agents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(agents ?? []).length === 0 ? (
            <Card className="shadow-none col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bot className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No agents assigned yet</p>
                <p className="text-xs text-muted-foreground mt-1">Contact your agency to get started</p>
              </CardContent>
            </Card>
          ) : (
            (agents ?? []).map((agent: any) => (
              <Card key={agent.id} className="shadow-none">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{agent.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {agent.description || 'Voice AI Agent'}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant={agent.isActive ? 'default' : 'secondary'} className="text-[10px]">
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
