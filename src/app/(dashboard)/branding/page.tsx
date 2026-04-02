'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Palette, Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function BrandingPage() {
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['branding'],
    queryFn: () => fetch('/api/branding').then((r) => r.json()),
  })

  const [form, setForm] = useState({
    platformName: 'Voice Campaign Platform',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#171717',
    accentColor: '#3b82f6',
  })

  useEffect(() => {
    if (settings) {
      setForm({
        platformName: settings.platformName || 'Voice Campaign Platform',
        logoUrl: settings.logoUrl || '',
        faviconUrl: settings.faviconUrl || '',
        primaryColor: settings.primaryColor || '#171717',
        accentColor: settings.accentColor || '#3b82f6',
      })
    }
  }, [settings])

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      fetch('/api/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['branding'] }),
  })

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 rounded-lg animate-pulse bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Branding</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customize how the platform appears to your clients
        </p>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Platform Identity</CardTitle>
          <CardDescription>Name and logo shown in the client dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platformName">Platform Name</Label>
            <Input
              id="platformName"
              value={form.platformName}
              onChange={(e) => setForm({ ...form, platformName: e.target.value })}
              placeholder="Voice Campaign Platform"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
            {form.logoUrl && (
              <div className="mt-2 p-3 rounded-lg bg-muted flex items-center justify-center">
                <img src={form.logoUrl} alt="Logo preview" className="max-h-12 object-contain" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="faviconUrl">Favicon URL</Label>
            <Input
              id="faviconUrl"
              value={form.faviconUrl}
              onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
              placeholder="https://example.com/favicon.ico"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Colors</CardTitle>
          <CardDescription>Brand colors applied to the client dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <Input
                  id="primaryColor"
                  value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                />
                <Input
                  id="accentColor"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-2">Preview</p>
            <div className="p-4 rounded-lg border flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: form.primaryColor }}>
                {form.platformName.charAt(0)}
              </div>
              <span className="font-semibold text-sm">{form.platformName}</span>
              <div className="ml-auto flex gap-2">
                <div className="w-16 h-2 rounded-full" style={{ backgroundColor: form.primaryColor }} />
                <div className="w-16 h-2 rounded-full" style={{ backgroundColor: form.accentColor }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => {
          setForm({
            platformName: 'Voice Campaign Platform',
            logoUrl: '',
            faviconUrl: '',
            primaryColor: '#171717',
            accentColor: '#3b82f6',
          })
        }}>
          <RotateCcw className="w-3.5 h-3.5 mr-2" />
          Reset
        </Button>
        <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
          <Save className="w-3.5 h-3.5 mr-2" />
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
