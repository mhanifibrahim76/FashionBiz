import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const business = await prisma.business.findUnique({
    where: { id: session.user.business.id },
  })

  return (
    <div className="flex flex-col gap-7">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 className="page-title">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your profile, business, and preferences.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Profile</p>
              <h2 className="section-title">Account</h2>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label>Name</label>
              <input className="field" defaultValue={session.user.name || ''} />
            </div>
            <div>
              <label>Email</label>
              <input className="field" defaultValue={session.user.email || ''} disabled />
            </div>
            <div>
              <label>Phone</label>
              <input className="field" defaultValue={session.user.phone || ''} />
            </div>
            <button className="button-primary mt-2">Save changes</button>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Business</p>
              <h2 className="section-title">Store profile</h2>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label>Business name</label>
              <input className="field" defaultValue={business?.name || ''} />
            </div>
            <div>
              <label>Type</label>
              <input className="field" defaultValue={business?.type || ''} />
            </div>
            <div>
              <label>Location</label>
              <input className="field" defaultValue={business?.location || ''} />
            </div>
            <div>
              <label>Description</label>
              <textarea className="field" rows={3} defaultValue={business?.description || ''} />
            </div>
            <button className="button-primary mt-2">Update business</button>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Preferences</p>
            <h2 className="section-title">Notifications & AI</h2>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Email notifications</p>
              <p className="text-xs text-muted-foreground">Receive low stock alerts and weekly summaries</p>
            </div>
            <button className="button-secondary text-xs">Enabled</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">AI recommendations</p>
              <p className="text-xs text-muted-foreground">Show AI-powered suggestions on dashboard</p>
            </div>
            <button className="button-primary text-xs">Active</button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Dark mode</p>
              <p className="text-xs text-muted-foreground">Switch to dark sidebar theme</p>
            </div>
            <button className="button-secondary text-xs">Light</button>
          </div>
        </div>
      </section>
    </div>
  )
}
