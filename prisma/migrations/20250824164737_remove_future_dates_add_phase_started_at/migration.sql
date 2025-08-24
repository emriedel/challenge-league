/*
  Warnings:

  - You are about to drop the column `voteEnd` on the `prompts` table. All the data in the column will be lost.
  - You are about to drop the column `voteStart` on the `prompts` table. All the data in the column will be lost.
  - You are about to drop the column `weekEnd` on the `prompts` table. All the data in the column will be lost.
  - You are about to drop the column `weekStart` on the `prompts` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_prompts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "phaseStartedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "queueOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "leagueId" TEXT NOT NULL,
    CONSTRAINT "prompts_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_prompts" ("createdAt", "id", "leagueId", "queueOrder", "status", "text", "updatedAt") SELECT "createdAt", "id", "leagueId", "queueOrder", "status", "text", "updatedAt" FROM "prompts";
DROP TABLE "prompts";
ALTER TABLE "new_prompts" RENAME TO "prompts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
