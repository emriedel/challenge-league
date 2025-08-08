import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function StandingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  try {
    // Get user's first league for now - in the future, we'll need league selection
    const userWithLeagues = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        leagueMemberships: {
          include: {
            league: true
          },
          where: {
            isActive: true
          }
        }
      }
    });

    if (!userWithLeagues?.leagueMemberships.length) {
      redirect('/leagues/join');
    }

    // Use first league for now
    const firstLeague = userWithLeagues.leagueMemberships[0].league;
    
    // Redirect to the league's standings page
    redirect(`/league/${firstLeague.id}/standings`);
  } catch (error) {
    console.error('Error in StandingsPage:', error);
    redirect('/');
  }
}