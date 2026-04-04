'use client'

import { Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClientSidebar } from '@/components/layout/ClientSidebar'
import { Header } from '@/components/layout/Header'

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: branding } = useQuery({
    queryKey: ['client-branding-layout'],
    queryFn: () => fetch('/api/client/branding').then((r) => r.json()),
    staleTime: 60_000,
  })

  // CSS vars in globals.css use HEX format, so inject HEX directly
  const cssVars = {
    ...(branding?.primaryColor ? { '--primary': branding.primaryColor, '--sidebar-primary': branding.primaryColor } : {}),
    ...(branding?.accentColor ? { '--accent': branding.accentColor, '--sidebar-accent': branding.accentColor } : {}),
  } as React.CSSProperties

  return (
    <div className="flex min-h-screen bg-background" style={cssVars}>
      <Suspense>
        <ClientSidebar />
      </Suspense>
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Suspense>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayoutInner>{children}</ClientLayoutInner>
}
