import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('id-ID').format(num)
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function calculateMargin(revenue: number, cost: number) {
  if (revenue === 0) return 0
  return ((revenue - cost) / revenue) * 100
}

export function calculateGrowth(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}
