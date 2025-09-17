import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';

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
              include: {
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
          currentPrompt = {
            id: league.prompts[0].id,
            text: league.prompts[0].text,
            status: league.prompts[0].status,
            challengeNumber
          };
        }

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

    return NextResponse.json({ leagues: leaguesWithActions });
  }
}, true); // requireAuth = true