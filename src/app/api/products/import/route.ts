import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0])

  const records: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 1 && values[0] === '') continue

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? ''
    })
    records.push(row)
  }
  return records
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('csvFile')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: 'No CSV file uploaded' }, { status: 400 })
    }

    const text = await file.text()
    const records = parseCSV(text)

    if (records.length === 0) {
      return NextResponse.json({ message: 'CSV file is empty or invalid' }, { status: 400 })
    }

    const businessId = session.user.business.id

    const categories = await prisma.category.findMany({
      where: { name: { in: [...new Set(records.map((r) => r.Category))] } },
      select: { id: true, name: true },
    })
    const categoryMap = new Map(categories.map((c) => [c.name, c.id]))

    const errors: string[] = []
    let success = 0
    let skipped = 0

    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const rowNumber = i + 2

      if (!row.SKU || !row.Nama || !row.Category || !row['Harga Beli'] || !row['Harga Jual'] || !row.Stok || !row['Min Stock']) {
        errors.push(`Baris ${rowNumber}: Field required tidak lengkap`)
        continue
      }

      const categoryId = categoryMap.get(row.Category)
      if (!categoryId) {
        errors.push(`Baris ${rowNumber}: Kategori "${row.Category}" tidak ditemukan`)
        continue
      }

      const costPrice = parseFloat(row['Harga Beli'].replace(/[^0-9.-]+/g, ''))
      const sellingPrice = parseFloat(row['Harga Jual'].replace(/[^0-9.-]+/g, ''))
      const stock = parseInt(row.Stok, 10)
      const minStock = parseInt(row['Min Stock'], 10)

      if (isNaN(costPrice) || isNaN(sellingPrice) || isNaN(stock) || isNaN(minStock)) {
        errors.push(`Baris ${rowNumber}: Format angka tidak valid`)
        continue
      }

      const existingProduct = await prisma.product.findUnique({
        where: { sku: row.SKU },
      })

      if (existingProduct) {
        skipped++
        continue
      }

      try {
        await prisma.product.create({
          data: {
            sku: row.SKU,
            name: row.Nama,
            costPrice,
            sellingPrice,
            minStock,
            categoryId,
            businessId,
            variants: {
              create: {
                size: 'One Size',
                color: 'Default',
                stock,
              },
            },
          },
        })
        success++
      } catch (err) {
        errors.push(`Baris ${rowNumber}: Gagal menyimpan produk (mungkin duplikat SKU)`)
      }
    }

    return NextResponse.json({
      message: `Import selesai: ${success} berhasil, ${skipped} duplikat dilewati, ${errors.length} error`,
      success,
      skipped,
      errors,
    }, { status: 200 })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ message: 'Failed to process CSV' }, { status: 500 })
  }
}
