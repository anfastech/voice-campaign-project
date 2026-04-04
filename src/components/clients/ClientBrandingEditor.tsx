'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Palette, Save, Loader2 } from 'lucide-react'

interface Props {
  clientId: string
  clientName: string
}

export function ClientBrandingEditor({ clientId, clientName }: Props) {
  const queryClient = useQueryClient()

  const { data: branding, isLoading } = useQuery({
    queryKey: ['client-branding', clientId],
    queryFn: () => fetch(`/api/clients/${clientId}/branding`).then((r) => r.json()),
  })

  const [platformName, setPlatformName] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState<string | null>(null)
  const [accentColor, setAccentColor] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  // Sync from fetched data
  if (branding && !touched) {
    if (platformName === null && branding.platformName) setPlatformName(branding.platformName)
    if (logoUrl === null && branding.logoUrl) setLogoUrl(branding.logoUrl)
    if (primaryColor === null && branding.primaryColor) setPrimaryColor(branding.primaryColor)
    if (accentColor === null && branding.accentColor) setAccentColor(branding.accentColor)
  }

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      fetch(`/api/clients/${clientId}/branding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed')
        return r.json()
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['client-branding', clientId], data)
      setTouched(false)
    },
  })

  function update(field: string, value: string) {
    setTouched(true)
    switch (field) {
      case 'platformName': setPlatformName(value); break
      case 'logoUrl': setLogoUrl(value); break
      case 'primaryColor': setPrimaryColor(value); break
      case 'accentColor': setAccentColor(value); break
    }
  }

  if (isLoading) {
    return (
      <Card className="shadow-none">
        <CardContent className="p-6 flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Client Branding
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize the look of {clientName}&apos;s dashboard. Leave empty to use your default branding.
            </p>
          </div>
          {touched && (
            <Button
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => saveMutation.mutate({ platformName, logoUrl, primaryColor, accentColor })}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save Branding
            </Button>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Platform Name</Label>
            <Input
              value={platformName || ''}
              onChange={(e) => update('platformName', e.target.value)}
              placeholder="Voice Platform (default)"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Logo URL</Label>
            <Input
              value={logoUrl || ''}
              onChange={(e) => update('logoUrl', e.target.value)}
              placeholder="https://example.com/logo.png"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Primary Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor || '#171717'}
                onChange={(e) => update('primaryColor', e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <Input
                value={primaryColor || ''}
                onChange={(e) => update('primaryColor', e.target.value)}
                placeholder="#171717"
                className="h-8 text-xs flex-1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Accent Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={accentColor || '#3b82f6'}
                onChange={(e) => update('accentColor', e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <Input
                value={accentColor || ''}
                onChange={(e) => update('accentColor', e.target.value)}
                placeholder="#3b82f6"
                className="h-8 text-xs flex-1"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {(primaryColor || accentColor) && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: primaryColor || '#171717' }} />
            <div className="w-6 h-6 rounded" style={{ backgroundColor: accentColor || '#3b82f6' }} />
            <span className="text-xs text-muted-foreground">Color preview</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
