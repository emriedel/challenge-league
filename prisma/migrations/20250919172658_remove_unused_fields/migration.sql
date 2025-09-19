/*
  Warnings:

  - You are about to drop the column `slug` on the `leagues` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "leagues_slug_key";

-- AlterTable
ALTER TABLE "leagues" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerified",
DROP COLUMN "image";
