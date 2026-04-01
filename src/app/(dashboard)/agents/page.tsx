'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Bot, Trash2, Phone, Mic2, Thermometer, Clock, Sparkles, Link2, BarChart2 } from 'lucide-react'

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
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {agents.length} agent{agents.length !== 1 ? 's' : ''} configured
        </p>
        <Link href="/agents/new">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
              boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
            }}
          >
            <Plus className="w-4 h-4" />
            New Agent
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-52 rounded-2xl relative overflow-hidden"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div
          className="rounded-2xl p-12 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, oklch(0.49 0.263 281 / 15%), oklch(0.65 0.22 310 / 15%))',
              border: '1px solid oklch(0.49 0.263 281 / 20%)',
            }}
          >
            <Bot className="w-7 h-7" style={{ color: 'oklch(0.49 0.263 281)' }} />
          </div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
            No AI agents yet
          </h3>
          <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
            Create your first voice agent.
          </p>
          <Link href="/agents/new">
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, oklch(0.49 0.263 281), oklch(0.65 0.22 310))',
                boxShadow: '0 4px 14px oklch(0.49 0.263 281 / 35%)',
              }}
            >
              <Sparkles className="w-4 h-4" />
              Create your first agent
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent: any) => {
            return (
              <div
                key={agent.id}
                className="group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 1px 3px oklch(0 0 0 / 4%)',
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <Link href={`/agents/${agent.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: 'oklch(0.49 0.263 281 / 10%)',
                        border: '1px solid oklch(0.49 0.263 281 / 30%)',
                      }}
                    >
                      <Bot className="w-5 h-5" style={{ color: 'oklch(0.49 0.263 281)' }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--foreground)' }}>
                        {agent.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-md uppercase"
                          style={{ background: 'oklch(0.6 0.19 220 / 10%)', color: 'oklch(0.5 0.19 220)' }}
                        >
                          {agent.language}
                        </span>
                        {agent.elevenLabsAgentId ? (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ background: 'oklch(0.55 0.215 163 / 10%)', color: 'oklch(0.45 0.215 163)' }}>
                            <Link2 className="w-2.5 h-2.5" />
                            Deployed
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                            style={{ background: 'oklch(0.72 0.18 68 / 10%)', color: 'oklch(0.62 0.18 68)' }}>
                            Draft
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        if (confirm('Delete this agent?')) deleteMutation.mutate(agent.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg"
                      style={{ color: 'oklch(0.59 0.245 15)' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {agent.description && (
                  <p className="text-xs line-clamp-2 mb-4" style={{ color: 'var(--muted-foreground)' }}>
                    {agent.description}
                  </p>
                )}

                <div
                  className="flex rounded-xl overflow-hidden mb-4"
                  style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="flex-1 flex flex-col items-center py-2.5"
                    style={{ borderRight: '1px solid var(--border)' }}
                  >
                    <Phone className="w-3 h-3 mb-1" style={{ color: 'oklch(0.49 0.263 281)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                      {agent._count?.calls ?? 0}
                    </span>
                    <span className="text-[9px]" style={{ color: 'var(--muted-foreground)' }}>
                      Calls
                    </span>
                  </div>
                  {agent._count?.campaigns != null && (
                    <div
                      className="flex-1 flex flex-col items-center py-2.5"
                      style={{ borderRight: '1px solid var(--border)' }}
                    >
                      <BarChart2 className="w-3 h-3 mb-1" style={{ color: 'oklch(0.65 0.22 310)' }} />
                      <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                        {agent._count.campaigns}
                      </span>
                      <span className="text-[9px]" style={{ color: 'var(--muted-foreground)' }}>
                        Camps
                      </span>
                    </div>
                  )}
                  <div
                    className="flex-1 flex flex-col items-center py-2.5"
                    style={{ borderRight: '1px solid var(--border)' }}
                  >
                    <Thermometer className="w-3 h-3 mb-1" style={{ color: 'oklch(0.72 0.18 68)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                      {agent.temperature}
                    </span>
                    <span className="text-[9px]" style={{ color: 'var(--muted-foreground)' }}>
                      Temp
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-center py-2.5">
                    <Clock className="w-3 h-3 mb-1" style={{ color: 'oklch(0.55 0.215 163)' }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                      {agent.maxDuration}s
                    </span>
                    <span className="text-[9px]" style={{ color: 'var(--muted-foreground)' }}>
                      Max
                    </span>
                  </div>
                </div>

                <div
                  className="rounded-lg p-2.5"
                  style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Mic2 className="w-2.5 h-2.5" style={{ color: 'var(--muted-foreground)' }} />
                    <span
                      className="text-[10px] font-medium uppercase tracking-wider"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      System Prompt
                    </span>
                  </div>
                  <p
                    className="text-xs font-mono line-clamp-3 leading-relaxed"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {agent.systemPrompt}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
