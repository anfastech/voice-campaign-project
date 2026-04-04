'use client'

import { useQuery } from '@tanstack/react-query'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { Header } from '@/components/layout/Header'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: branding } = useQuery({
    queryKey: ['admin-branding-layout'],
    queryFn: () => fetch('/api/branding').then((r) => r.json()),
    staleTime: 60_000,
  })

  const contentVars = {
    ...(branding?.primaryColor ? { '--primary': branding.primaryColor } : {}),
    ...(branding?.accentColor ? { '--accent': branding.accentColor } : {}),
  } as React.CSSProperties

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto" style={contentVars}>
          {children}
        </main>
      </div>
    </div>
  )
}
