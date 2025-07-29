import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Exclude O and 0 for clarity
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a URL-safe slug from a name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/leagues - Get user's leagues
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's leagues
    const userLeagues = await db.leagueMembership.findMany({
      where: {
        userId: session.user.id,
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
      isOwner: membership.league.ownerId === session.user.id
    }));

    return NextResponse.json({ leagues });

  } catch (error) {
    console.error('Error fetching user leagues:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch leagues' 
    }, { status: 500 });
  }
}

// POST /api/leagues - Create new league
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description } = await request.json();

    if (!name || !description) {
      return NextResponse.json({ 
        error: 'Name and description are required' 
      }, { status: 400 });
    }

    if (!session.user.id) {
      return NextResponse.json({ 
        error: 'Invalid session - user ID missing' 
      }, { status: 401 });
    }

    // Generate unique slug and invite code
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (await db.league.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
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
        slug,
        description,
        inviteCode,
        ownerId: session.user.id,
        isActive: true,
      },
    });

    // Add creator as a member
    await db.leagueMembership.create({
      data: {
        userId: session.user.id,
        leagueId: league.id,
        isActive: true,
      },
    });

    return NextResponse.json({ 
      league: {
        ...league,
        isOwner: true,
        memberCount: 1
      }
    });

  } catch (error) {
    console.error('Error creating league:', error);
    return NextResponse.json({ 
      error: 'Failed to create league' 
    }, { status: 500 });
  }
}