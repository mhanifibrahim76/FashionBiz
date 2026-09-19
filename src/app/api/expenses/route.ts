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

    const businessId = session.user.business.id
    const url = new URL(request.url)
    const take = parseInt(url.searchParams.get('take') || '20', 10)

    const expenses = await prisma.expense.findMany({
      where: { businessId },
      include: { category: true },
      orderBy: { date: 'desc' },
      take,
    })

    return NextResponse.json(expenses, { status: 200 })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ message: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const body = await request.json()
    const { amount, categoryId, paymentMethod, notes, date, customCategoryName } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: 'Amount is required' }, { status: 400 })
    }

    let resolvedCategoryId = categoryId
    if (!resolvedCategoryId && customCategoryName) {
      const existingCategory = await prisma.expenseCategory.findUnique({
        where: { name: customCategoryName },
      })
      if (existingCategory) {
        resolvedCategoryId = existingCategory.id
      } else {
        const newCategory = await prisma.expenseCategory.create({
          data: { name: customCategoryName },
        })
        resolvedCategoryId = newCategory.id
      }
    }

    if (!resolvedCategoryId) {
      return NextResponse.json({ message: 'Category is required' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        amount,
        paymentMethod,
        notes: notes || '',
        date: date ? new Date(date) : new Date(),
        businessId,
        categoryId: resolvedCategoryId,
      },
      include: { category: true },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ message: 'Failed to create expense' }, { status: 500 })
  }
}
