'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Bot, Trash2, Phone, Mic2, Thermometer, Clock, Sparkles, Link2, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AgentsPage() {
  const queryClient = useQueryClient()

  const { data: rawAgents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => fetch('/api/agents').then((r) => r.json()),
  })
  const agents = Array.isArray(rawAgents) ? rawAgents : []

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/agents/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {agents.length} agent{agents.length !== 1 ? 's' : ''} configured
        </p>
        <Link href="/agents/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Agent
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-52 rounded-2xl animate-pulse bg-muted border border-border"
            />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <Card className="rounded-2xl border-dashed p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-primary/15 border border-primary/20">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold mb-1 text-foreground">
            No AI agents yet
          </h3>
          <p className="text-sm mb-6 text-muted-foreground">
            Create your first voice agent.
          </p>
          <Link href="/agents/new">
            <Button>
              <Sparkles className="w-4 h-4 mr-2" />
              Create your first agent
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent: any) => {
            return (
              <Card
                key={agent.id}
                className="group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
              >
                <div className="flex items-start justify-between mb-4">
                  <Link href={`/agents/${agent.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 border border-primary/30">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate text-foreground">
                        {agent.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {agent.language}
                        </Badge>
                        {agent.elevenLabsAgentId ? (
                          <Badge variant="default" className="text-[10px]">
                            <Link2 className="w-2.5 h-2.5" />
                            Deployed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            Draft
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        if (confirm('Delete this agent?')) deleteMutation.mutate(agent.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {agent.description && (
                  <p className="text-xs line-clamp-2 mb-4 text-muted-foreground">
                    {agent.description}
                  </p>
                )}

                <div className="flex rounded-xl overflow-hidden mb-4 bg-muted border border-border">
                  <div className="flex-1 flex flex-col items-center py-2.5 border-r border-border">
                    <Phone className="w-3 h-3 mb-1 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      {agent._count?.calls ?? 0}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      Calls
                    </span>
                  </div>
                  {agent._count?.campaigns != null && (
                    <div className="flex-1 flex flex-col items-center py-2.5 border-r border-border">
                      <BarChart2 className="w-3 h-3 mb-1 text-primary" />
                      <span className="text-xs font-bold text-foreground">
                        {agent._count.campaigns}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        Camps
                      </span>
                    </div>
                  )}
                  <div className="flex-1 flex flex-col items-center py-2.5 border-r border-border">
                    <Thermometer className="w-3 h-3 mb-1 text-amber-500" />
                    <span className="text-xs font-bold text-foreground">
                      {agent.temperature}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      Temp
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-center py-2.5">
                    <Clock className="w-3 h-3 mb-1 text-emerald-500" />
                    <span className="text-xs font-bold text-foreground">
                      {agent.maxDuration}s
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      Max
                    </span>
                  </div>
                </div>

                <div className="rounded-lg p-2.5 bg-muted border border-border">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Mic2 className="w-2.5 h-2.5 text-muted-foreground" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      System Prompt
                    </span>
                  </div>
                  <p className="text-xs font-mono line-clamp-3 leading-relaxed text-muted-foreground">
                    {agent.systemPrompt}
                  </p>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
