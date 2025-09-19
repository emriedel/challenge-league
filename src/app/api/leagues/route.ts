import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import { ValidationError } from '@/lib/apiErrors';
import { getStarterPrompts } from '@/lib/starterPrompts';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Exclude O and 0 for clarity
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Export handlers using the new centralized system
export const { GET, POST } = createMethodHandlers({
  // GET /api/leagues - Get user's leagues
  GET: async ({ session }) => {
    const userId = session!.user.id;

    // Get user's leagues
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
            memberships: {
              where: { isActive: true },
              include: {
                user: {
                  select: {
                    id: true,
                    username: true
                  }
                }
              }
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

    const leagues = userLeagues.map(membership => ({
      ...membership.league,
      memberCount: membership.league._count.memberships,
      isOwner: membership.league.ownerId === userId
    }));

    return NextResponse.json({ leagues });
  },

  // POST /api/leagues - Create new league
  POST: async ({ session, req }) => {
    const userId = session!.user.id;
    const { name, description } = await req.json();

    if (!name || !description) {
      throw new ValidationError('Name and description are required');
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    while (await db.league.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
    }

    // Create the league
    const league = await db.league.create({
      data: {
        name,
        description,
        inviteCode,
        ownerId: userId,
        isActive: true,
      },
    });

    // Add creator as a member
    await db.leagueMembership.create({
      data: {
        userId,
        leagueId: league.id,
        isActive: true,
      },
    });

    // Add starter prompts to the new league
    const starterPrompts = getStarterPrompts(8); // Get 8 random starter prompts
    
    // Create prompts with sequential queue order
    const promptCreationData = starterPrompts.map((promptText, index) => {
      return {
        text: promptText,
        leagueId: league.id,
        status: 'SCHEDULED' as const,
        queueOrder: index + 1,
      };
    });

    await db.prompt.createMany({
      data: promptCreationData,
    });

    // Immediately activate the first prompt for the new league
    const firstPrompt = await db.prompt.findFirst({
      where: {
        leagueId: league.id,
        status: 'SCHEDULED',
      },
      orderBy: { queueOrder: 'asc' },
    });

    if (firstPrompt) {
      await db.prompt.update({
        where: { id: firstPrompt.id },
        data: {
          status: 'ACTIVE',
          phaseStartedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ 
      league: {
        ...league,
        isOwner: true,
        memberCount: 1
      }
    });
  }
}, true); // requireAuth = true