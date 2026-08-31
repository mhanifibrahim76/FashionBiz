import { NextResponse } from 'next/server'

const CSV_HEADER = 'SKU,Nama,Category,Harga Beli,Harga Jual,Stok,Min Stock'

const CSV_SAMPLE = `KS-BLK-01,Kaos Oversize Hitam,Kaos,45000,89900,50,10
KS-WHT-M,Kaos Oversize Putih,Kaos,45000,89900,32,10
HOD-BLK-M,Hoodie Basic Hitam,Hoodie,85000,169900,15,5
KMC-NVY-M,Kemeja Casual Navy,Kemeja,55000,129900,20,8`

export async function GET(request: Request) {
  const url = new URL(request.url)
  const format = url.searchParams.get('format')

  const headers = {
    'Content-Type': 'text/csv; charset=utf-8',
  }

  if (format === 'sample') {
    return new Response(CSV_SAMPLE, {
      ...headers,
      headers: {
        ...headers,
        'Content-Disposition': 'attachment; filename="contoh-produk.csv"',
      },
    })
  }

  const csvContent = `${CSV_HEADER}\n${CSV_SAMPLE}`

  return new Response(csvContent, {
    headers: {
      ...headers,
      'Content-Disposition': 'attachment; filename="template-produk-fashionbiz.csv"',
    },
  })
}
