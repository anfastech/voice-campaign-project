'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface TopicData {
  topicId: string
  topicName: string
  color: string
  count: number
}

export function TopicBreakdownChart({ data }: { data: TopicData[] }) {
  if (!data?.length) return null

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Topic Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
            <XAxis type="number" />
            <YAxis type="category" dataKey="topicName" width={120} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => [`${value} calls`, 'Count']} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell key={entry.topicId} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
