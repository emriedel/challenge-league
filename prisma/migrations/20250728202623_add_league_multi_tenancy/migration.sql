/*
  Warnings:

  - You are about to drop the column `category` on the `prompts` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `prompts` table. All the data in the column will be lost.
  - Added the required column `inviteCode` to the `leagues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `leagues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `leagues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leagueId` to the `prompts` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_leagues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "leagues_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_leagues" ("createdAt", "description", "id", "isActive", "name", "updatedAt") SELECT "createdAt", "description", "id", "isActive", "name", "updatedAt" FROM "leagues";
DROP TABLE "leagues";
ALTER TABLE "new_leagues" RENAME TO "leagues";
CREATE UNIQUE INDEX "leagues_name_key" ON "leagues"("name");
CREATE UNIQUE INDEX "leagues_slug_key" ON "leagues"("slug");
CREATE UNIQUE INDEX "leagues_inviteCode_key" ON "leagues"("inviteCode");
CREATE TABLE "new_prompts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "weekStart" DATETIME NOT NULL,
    "weekEnd" DATETIME NOT NULL,
    "voteStart" DATETIME NOT NULL,
    "voteEnd" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "queueOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "leagueId" TEXT NOT NULL,
    CONSTRAINT "prompts_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_prompts" ("createdAt", "id", "queueOrder", "status", "text", "updatedAt", "voteEnd", "voteStart", "weekEnd", "weekStart") SELECT "createdAt", "id", "queueOrder", "status", "text", "updatedAt", "voteEnd", "voteStart", "weekEnd", "weekStart" FROM "prompts";
DROP TABLE "prompts";
ALTER TABLE "new_prompts" RENAME TO "prompts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
