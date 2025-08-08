import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function SettingsPage() {
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
    
    // Check if user is owner/admin of this league
    const isOwner = firstLeague.ownerId === session.user.id;
    
    if (isOwner) {
      // Redirect to league settings page for admins
      redirect(`/league/${firstLeague.id}/league-settings`);
    } else {
      // For non-admins, redirect to profile page for now
      // In the future, this could be a general settings page
      redirect('/profile');
    }
  } catch (error) {
    console.error('Error in SettingsPage:', error);
    redirect('/profile');
  }
}