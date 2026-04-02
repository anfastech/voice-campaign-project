'use client'

import { Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function ClientContactsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Contacts</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your contact lists</p>
      </div>

      <Card className="shadow-none">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Contact management coming soon</p>
          <p className="text-xs text-muted-foreground mt-1">Contact your agency to import contacts</p>
        </CardContent>
      </Card>
    </div>
  )
}
