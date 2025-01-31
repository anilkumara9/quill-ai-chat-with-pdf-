/*
  Warnings:

  - You are about to drop the column `text` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `documents` table. All the data in the column will be lost.
  - You are about to alter the column `fileType` on the `documents` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `title` on the `posts` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `name` on the `tags` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `username` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to drop the `chats` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[authorId,postId,commentId]` on the table `votes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `votes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."chats" DROP CONSTRAINT "chats_documentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."chats" DROP CONSTRAINT "chats_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_replyToId_fkey";

-- DropIndex
DROP INDEX "public"."votes_authorId_postId_key";

-- AlterTable
ALTER TABLE "public"."comments" DROP COLUMN "text",
ADD COLUMN     "content" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."documents" DROP COLUMN "name",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "title" VARCHAR(255) NOT NULL,
ALTER COLUMN "fileType" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "public"."posts" ALTER COLUMN "title" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "public"."tags" ALTER COLUMN "name" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "username" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "public"."votes" ADD COLUMN     "commentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "postId" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."chats";

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Version" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Share" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Chat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShareLink" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "permission" VARCHAR(10) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "useCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShareInvitation" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "permission" VARCHAR(10) NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentAccess" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" VARCHAR(10) NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "DocumentAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentActivity" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "public"."Category"("userId");

-- CreateIndex
CREATE INDEX "Version_documentId_idx" ON "public"."Version"("documentId");

-- CreateIndex
CREATE INDEX "Version_documentId_createdAt_idx" ON "public"."Version"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "Share_documentId_idx" ON "public"."Share"("documentId");

-- CreateIndex
CREATE INDEX "Share_userId_idx" ON "public"."Share"("userId");

-- CreateIndex
CREATE INDEX "Share_documentId_userId_idx" ON "public"."Share"("documentId", "userId");

-- CreateIndex
CREATE INDEX "Share_permission_idx" ON "public"."Share"("permission");

-- CreateIndex
CREATE INDEX "Chat_userId_createdAt_idx" ON "public"."Chat"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Chat_documentId_createdAt_idx" ON "public"."Chat"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "Chat_userId_documentId_idx" ON "public"."Chat"("userId", "documentId");

-- CreateIndex
CREATE INDEX "Message_chatId_createdAt_idx" ON "public"."Message"("chatId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_role_idx" ON "public"."Message"("role");

-- CreateIndex
CREATE INDEX "Message_chatId_role_idx" ON "public"."Message"("chatId", "role");

-- CreateIndex
CREATE INDEX "ShareLink_documentId_createdAt_idx" ON "public"."ShareLink"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "ShareLink_createdBy_idx" ON "public"."ShareLink"("createdBy");

-- CreateIndex
CREATE INDEX "ShareLink_expiresAt_idx" ON "public"."ShareLink"("expiresAt");

-- CreateIndex
CREATE INDEX "ShareLink_documentId_permission_idx" ON "public"."ShareLink"("documentId", "permission");

-- CreateIndex
CREATE INDEX "ShareInvitation_documentId_email_idx" ON "public"."ShareInvitation"("documentId", "email");

-- CreateIndex
CREATE INDEX "ShareInvitation_invitedBy_idx" ON "public"."ShareInvitation"("invitedBy");

-- CreateIndex
CREATE INDEX "ShareInvitation_email_createdAt_idx" ON "public"."ShareInvitation"("email", "createdAt");

-- CreateIndex
CREATE INDEX "ShareInvitation_expiresAt_idx" ON "public"."ShareInvitation"("expiresAt");

-- CreateIndex
CREATE INDEX "ShareInvitation_documentId_permission_idx" ON "public"."ShareInvitation"("documentId", "permission");

-- CreateIndex
CREATE INDEX "DocumentAccess_documentId_permission_idx" ON "public"."DocumentAccess"("documentId", "permission");

-- CreateIndex
CREATE INDEX "DocumentAccess_userId_permission_idx" ON "public"."DocumentAccess"("userId", "permission");

-- CreateIndex
CREATE INDEX "DocumentAccess_expiresAt_idx" ON "public"."DocumentAccess"("expiresAt");

-- CreateIndex
CREATE INDEX "DocumentAccess_grantedBy_idx" ON "public"."DocumentAccess"("grantedBy");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentAccess_documentId_userId_key" ON "public"."DocumentAccess"("documentId", "userId");

-- CreateIndex
CREATE INDEX "DocumentActivity_documentId_createdAt_idx" ON "public"."DocumentActivity"("documentId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentActivity_userId_createdAt_idx" ON "public"."DocumentActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentActivity_documentId_userId_idx" ON "public"."DocumentActivity"("documentId", "userId");

-- CreateIndex
CREATE INDEX "DocumentActivity_action_idx" ON "public"."DocumentActivity"("action");

-- CreateIndex
CREATE INDEX "comments_authorId_idx" ON "public"."comments"("authorId");

-- CreateIndex
CREATE INDEX "comments_postId_idx" ON "public"."comments"("postId");

-- CreateIndex
CREATE INDEX "comments_createdAt_idx" ON "public"."comments"("createdAt");

-- CreateIndex
CREATE INDEX "comments_replyToId_idx" ON "public"."comments"("replyToId");

-- CreateIndex
CREATE INDEX "documents_userId_createdAt_idx" ON "public"."documents"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "documents_categoryId_idx" ON "public"."documents"("categoryId");

-- CreateIndex
CREATE INDEX "documents_fileType_idx" ON "public"."documents"("fileType");

-- CreateIndex
CREATE INDEX "documents_createdAt_idx" ON "public"."documents"("createdAt");

-- CreateIndex
CREATE INDEX "documents_userId_fileType_idx" ON "public"."documents"("userId", "fileType");

-- CreateIndex
CREATE INDEX "documents_userId_categoryId_idx" ON "public"."documents"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "public"."posts"("authorId");

-- CreateIndex
CREATE INDEX "posts_createdAt_idx" ON "public"."posts"("createdAt");

-- CreateIndex
CREATE INDEX "posts_published_idx" ON "public"."posts"("published");

-- CreateIndex
CREATE INDEX "tags_name_idx" ON "public"."tags"("name");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "public"."users"("username");

-- CreateIndex
CREATE INDEX "votes_authorId_idx" ON "public"."votes"("authorId");

-- CreateIndex
CREATE INDEX "votes_postId_idx" ON "public"."votes"("postId");

-- CreateIndex
CREATE INDEX "votes_commentId_idx" ON "public"."votes"("commentId");

-- CreateIndex
CREATE INDEX "votes_type_idx" ON "public"."votes"("type");

-- CreateIndex
CREATE UNIQUE INDEX "votes_authorId_postId_commentId_key" ON "public"."votes"("authorId", "postId", "commentId");

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Version" ADD CONSTRAINT "Version_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Share" ADD CONSTRAINT "Share_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Share" ADD CONSTRAINT "Share_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."votes" ADD CONSTRAINT "votes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chat" ADD CONSTRAINT "Chat_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShareLink" ADD CONSTRAINT "ShareLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShareInvitation" ADD CONSTRAINT "ShareInvitation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentAccess" ADD CONSTRAINT "DocumentAccess_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentActivity" ADD CONSTRAINT "DocumentActivity_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
