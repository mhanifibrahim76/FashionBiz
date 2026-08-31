import { prisma } from "./src/lib/prisma"
async function main() {
  const products = await prisma.product.findMany({ where: { business: { user: { email: "demo@fashionbiz.ai" } } }, take: 3, select: { id: true, sku: true, name: true, variants: { take: 1, select: { id: true, stock: true } } } })
  console.log(JSON.stringify(products,null,2))
}
main().catch(console.error).finally(() => prisma.$disconnect())