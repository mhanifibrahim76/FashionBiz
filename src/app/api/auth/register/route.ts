import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, businessName, email, phone, password } = await request.json()

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        business: {
          create: {
            name: businessName,
            type: 'Toko Pakaian',
            onboarded: false,
          },
        },
      },
    })

    return NextResponse.json(
      { message: 'Registrasi berhasil', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      {
        message: 'Terjadi kesalahan server',
        debug: {
          name: error instanceof Error ? error.constructor.name : 'UnknownError',
          code:
            typeof error === 'object' &&
            error !== null &&
            'code' in error
              ? String(error.code)
              : undefined,
        },
      },
      { status: 500 }
    )
  }
}
