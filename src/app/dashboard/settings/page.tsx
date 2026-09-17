import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SettingsForm from '@/components/settings/settings-form'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.business?.id) redirect('/login')

  const business = await prisma.business.findUnique({
    where: { id: session.user.business.id },
  })

  return <SettingsForm business={business} />
}
