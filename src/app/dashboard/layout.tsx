import { Sidebar } from '@/components/layout/sell-sense-sidebar'
import { TopHeader } from '@/components/layout/top-header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-[1500px]">
          <TopHeader />
          <main className="min-h-screen">
            <div className="p-5 md:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
