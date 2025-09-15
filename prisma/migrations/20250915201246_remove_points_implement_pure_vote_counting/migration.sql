/*
  Warnings:

  - You are about to drop the column `totalPoints` on the `responses` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `votes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "responses" DROP COLUMN "totalPoints";

-- AlterTable
ALTER TABLE "votes" DROP COLUMN "points";
