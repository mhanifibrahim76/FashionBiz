import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const suppliers = await prisma.supplier.findMany({
      where: { businessId: session.user.business.id },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ suppliers })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ message: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, contact, address, productsSupplied } = body

    if (!name || name.trim() === '') {
      return NextResponse.json({ message: 'Supplier name is required' }, { status: 400 })
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        contact: contact?.trim() || null,
        address: address?.trim() || null,
        productsSupplied: productsSupplied || [],
        businessId: session.user.business.id,
      },
    })

    return NextResponse.json({ supplier, message: 'Supplier created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json({ message: 'Failed to create supplier' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, contact, address, productsSupplied } = body

    if (!id) {
      return NextResponse.json({ message: 'Supplier ID is required' }, { status: 400 })
    }

    const supplier = await prisma.supplier.update({
      where: { id, businessId: session.user.business.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(contact !== undefined && { contact: contact?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(productsSupplied !== undefined && { productsSupplied }),
      },
    })

    return NextResponse.json({ supplier, message: 'Supplier updated successfully' })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json({ message: 'Failed to update supplier' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ message: 'Supplier ID is required' }, { status: 400 })
    }

    await prisma.supplier.delete({
      where: { id, businessId: session.user.business.id },
    })

    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json({ message: 'Failed to delete supplier' }, { status: 500 })
  }
}