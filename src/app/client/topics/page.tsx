'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tags } from 'lucide-react'
import dynamic from 'next/dynamic'

const TopicBreakdownChart = dynamic(
  () => import('@/components/analytics/TopicBreakdownChart').then((m) => m.TopicBreakdownChart),
  { ssr: false, loading: () => <div className="h-[300px] rounded-xl bg-muted animate-pulse" /> }
)

export default function ClientTopicsPage() {
  const { data: topics = [], isLoading } = useQuery({
    queryKey: ['client-topic-breakdown'],
    queryFn: () => fetch('/api/client/analytics/topic-breakdown').then((r) => r.json()),
    refetchInterval: 30000,
  })

  const topicList: any[] = Array.isArray(topics) ? topics : []

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Topics</h2>
        <p className="text-sm text-muted-foreground mt-1">Conversation topics and their frequency</p>
      </div>

      {isLoading ? (
        <div className="h-[300px] rounded-xl bg-muted animate-pulse" />
      ) : topicList.length === 0 ? (
        <Card className="shadow-none border-dashed">
          <CardContent className="py-14 flex flex-col items-center text-center">
            <Tags className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No topics assigned to conversations yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Your agency can tag conversations with topics.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <TopicBreakdownChart data={topicList} />

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="text-base">All Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topicList.map((topic: any) => (
                  <div key={topic.topicId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: topic.color }} />
                      <span className="text-sm font-medium">{topic.topicName}</span>
                    </div>
                    <span className="text-sm text-muted-foreground tabular-nums">{topic.count} calls</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
