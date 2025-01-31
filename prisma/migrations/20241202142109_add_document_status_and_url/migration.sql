/*
  Warnings:

  - A unique constraint covering the columns `[userId,title]` on the table `documents` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."documents" ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
ADD COLUMN     "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "url" TEXT;

-- CreateIndex
CREATE INDEX "documents_status_idx" ON "public"."documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "documents_userId_title_key" ON "public"."documents"("userId", "title");
