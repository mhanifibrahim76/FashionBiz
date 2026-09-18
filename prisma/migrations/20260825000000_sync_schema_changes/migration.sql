-- Sync schema changes from local database to migration history
-- This migration brings the schema in line with prisma/schema.prisma

-- AlterTable: purchases - add notes column (was missing in initial migration)
ALTER TABLE "purchases" ADD COLUMN "notes" TEXT;

-- AlterTable: purchases - supplierId was NOT NULL in initial migration, now nullable per schema.prisma
ALTER TABLE "purchases" ALTER COLUMN "supplierId" DROP NOT NULL;

-- DropForeignKey: purchases_supplierId_fkey - was ON DELETE RESTRICT in initial migration, should be SET NULL
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_supplierId_fkey";

-- AddForeignKey: purchases.supplierId -> suppliers.id, ON DELETE SET NULL (nullable relation)
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplierId_fkey"
  FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: purchase_items - add variantId column (was missing in initial migration)
ALTER TABLE "purchase_items" ADD COLUMN "variantId" TEXT;

-- AddForeignKey: purchase_items.variantId -> product_variants.id, ON DELETE SET NULL (nullable relation)
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "product_variants"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
