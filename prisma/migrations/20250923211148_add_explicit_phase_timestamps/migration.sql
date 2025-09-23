-- AlterTable
ALTER TABLE "prompts" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "submissionEndedAt" TIMESTAMP(3),
ADD COLUMN     "votingEndedAt" TIMESTAMP(3);
