import { Suspense } from 'react'
import { ClientSidebar } from '@/components/layout/ClientSidebar'
import { Header } from '@/components/layout/Header'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
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
