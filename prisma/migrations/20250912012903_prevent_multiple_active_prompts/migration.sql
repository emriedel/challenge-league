-- Add unique partial index to prevent multiple active/voting prompts per league
-- This constraint ensures only one prompt can be ACTIVE or VOTING per league at any time
CREATE UNIQUE INDEX "idx_one_active_prompt_per_league" ON "prompts" ("leagueId") 
WHERE "status" IN ('ACTIVE', 'VOTING');