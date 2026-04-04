'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Bot, Phone, Megaphone, Globe, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ClientAgentsPage() {
  const { data: agents, isLoading } = useQuery({
    queryKey: ['client-agents'],
    queryFn: () => fetch('/api/client/agents').then((r) => r.json()),
  })

  const agentList: any[] = Array.isArray(agents) ? agents : []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Your Agents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          AI voice agents dedicated to your account
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl animate-pulse bg-muted border border-border" />
          ))}
        </div>
      ) : agentList.length === 0 ? (
        <Card className="shadow-none border-dashed">
          <CardContent className="py-14 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No agents assigned</h3>
            <p className="text-sm text-muted-foreground">
              Contact your agency to get agents assigned to your account.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agentList.map((agent: any) => (
            <Link key={agent.id} href={`/client/agents/${agent.id}`}>
            <Card className="shadow-none hover:border-primary/20 transition-colors cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground truncate">{agent.name}</p>
                      <Badge
                        variant={agent.isActive ? 'default' : 'secondary'}
                        className="text-[10px] shrink-0"
                      >
                        {agent.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {agent.description || 'Voice AI Agent'}
                    </p>

                    {/* Agent stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3" />
                        {agent.totalCalls ?? 0} calls
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Megaphone className="w-3 h-3" />
                        {agent.totalCampaigns ?? 0} campaigns
                      </span>
                      {agent.language && (
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3" />
                          {agent.language.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && agentList.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {agentList.length} agent{agentList.length !== 1 ? 's' : ''} assigned to your account
        </p>
      )}
    </div>
  )
}
