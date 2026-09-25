-- AlterTable
ALTER TABLE "creator_profiles" DROP COLUMN "danceSubCategories";

-- DropEnum
DROP TYPE "DanceSubCategory";

-- CreateTable
CREATE TABLE "branch_sub_categories" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_sub_categories" (
    "creatorId" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_sub_categories_pkey" PRIMARY KEY ("creatorId","subCategoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "branch_sub_categories_slug_key" ON "branch_sub_categories"("slug");

-- CreateIndex
CREATE INDEX "branch_sub_categories_branchId_isActive_sortOrder_idx" ON "branch_sub_categories"("branchId", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "coach_sub_categories_subCategoryId_idx" ON "coach_sub_categories"("subCategoryId");

-- AddForeignKey
ALTER TABLE "branch_sub_categories" ADD CONSTRAINT "branch_sub_categories_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_sub_categories" ADD CONSTRAINT "coach_sub_categories_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_sub_categories" ADD CONSTRAINT "coach_sub_categories_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "branch_sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

