-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "responses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "submissionDays" INTEGER NOT NULL DEFAULT 5,
    "votingDays" INTEGER NOT NULL DEFAULT 2,
    "votesPerPlayer" INTEGER NOT NULL DEFAULT 3,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "leagues_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_leagues" ("createdAt", "description", "id", "inviteCode", "isActive", "name", "ownerId", "slug", "updatedAt") SELECT "createdAt", "description", "id", "inviteCode", "isActive", "name", "ownerId", "slug", "updatedAt" FROM "leagues";
DROP TABLE "leagues";
ALTER TABLE "new_leagues" RENAME TO "leagues";
CREATE UNIQUE INDEX "leagues_name_key" ON "leagues"("name");
CREATE UNIQUE INDEX "leagues_slug_key" ON "leagues"("slug");
CREATE UNIQUE INDEX "leagues_inviteCode_key" ON "leagues"("inviteCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "comments_authorId_responseId_key" ON "comments"("authorId", "responseId");
