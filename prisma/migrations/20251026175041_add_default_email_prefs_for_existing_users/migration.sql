-- Create default email preferences for all existing users who don't have them yet
INSERT INTO "email_preferences" ("id", "userId", "challengeStarted", "votingStarted", "resultsReady", "weeklyDigest", "createdAt", "updatedAt")
SELECT
  gen_random_uuid(),
  u.id,
  true,  -- challengeStarted: default ON
  true,  -- votingStarted: default ON
  true,  -- resultsReady: default ON
  false, -- weeklyDigest: default OFF
  NOW(),
  NOW()
FROM "users" u
WHERE NOT EXISTS (
  SELECT 1 FROM "email_preferences" ep WHERE ep."userId" = u.id
);