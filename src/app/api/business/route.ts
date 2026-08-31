import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const business = await prisma.business.update({
      where: { id: session.user.business.id },
      data: body,
    })

    return NextResponse.json(business, { status: 200 })
  } catch (error) {
    console.error('Error updating business:', error)
    return NextResponse.json({ message: 'Failed to update business' }, { status: 500 })
  }
}
