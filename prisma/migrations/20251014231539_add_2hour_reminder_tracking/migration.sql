-- AlterTable
ALTER TABLE "prompts" ADD COLUMN     "submission2HourWarningNotificationSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "voting2HourWarningNotificationSent" BOOLEAN NOT NULL DEFAULT false;
