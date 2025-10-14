import { db } from './db';
import { getPhaseEndTime } from './phaseCalculations';
import { sendNotificationToUser, createNotificationData } from './pushNotifications';

/**
 * Send targeted notifications to users who haven't completed required actions
 * Similar to the function in promptQueue.ts but designed for specific user IDs
 */
async function sendTargetedNotificationToUsers(
  leagueId: string,
  userIds: string[],
  notificationData: any
) {
  const results = await Promise.allSettled(
    userIds.map(userId => sendNotificationToUser(userId, notificationData))
  );

  let totalSent = 0;
  let totalFailed = 0;

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      totalSent += result.value.sent;
      totalFailed += result.value.failed;
    }
  });

  return { totalSent, totalFailed };
}

/**
 * Send 2-hour warning notifications for phases ending at 7 PM UTC today
 * This runs daily at 5 PM UTC (2 hours before the main cron at 7 PM)
 *
 * Only sends to users who haven't completed the required action
 */
export async function send2HourWarningNotifications() {
  console.log('📢 Checking for 2-hour warning notifications...');

  try {
    // Calculate the expected phase end time (today at 7 PM UTC)
    const now = new Date();
    const todayAt7PM = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      19, // 7 PM UTC
      0,
      0,
      0
    ));

    // Get all ACTIVE prompts that haven't sent 2-hour warnings yet
    const activePrompts = await db.prompt.findMany({
      where: {
        status: 'ACTIVE',
        submission2HourWarningNotificationSent: false,
      },
      include: {
        league: true,
      },
    });

    // Get all VOTING prompts that haven't sent 2-hour warnings yet
    const votingPrompts = await db.prompt.findMany({
      where: {
        status: 'VOTING',
        voting2HourWarningNotificationSent: false,
      },
      include: {
        league: true,
      },
    });

    // Check ACTIVE prompts for submission deadline warnings
    for (const prompt of activePrompts) {
      const leagueSettings = {
        submissionDays: prompt.league.submissionDays,
        votingDays: prompt.league.votingDays,
        votesPerPlayer: prompt.league.votesPerPlayer,
      };

      // Calculate when this phase will end
      const phaseEndTime = getPhaseEndTime(prompt, leagueSettings);

      if (!phaseEndTime) {
        console.log(`⚠️ Could not calculate phase end time for prompt "${prompt.text}"`);
        continue;
      }

      // Check if phase ends today at 7 PM UTC (within a small window for reliability)
      const timeDiff = Math.abs(phaseEndTime.getTime() - todayAt7PM.getTime());
      const isEndingToday = timeDiff < 60 * 60 * 1000; // Within 1 hour window

      if (isEndingToday) {
        console.log(`⚠️ Sending 2h submission warning for: "${prompt.text}" (ends at ${phaseEndTime.toISOString()})`);

        try {
          // Get league members who haven't submitted yet
          const leagueMembers = await db.leagueMembership.findMany({
            where: {
              leagueId: prompt.leagueId,
              isActive: true,
            },
            include: {
              user: true,
            },
          });

          // Find users who haven't submitted to this prompt
          const usersWhoSubmitted = await db.response.findMany({
            where: {
              promptId: prompt.id,
            },
            select: {
              userId: true,
            },
          });

          const submittedUserIds = new Set(usersWhoSubmitted.map(r => r.userId));
          const usersWhoNeedToSubmit = leagueMembers
            .filter(member => !submittedUserIds.has(member.userId))
            .map(member => member.userId);

          if (usersWhoNeedToSubmit.length > 0) {
            const notificationData = createNotificationData('submission-deadline-2h', {
              promptText: prompt.text,
              leagueName: prompt.league.name,
              leagueId: prompt.leagueId,
            });

            await sendTargetedNotificationToUsers(prompt.leagueId, usersWhoNeedToSubmit, notificationData);
            console.log(`📱 Sent 2h submission warning to ${usersWhoNeedToSubmit.length} users who haven't submitted for: "${prompt.text}"`);
          } else {
            console.log(`ℹ️ All users have already submitted for: "${prompt.text}" - no notifications sent`);
          }

          // Mark warning as sent
          await db.prompt.update({
            where: { id: prompt.id },
            data: { submission2HourWarningNotificationSent: true },
          });

        } catch (notificationError) {
          console.error(`❌ Failed to send 2h submission warning for "${prompt.text}":`, notificationError);
        }
      } else {
        console.log(`⏭️ Skipping 2h submission warning for "${prompt.text}" - not ending today at 7 PM UTC`);
      }
    }

    // Check VOTING prompts for voting deadline warnings
    for (const prompt of votingPrompts) {
      const leagueSettings = {
        submissionDays: prompt.league.submissionDays,
        votingDays: prompt.league.votingDays,
        votesPerPlayer: prompt.league.votesPerPlayer,
      };

      // Calculate when this phase will end
      const phaseEndTime = getPhaseEndTime(prompt, leagueSettings);

      if (!phaseEndTime) {
        console.log(`⚠️ Could not calculate phase end time for prompt "${prompt.text}"`);
        continue;
      }

      // Check if phase ends today at 7 PM UTC (within a small window for reliability)
      const timeDiff = Math.abs(phaseEndTime.getTime() - todayAt7PM.getTime());
      const isEndingToday = timeDiff < 60 * 60 * 1000; // Within 1 hour window

      if (isEndingToday) {
        console.log(`⚠️ Sending 2h voting warning for: "${prompt.text}" (ends at ${phaseEndTime.toISOString()})`);

        try {
          // Get league members who haven't completed their voting yet
          const leagueMembers = await db.leagueMembership.findMany({
            where: {
              leagueId: prompt.leagueId,
              isActive: true,
            },
            include: {
              user: true,
            },
          });

          // Find users who haven't used all their votes for this prompt
          const maxVotesPerUser = prompt.league.votesPerPlayer;
          const userVoteCounts = await db.vote.groupBy({
            by: ['voterId'],
            where: {
              response: {
                promptId: prompt.id,
              },
            },
            _count: {
              id: true,
            },
          });

          const userVoteMap = new Map(userVoteCounts.map(v => [v.voterId, v._count.id]));
          const usersWhoNeedToVote = leagueMembers
            .filter(member => {
              const votesUsed = userVoteMap.get(member.userId) || 0;
              return votesUsed < maxVotesPerUser;
            })
            .map(member => member.userId);

          if (usersWhoNeedToVote.length > 0) {
            const notificationData = createNotificationData('voting-deadline-2h', {
              promptText: prompt.text,
              leagueName: prompt.league.name,
              leagueId: prompt.leagueId,
            });

            await sendTargetedNotificationToUsers(prompt.leagueId, usersWhoNeedToVote, notificationData);
            console.log(`📱 Sent 2h voting warning to ${usersWhoNeedToVote.length} users who haven't completed voting for: "${prompt.text}"`);
          } else {
            console.log(`ℹ️ All users have completed their voting for: "${prompt.text}" - no notifications sent`);
          }

          // Mark warning as sent
          await db.prompt.update({
            where: { id: prompt.id },
            data: { voting2HourWarningNotificationSent: true },
          });

        } catch (notificationError) {
          console.error(`❌ Failed to send 2h voting warning for "${prompt.text}":`, notificationError);
        }
      } else {
        console.log(`⏭️ Skipping 2h voting warning for "${prompt.text}" - not ending today at 7 PM UTC`);
      }
    }

    console.log('✅ 2-hour warning notifications check completed');
    return { success: true };
  } catch (error) {
    console.error('❌ Error checking 2-hour warning notifications:', error);
    return { success: false, error };
  }
}
