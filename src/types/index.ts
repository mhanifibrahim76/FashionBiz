export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: string
  business?: Business
}

export interface Business {
  id: string
  name: string
  type: string
  description?: string
  yearEstablished?: number
  location?: string
  employeeCount?: number
  salesChannels: string[]
  targetOmzet?: number
  targetLaba?: number
  targetTransaksi?: number
  targetGrowth?: number
}

export interface Product {
  id: string
  sku: string
  name: string
  description?: string
  image?: string
  costPrice: number
  sellingPrice: number
  minStock: number
  status: string
  categoryId: string
  category?: Category
  variants: ProductVariant[]
}

export interface Category {
  id: string
  name: string
  description?: string
}

export interface ProductVariant {
  id: string
  size?: string
  color?: string
  colorCode?: string
  stock: number
}

export interface Sale {
  id: string
  invoiceNumber: string
  date: string
  paymentMethod: string
  salesChannel: string
  discount: number
  total: number
  status: string
  items: SaleItem[]
}

export interface SaleItem {
  id: string
  quantity: number
  unitPrice: number
  total: number
  productId: string
  product?: Product
}

export interface Expense {
  id: string
  date: string
  amount: number
  paymentMethod: string
  notes?: string
  category: ExpenseCategory
}

export interface ExpenseCategory {
  id: string
  name: string
  description?: string
}

export interface Supplier {
  id: string
  name: string
  contact?: string
  address?: string
  productsSupplied: string[]
  lastPrice?: number
  totalPurchases: number
}

export interface Purchase {
  id: string
  purchaseNumber: string
  date: string
  status: string
  total: number
  supplier: Supplier
  items: PurchaseItem[]
}

export interface PurchaseItem {
  id: string
  quantity: number
  unitPrice: number
  total: number
  productId: string
}

export interface BusinessTarget {
  id: string
  type: string
  targetValue: number
  period: string
  startDate: string
  endDate: string
  currentValue: number
}

export interface AIInsight {
  id: string
  type: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  insight: string
  recommendation: string
  reasoning?: string
  impact?: string
  status: string
}

export interface DashboardMetrics {
  omzet: number
  totalPengeluaran: number
  labaBersih: number
  marginLaba: number
  totalTransaksi: number
  nilaiStok: number
  omzetGrowth: number
  pengeluaranGrowth: number
  labaGrowth: number
}
