'use client'

import { Megaphone } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ClientCampaignsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Campaigns</h2>
        <p className="text-sm text-muted-foreground mt-1">Run outbound calling campaigns with your assigned agents</p>
      </div>

      <Card className="shadow-none">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Megaphone className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Campaign management coming soon</p>
          <p className="text-xs text-muted-foreground mt-1">Contact your agency to run campaigns</p>
        </CardContent>
      </Card>
    </div>
  )
}
