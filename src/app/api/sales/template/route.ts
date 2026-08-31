const CSV_HEADER = "No. Invoice,Tanggal,Metode Pembayaran,Channel Penjualan,SKU Produk,Kuantitas,Harga Jual,Diskon,Total"

const CSV_SAMPLE = [
  "INV-2024-001,2024-01-15,Tunai,Toko Fisik,KS-BLK-01,2,89900,0,179800",
  "INV-2024-001,2024-01-15,Tunai,Toko Fisik,KMC-NVY-M,1,129900,0,129900",
  "INV-2024-002,2024-01-16,Transfer,Instagram,KS-WHT-M,3,89900,9000,269700",
  "INV-2024-003,2024-01-16,QRIS,TikTok,HOD-BLK-M,1,169900,0,169900",
]

export async function GET(request: Request) {
  const url = new URL(request.url)
  const format = url.searchParams.get("format")

  const headers = {
    "Content-Type": "text/csv; charset=utf-8",
  }

  if (format === "sample") {
    return new Response(CSV_SAMPLE.join("\n"), {
      headers: {
        ...headers,
        "Content-Disposition": 'attachment; filename="contoh-penjualan.csv"',
      },
    })
  }

  return new Response([CSV_HEADER, ...CSV_SAMPLE].join("\n"), {
    headers: {
      ...headers,
      "Content-Disposition": 'attachment; filename="template-penjualan-fashionbiz.csv"',
    },
  })
}
