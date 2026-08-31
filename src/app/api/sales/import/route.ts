import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

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
    const errors: string[] = []
    let success = 0
    let skipped = 0

    const invoiceGroups: Record<string, Record<string, string>[]> = {}
    for (let i = 0; i < records.length; i++) {
      const row = records[i]
      const invoice = row['No. Invoice'] || 'INV-AUTO-' + (i + 1)
      if (!invoiceGroups[invoice]) invoiceGroups[invoice] = []
      invoiceGroups[invoice].push(row)
    }

    for (const invoice in invoiceGroups) {
      const rows = invoiceGroups[invoice]
      let total = 0
      const itemData: {
        quantity: number
        unitPrice: number
        total: number
        variantId: string
        productId: string
      }[] = []

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r]
        const sku = row['SKU Produk']
        if (!sku) {
          errors.push('SKU Produk tidak ditemukan pada invoice ' + invoice)
          continue
        }

        const product = await prisma.product.findFirst({
          where: { sku, businessId },
        })
        if (!product) {
          errors.push('Produk dengan SKU ' + sku + ' tidak ditemukan')
          continue
        }

        const variant = await prisma.productVariant.findFirst({
          where: { productId: product.id },
          orderBy: { id: 'asc' },
        })
        if (!variant) {
          errors.push('Tidak ada varian untuk produk ' + sku)
          continue
        }

        const quantity = parseInt(row['Kuantitas'] || '1', 10)
        const unitPrice = parseFloat(row['Harga Jual'] || '0')
        const discount = parseFloat(row['Diskon'] || '0')
        const itemTotal = unitPrice * quantity - discount
        total += itemTotal

        if (variant.stock < quantity) {
          errors.push('Stok tidak cukup untuk ' + sku)
          continue
        }

        itemData.push({ quantity, unitPrice, total: itemTotal, variantId: variant.id, productId: product.id })
      }

      if (itemData.length === 0) continue

      const dateStr = rows[0]['Tanggal'] || new Date().toISOString().split('T')[0]
      const payment = rows[0]['Metode Pembayaran'] || 'Tunai'
      const channel = rows[0]['Channel Penjualan'] || 'Toko Fisik'

      try {
        await prisma.sale.create({
          data: {
            invoiceNumber: invoice,
            date: new Date(dateStr),
            paymentMethod: payment,
            salesChannel: channel,
            discount: 0,
            total,
            status: 'COMPLETED',
            businessId,
            items: { create: itemData },
          },
        })
        success++
      } catch (err) {
        errors.push('Invoice ' + invoice + ': Gagal menyimpan')
      }
    }

    return NextResponse.json({
      message: 'Import selesai: ' + success + ' berhasil, ' + errors.length + ' error',
      success,
      errors,
    }, { status: 200 })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json({ message: 'Failed to process CSV' }, { status: 500 })
  }
}
