-- AlterTable
ALTER TABLE "prompts" ADD COLUMN     "submissionWarningNotificationSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "votingWarningNotificationSent" BOOLEAN NOT NULL DEFAULT false;
