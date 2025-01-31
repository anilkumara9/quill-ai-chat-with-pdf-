/*
  Warnings:

  - The primary key for the `_PostToTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_UserFollows` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_PostToTag` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_UserFollows` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."_PostToTag" DROP CONSTRAINT "_PostToTag_AB_pkey";

-- AlterTable
ALTER TABLE "public"."_UserFollows" DROP CONSTRAINT "_UserFollows_AB_pkey";

-- AlterTable
ALTER TABLE "public"."documents" ADD COLUMN     "url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "_PostToTag_AB_unique" ON "public"."_PostToTag"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_UserFollows_AB_unique" ON "public"."_UserFollows"("A", "B");
