import { prisma } from '../src/lib/prisma'
import { hash } from 'bcryptjs'

const categories = [
  { name: 'Kaos', description: 'Kemeja dan kaos' },
  { name: 'Hoodie', description: 'Hoodie dan sweater' },
  { name: 'Kemeja', description: 'Kemeja casual dan formal' },
  { name: 'Celana', description: 'Celana panjang dan pendek' },
  { name: 'Jaket', description: 'Jaket dan outerwear' },
]

const products = [
  {
    sku: 'KOV-BLK-S',
    name: 'Kaos Oversize',
    description: 'Kaos oversize premium dengan bahan katun combed 30s',
    costPrice: 45000,
    sellingPrice: 89900,
    minStock: 10,
    category: 'Kaos',
    variants: [
      { size: 'S', color: 'Hitam', colorCode: '#000000', stock: 25 },
      { size: 'M', color: 'Hitam', colorCode: '#000000', stock: 30 },
      { size: 'L', color: 'Hitam', colorCode: '#000000', stock: 20 },
      { size: 'XL', color: 'Hitam', colorCode: '#000000', stock: 15 },
    ],
  },
  {
    sku: 'KOV-WHT-M',
    name: 'Kaos Oversize',
    description: 'Kaos oversize premium warna putih',
    costPrice: 45000,
    sellingPrice: 89900,
    minStock: 10,
    category: 'Kaos',
    variants: [
      { size: 'M', color: 'Putih', colorCode: '#FFFFFF', stock: 22 },
      { size: 'L', color: 'Putih', colorCode: '#FFFFFF', stock: 18 },
      { size: 'XL', color: 'Putih', colorCode: '#FFFFFF', stock: 12 },
    ],
  },
  {
    sku: 'HOD-BLK-M',
    name: 'Hoodie Basic',
    description: 'Hoodie basic fleece premium',
    costPrice: 85000,
    sellingPrice: 169900,
    minStock: 5,
    category: 'Hoodie',
    variants: [
      { size: 'M', color: 'Hitam', colorCode: '#000000', stock: 15 },
      { size: 'L', color: 'Hitam', colorCode: '#000000', stock: 12 },
      { size: 'XL', color: 'Hitam', colorCode: '#000000', stock: 8 },
    ],
  },
  {
    sku: 'HOD-NVY-L',
    name: 'Hoodie Basic',
    description: 'Hoodie basic fleece navy',
    costPrice: 85000,
    sellingPrice: 169900,
    minStock: 5,
    category: 'Hoodie',
    variants: [
      { size: 'L', color: 'Navy', colorCode: '#1e3a8a', stock: 10 },
      { size: 'XL', color: 'Navy', colorCode: '#1e3a8a', stock: 7 },
    ],
  },
  {
    sku: 'KMC-NVY-M',
    name: 'Kemeja Casual',
    description: 'Kemeja casual linen cotton',
    costPrice: 55000,
    sellingPrice: 129900,
    minStock: 8,
    category: 'Kemeja',
    variants: [
      { size: 'M', color: 'Navy', colorCode: '#1e3a8a', stock: 20 },
      { size: 'L', color: 'Navy', colorCode: '#1e3a8a', stock: 15 },
      { size: 'XL', color: 'Navy', colorCode: '#1e3a8a', stock: 10 },
    ],
  },
  {
    sku: 'KMC-WHT-L',
    name: 'Kemeja Casual',
    description: 'Kemeja casual linen cotton putih',
    costPrice: 55000,
    sellingPrice: 129900,
    minStock: 8,
    category: 'Kemeja',
    variants: [
      { size: 'L', color: 'Putih', colorCode: '#FFFFFF', stock: 18 },
      { size: 'XL', color: 'Putih', colorCode: '#FFFFFF', stock: 12 },
    ],
  },
  {
    sku: 'CLC-KHK-32',
    name: 'Celana Cargo',
    description: 'Celana cargo streetwear',
    costPrice: 65000,
    sellingPrice: 149900,
    minStock: 8,
    category: 'Celana',
    variants: [
      { size: '32', color: 'Khaki', colorCode: '#c3b091', stock: 14 },
      { size: '34', color: 'Khaki', colorCode: '#c3b091', stock: 12 },
      { size: '36', color: 'Khaki', colorCode: '#c3b091', stock: 8 },
    ],
  },
  {
    sku: 'CLC-BLK-32',
    name: 'Celana Cargo',
    description: 'Celana cargo streetwear hitam',
    costPrice: 65000,
    sellingPrice: 149900,
    minStock: 8,
    category: 'Celana',
    variants: [
      { size: '32', color: 'Hitam', colorCode: '#000000', stock: 16 },
      { size: '34', color: 'Hitam', colorCode: '#000000', stock: 14 },
    ],
  },
  {
    sku: 'JKT-DNM-M',
    name: 'Jaket Denim',
    description: 'Jaket denim oversize',
    costPrice: 120000,
    sellingPrice: 249900,
    minStock: 5,
    category: 'Jaket',
    variants: [
      { size: 'M', color: 'Denim', colorCode: '#3b82f6', stock: 8 },
      { size: 'L', color: 'Denim', colorCode: '#3b82f6', stock: 6 },
      { size: 'XL', color: 'Denim', colorCode: '#3b82f6', stock: 4 },
    ],
  },
  {
    sku: 'JKT-BLK-M',
    name: 'Jaket Denim',
    description: 'Jaket denim oversize hitam',
    costPrice: 120000,
    sellingPrice: 249900,
    minStock: 5,
    category: 'Jaket',
    variants: [
      { size: 'M', color: 'Hitam', colorCode: '#000000', stock: 7 },
      { size: 'L', color: 'Hitam', colorCode: '#000000', stock: 5 },
    ],
  },
]

const expenseCategories = [
  { name: 'Bahan Baku', description: 'Biaya pembelian bahan baku' },
  { name: 'Produksi', description: 'Biaya produksi' },
  { name: 'Packaging', description: 'Biaya kemasan' },
  { name: 'Listrik', description: 'Biaya listrik' },
  { name: 'Air', description: 'Biaya air' },
  { name: 'Sewa', description: 'Biaya sewa tempat' },
  { name: 'Gaji', description: 'Biaya gaji karyawan' },
  { name: 'Transportasi', description: 'Biaya transportasi' },
  { name: 'Marketing', description: 'Biaya pemasaran' },
  { name: 'Marketplace', description: 'Biaya platform marketplace' },
  { name: 'Pajak', description: 'Biaya pajak' },
  { name: 'Operasional', description: 'Biaya operasional lain' },
]

const suppliers = [
  { name: 'Toko Bahan Tekstil Jaya', contact: '081234567890', address: 'Jakarta', productsSupplied: ['Kain', 'Benang'], lastPrice: 45000, totalPurchases: 0 },
  { name: 'Supplier Pack Indonesia', contact: '087765432100', address: 'Bandung', productsSupplied: ['Kardus', 'Plastik', 'Stiker'], lastPrice: 5000, totalPurchases: 0 },
  { name: 'Benang & Kain Sejahtera', contact: '089912345678', address: 'Semarang', productsSupplied: ['Kain', 'Benang', 'Resleting'], lastPrice: 42000, totalPurchases: 0 },
]

async function seed() {
  console.log('Seeding database...')

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }

  for (const cat of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }

  const user = await prisma.user.upsert({
    where: { email: 'demo@fashionbiz.ai' },
    update: {},
    create: {
      email: 'demo@fashionbiz.ai',
      password: await hash('demo123', 10),
      name: 'Ahmad Hidayat',
      phone: '081234567890',
    },
  })

  const business = await prisma.business.upsert({
    where: { userId: user.id },
    update: {
      name: 'Nusantara Wear',
      type: 'Toko Pakaian',
      description: 'Brand pakaian lokal yang fokus pada streetwear dan casual wear',
      yearEstablished: 2021,
      location: 'Jakarta',
      employeeCount: 5,
      salesChannels: ['Instagram', 'TikTok', 'Marketplace', 'Toko Fisik'],
      targetOmzet: 20000000,
      targetLaba: 5000000,
      targetTransaksi: 100,
      onboarded: true,
    },
    create: {
      name: 'Nusantara Wear',
      type: 'Toko Pakaian',
      description: 'Brand pakaian lokal yang fokus pada streetwear dan casual wear',
      yearEstablished: 2021,
      location: 'Jakarta',
      employeeCount: 5,
      salesChannels: ['Instagram', 'TikTok', 'Marketplace', 'Toko Fisik'],
      targetOmzet: 20000000,
      targetLaba: 5000000,
       targetTransaksi: 100,
       onboarded: true,
       userId: user.id,
    },
  })

  for (const sup of suppliers) {
    const existing = await prisma.supplier.findFirst({
      where: { name: sup.name, businessId: business.id },
    })

    if (!existing) {
      await prisma.supplier.create({
        data: { ...sup, businessId: business.id },
      })
    }
  }

  for (const product of products) {
    const category = await prisma.category.findUnique({
      where: { name: product.category },
    })

    if (!category) continue

    const createdProduct = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: {
        sku: product.sku,
        name: product.name,
        description: product.description,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        minStock: product.minStock,
        categoryId: category.id,
        businessId: business.id,
      },
    })

    for (const variant of product.variants) {
      const existingVariant = await prisma.productVariant.findFirst({
        where: {
          productId: createdProduct.id,
          size: variant.size,
          color: variant.color,
        },
      })

      if (!existingVariant) {
        await prisma.productVariant.create({
          data: {
            size: variant.size,
            color: variant.color,
            colorCode: variant.colorCode,
            stock: variant.stock,
            productId: createdProduct.id,
          },
        })
      }
    }
  }

  console.log('Seeding completed!')
  console.log('Demo credentials:')
  console.log('Email: demo@fashionbiz.ai')
  console.log('Password: demo123')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
