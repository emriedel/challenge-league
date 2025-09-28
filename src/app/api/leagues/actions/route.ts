import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import { getRealisticPhaseEndTime } from '@/lib/phaseCalculations';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

// Export handlers using the new centralized system
export const { GET } = createMethodHandlers({
  // GET /api/leagues/actions - Get user's leagues with action status
  GET: async ({ session }) => {
    const userId = session!.user.id;

    // Get user's leagues with their current prompts and user's participation
    const userLeagues = await db.leagueMembership.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        league: {
          include: {
            owner: {
              select: {
                id: true,
                username: true
              }
            },
            prompts: {
              where: {
                OR: [
                  { status: 'ACTIVE' },
                  { status: 'VOTING' }
                ]
              },
              select: {
                id: true,
                text: true,
                status: true,
                phaseStartedAt: true,
                responses: {
                  where: { userId },
                  select: { id: true }
                },
                _count: {
                  select: {
                    responses: true
                  }
                }
              },
              orderBy: {
                queueOrder: 'asc'
              },
              take: 1 // Only get the current prompt
            },
            _count: {
              select: {
                memberships: {
                  where: { isActive: true }
                }
              }
            }
          }
        }
      }
    });

    const leaguesWithActions = await Promise.all(
      userLeagues.map(async membership => {
        const league = membership.league;
        let needsAction = false;
        let actionType: 'submission' | 'voting' | null = null;
        let currentPrompt = null;
        let challengeNumber = null;

        // Get challenge number by counting completed prompts + 1
        if (league.prompts.length > 0) {
          const completedCount = await db.prompt.count({
            where: {
              leagueId: league.id,
              status: 'COMPLETED'
            }
          });
          challengeNumber = completedCount + 1;

          const prompt = league.prompts[0];

          // Calculate phase end time using centralized logic
          const phaseEndsAt = getRealisticPhaseEndTime(
            {
              id: prompt.id,
              status: prompt.status,
              phaseStartedAt: prompt.phaseStartedAt
            },
            {
              submissionDays: league.submissionDays,
              votingDays: league.votingDays,
              votesPerPlayer: league.votesPerPlayer
            }
          );

          currentPrompt = {
            id: prompt.id,
            text: prompt.text,
            status: prompt.status,
            challengeNumber,
            phaseEndsAt
          };
        }

        // Only check for actions if the league has been started
        if (league.isStarted) {
          // Check if user needs to take action on any active/voting prompts
          for (const prompt of league.prompts) {
            if (prompt.status === 'ACTIVE') {
              // User needs to submit if they haven't submitted yet
              if (prompt.responses.length === 0) {
                needsAction = true;
                actionType = 'submission';
                break;
              }
            } else if (prompt.status === 'VOTING') {
              // Get user's votes for this prompt
              const userVotes = await db.vote.count({
                where: {
                  voterId: userId,
                  response: {
                    promptId: prompt.id
                  }
                }
              });

              // User needs to vote if they haven't cast enough votes
              // They get votesPerPlayer votes, but can't vote for their own submission
              const maxVotes = league.votesPerPlayer;
              const userHasSubmission = prompt.responses.length > 0;
              const availableSubmissions = prompt._count.responses - (userHasSubmission ? 1 : 0);
              const expectedVotes = Math.min(maxVotes, availableSubmissions);

              if (userVotes < expectedVotes) {
                needsAction = true;
                actionType = 'voting';
                break;
              }
            }
          }
        }

        return {
          ...league,
          memberCount: league._count.memberships,
          isOwner: league.ownerId === userId,
          needsAction,
          actionType,
          currentPrompt
        };
      })
    );

    // Sort leagues by member count (highest first)
    const sortedLeagues = leaguesWithActions.sort((a, b) => b.memberCount - a.memberCount);

    return NextResponse.json({ leagues: sortedLeagues });
  }
}, true); // requireAuth = true