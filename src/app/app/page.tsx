import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import AppHomeClient from '@/components/AppHomeClient';

export default async function HomePage() {
  // Get session server-side
  const session = await getServerSession(authOptions);

  // If not authenticated, redirect to signin
  if (!session?.user?.id) {
    redirect('/app/auth/signin');
  }

  // Check user's leagues server-side
  const userLeagues = await db.leagueMembership.findMany({
    where: {
      userId: session.user.id,
      isActive: true
    },
    include: {
      league: {
        select: {
          id: true
        }
      }
    }
  });

  // If user has exactly one league, redirect immediately
  if (userLeagues.length === 1) {
    redirect(`/app/league/${userLeagues[0].league.id}`);
  }

  // Otherwise, render the client component for league selection
  return <AppHomeClient />;
}