import { db } from './db';
import { sendEmail, generateToken } from './email';
import { ChallengeStartedEmail } from '@/emails/ChallengeStarted';

/**
 * Send email notifications to league members when a new challenge starts
 */
export async function sendChallengeStartedEmails(
  leagueId: string,
  promptText: string,
  leagueName: string
) {
  try {
    console.log(`📧 Sending challenge started emails for league: ${leagueName}`);

    // Get all active league members with email preferences
    const leagueMembers = await db.leagueMembership.findMany({
      where: {
        leagueId,
        isActive: true,
      },
      include: {
        user: {
          include: {
            emailPreferences: true,
          },
        },
      },
    });

    if (leagueMembers.length === 0) {
      console.log(`ℹ️ No league members found for league: ${leagueName}`);
      return { sent: 0, failed: 0 };
    }

    // Get the prompt to calculate deadline
    const prompt = await db.prompt.findFirst({
      where: {
        leagueId,
        text: promptText,
        status: 'ACTIVE',
      },
      include: {
        league: true,
      },
    });

    if (!prompt || !prompt.phaseStartedAt) {
      console.error(`❌ Could not find active prompt for challenge notification`);
      return { sent: 0, failed: 0 };
    }

    // Get the most recent completed challenge to show top 3 results
    const previousChallenge = await db.prompt.findFirst({
      where: {
        leagueId,
        status: 'COMPLETED',
      },
      orderBy: {
        completedAt: 'desc',
      },
      include: {
        responses: {
          where: {
            finalRank: {
              in: [1, 2, 3], // Get top 3 finishers
            },
          },
          orderBy: {
            finalRank: 'asc',
          },
          include: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    // Count total completed challenges to determine challenge number
    let challengeNumber = 0;
    if (previousChallenge && previousChallenge.completedAt) {
      challengeNumber = await db.prompt.count({
        where: {
          leagueId,
          status: 'COMPLETED',
          completedAt: {
            lte: previousChallenge.completedAt,
          },
        },
      });
    }

    // Format previous challenge data if available
    let previousChallengeData:
      | {
          text: string;
          challengeNumber: number;
          topSubmissions: Array<{
            rank: number;
            username: string;
            caption: string;
            imageUrl: string;
            votes: number;
          }>;
        }
      | undefined;

    if (previousChallenge && previousChallenge.responses.length > 0) {
      previousChallengeData = {
        text: previousChallenge.text,
        challengeNumber,
        topSubmissions: previousChallenge.responses.map((response) => ({
          rank: response.finalRank!,
          username: response.user.username,
          caption: response.caption,
          imageUrl: response.imageUrl,
          votes: response.totalVotes,
        })),
      };
    }

    // Calculate submission deadline
    const deadline = new Date(prompt.phaseStartedAt);
    deadline.setDate(deadline.getDate() + prompt.league.submissionDays);
    const submissionDeadline = deadline.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });

    // Challenge URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://challenge-league.app';
    const challengeUrl = `${appUrl}/app/league/${leagueId}`;

    let sent = 0;
    let failed = 0;

    // Send emails to members who have opted in
    for (const member of leagueMembers) {
      try {
        // Check if user has opted in for challenge started notifications
        // Default to true if no preferences set
        const shouldSendEmail =
          !member.user.emailPreferences ||
          member.user.emailPreferences.challengeStarted;

        if (!shouldSendEmail) {
          console.log(`⏭️ User ${member.user.username} has opted out of challenge notifications`);
          continue;
        }

        // Generate unsubscribe token if user doesn't have one
        let unsubscribeToken = member.user.unsubscribeToken;
        if (!unsubscribeToken) {
          unsubscribeToken = generateToken();
          await db.user.update({
            where: { id: member.user.id },
            data: { unsubscribeToken },
          });
        }

        // Only send to verified emails (or all emails if verification not implemented yet)
        // For now, we'll send to all users since verification is optional
        await sendEmail({
          to: member.user.email,
          subject: `🏆 New Challenge in ${leagueName}`,
          react: ChallengeStartedEmail({
            username: member.user.username,
            leagueName,
            challengeText: promptText,
            challengeUrl,
            submissionDeadline,
            appUrl,
            unsubscribeToken,
            previousChallenge: previousChallengeData,
          }),
        });

        sent++;
        console.log(`✅ Sent challenge email to ${member.user.username}`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed to send email to ${member.user.username}:`, error);
      }
    }

    console.log(`📧 Email summary: ${sent} sent, ${failed} failed (${leagueMembers.length} total members)`);
    return { sent, failed };
  } catch (error) {
    console.error('❌ Error sending challenge started emails:', error);
    return { sent: 0, failed: 0 };
  }
}
