'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Trash2, Users, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ClientsPage() {
  const queryClient = useQueryClient()

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => fetch('/api/clients').then((r) => r.json()),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/clients/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Clients</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your client organizations
          </p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Client
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg animate-pulse bg-muted" />
          ))}
        </div>
      ) : !clients?.length ? (
        <Card className="shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No clients yet</p>
            <Link href="/clients/new">
              <Button>Create your first client</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clients.map((client: any) => (
            <Card key={client.id} className="shadow-none">
              <CardContent className="flex items-center justify-between py-4">
                <Link href={`/clients/${client.id}`} className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                    {client.companyName && (
                      <p className="text-xs text-muted-foreground truncate">{client.companyName}</p>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-3 shrink-0">
                  {client.integration?.isConnected && (
                    <Badge variant="outline" className="text-xs gap-1 text-emerald-600 border-emerald-200">
                      <Phone className="w-3 h-3" />
                      {client.integration.phoneNumber || 'Connected'}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {client._count?.agents ?? 0} agents
                  </Badge>
                  <Badge variant={client.isActive ? 'default' : 'secondary'} className="text-xs cursor-pointer"
                    onClick={() => toggleMutation.mutate({ id: client.id, isActive: !client.isActive })}>
                    {client.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={() => {
                      if (confirm('Delete this client?')) deleteMutation.mutate(client.id)
                    }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
