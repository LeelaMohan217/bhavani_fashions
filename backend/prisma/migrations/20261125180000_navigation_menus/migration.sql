-- CreateEnum
CREATE TYPE "NavMenu" AS ENUM ('HEADER', 'FOOTER');

-- CreateEnum
CREATE TYPE "NavLinkKind" AS ENUM ('CATEGORY', 'LINK', 'NONE');

-- CreateTable
CREATE TABLE "NavItem" (
    "id" TEXT NOT NULL,
    "menu" "NavMenu" NOT NULL,
    "parentId" TEXT,
    "label" TEXT NOT NULL,
    "kind" "NavLinkKind" NOT NULL DEFAULT 'LINK',
    "categoryId" TEXT,
    "href" TEXT,
    "badge" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NavItem_menu_parentId_sortOrder_idx" ON "NavItem"("menu", "parentId", "sortOrder");

-- AddForeignKey
ALTER TABLE "NavItem" ADD CONSTRAINT "NavItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "NavItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavItem" ADD CONSTRAINT "NavItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
