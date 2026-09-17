import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone } = body

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
      },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
    }, { status: 200 })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ message: 'Failed to update user' }, { status: 500 })
  }
}
