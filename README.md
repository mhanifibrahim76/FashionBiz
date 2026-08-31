# FashionBiz AI

Platform Business Intelligence berbasis Artificial Intelligence untuk UMKM Fashion.

## Tech Stack

- **Framework**: Next.js 14 dengan App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Charts**: Recharts
- **AI**: OpenAI API

## Setup dengan Docker

### Prerequisites
- Docker Desktop sudah terinstal

### Langkah-langkah Setup

1. **Clone atau extract project** ke direktori lokal

2. **Jalankan Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Masuk ke container app**
   ```bash
   docker-compose exec app sh
   ```

4. **Jalankan Prisma Migration**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Seed Database dengan Demo Data**
   ```bash
   npx prisma db seed
   ```

6. **Akses aplikasi**
   - Buka browser dan akses `http://localhost:3000`
   - Demo account: `demo@fashionbiz.ai` / `demo123`

## Development (tanpa Docker)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env sesuai konfigurasi database
   ```

3. **Jalankan database PostgreSQL**
   - Pastikan PostgreSQL berjalan di localhost:5432

4. **Setup database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Jalankan development server**
   ```bash
   npm run dev
   ```

6. **Akses aplikasi**
   - Buka `http://localhost:3000`

## Fitur Utama

### Must Have
- [x] Authentication (Login/Register)
- [x] Dashboard dengan KPI cards
- [x] Manajemen Produk
- [x] Manajemen Penjualan
- [x] Manajemen Pengeluaran
- [x] Manajemen Inventory
- [x] Chart dan Visualisasi
- [x] AI Business Insight
- [x] Perhitungan Laba

### Should Have
- [ ] Manajemen Supplier
- [ ] Manajemen Pembelian
- [ ] Target Bisnis
- [ ] Notifikasi
- [ ] Laporan
- [ ] Export PDF/Excel

### Nice to Have
- [ ] AI Chatbot
- [ ] Forecasting
- [ ] Multi-user

## Struktur Database

### Entitas Utama
- **User**: Data pengguna
- **Business**: Profil bisnis UMKM
- **Product**: Katalog produk
- **ProductVariant**: Variasi produk (ukuran, warna, stok)
- **Sale**: Transaksi penjualan
- **SaleItem**: Detail item penjualan
- **Expense**: Pengeluaran operasional
- **Purchase**: Pembelian dari supplier
- **Supplier**: Data supplier
- **InventoryTransaction**: Transaksi stok
- **BusinessTarget**: Target bisnis
- **AIInsight**: Insight dan rekomendasi AI
- **Notification**: Notifikasi sistem

## Demo Data

Project dilengkapi dengan demo data yang realistis untuk brand fashion "Nusantara Wear" yang mencakup:
- 5 kategori produk (Kaos, Hoodie, Kemeja, Celana, Jaket)
- 10 produk dengan variasi ukuran dan warna
- 12 kategori pengeluaran
- 3 supplier

Demo credentials: `demo@fashionbiz.ai` / `demo123`

## License

MIT
