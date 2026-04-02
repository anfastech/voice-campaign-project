'use client'

import { useQuery } from '@tanstack/react-query'
import { Bot } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ClientAgentsPage() {
  const { data: agents, isLoading } = useQuery({
    queryKey: ['client-agents'],
    queryFn: () => fetch('/api/client/agents').then((r) => r.json()),
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Your Agents</h2>
        <p className="text-sm text-muted-foreground mt-1">AI agents configured for your account</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-lg animate-pulse bg-muted" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(agents ?? []).map((agent: any) => (
            <Card key={agent.id} className="shadow-none">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{agent.description || 'Voice AI Agent'}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant={agent.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
