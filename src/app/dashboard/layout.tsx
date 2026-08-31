import { Sidebar } from '@/components/layout/sell-sense-sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <main className="min-h-screen">
          <div className="mx-auto max-w-[1500px] p-5 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
