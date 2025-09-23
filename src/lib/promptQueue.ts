import { db } from './db';
import { isPhaseExpired, getNextPhase, willPhaseExpireInNextCronRun, getPhaseEndTime } from './phaseCalculations';
import { del } from '@vercel/blob';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { sendNotificationToLeague, sendNotificationToUser, createNotificationData } from './pushNotifications';

async function cleanupOldPhotos() {
  try {
    // Find prompts that were completed more than 1 week ago (past cleanup threshold)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // 1 week ago

    const oldPrompts = await db.prompt.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: { lt: cutoffDate }, // Use updatedAt as proxy for completion time
      },
      include: {
        responses: true,
      },
    });

    let cleanedCount = 0;

    for (const prompt of oldPrompts) {
      for (const response of prompt.responses) {
        try {
          if (response.imageUrl.startsWith('/uploads/')) {
            // Local development file
            const filename = response.imageUrl.replace('/uploads/', '');
            const filepath = join(process.cwd(), 'public', 'uploads', filename);
            
            try {
              await unlink(filepath);
              console.log(`🗑️ Deleted local file: ${filename}`);
            } catch (err) {
              // File might already be deleted, continue
              console.log(`⚠️ Could not delete local file: ${filename}`);
            }
          } else if (response.imageUrl.includes('blob.vercel-storage.com')) {
            // Vercel Blob file
            try {
              await del(response.imageUrl);
              console.log(`🗑️ Deleted blob file: ${response.imageUrl}`);
            } catch (err) {
              console.log(`⚠️ Could not delete blob file: ${response.imageUrl}`);
            }
          }
          cleanedCount++;
        } catch (error) {
          console.error(`❌ Error cleaning photo for response ${response.id}:`, error);
        }
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old photos`);
    }

    return { success: true, cleanedCount };
  } catch (error) {
    console.error('❌ Error during photo cleanup:', error);
    return { success: false, error };
  }
}

async function calculateVoteResults(promptId: string) {
  try {
    console.log(`🗳️ Calculating vote results for prompt ${promptId}...`);

    // Get all responses for this prompt
    const responses = await db.response.findMany({
      where: { 
        promptId,
        isPublished: true 
      },
      include: {
        votes: true
      }
    });

    // Calculate vote counts for each response
    for (const response of responses) {
      const totalVotes = response.votes.length;

      await db.response.update({
        where: { id: response.id },
        data: { totalVotes }
      });
    }

    // Calculate final rankings
    const responsesByPoints = await db.response.findMany({
      where: { promptId },
      orderBy: [
        { totalVotes: 'desc' },
        { submittedAt: 'asc' }, // Tiebreaker: earlier submission wins
      ],
    });

    for (let i = 0; i < responsesByPoints.length; i++) {
      await db.response.update({
        where: { id: responsesByPoints[i].id },
        data: { finalRank: i + 1 },
      });
    }

    console.log(`🏅 Calculated rankings for ${responsesByPoints.length} responses`);
    return { success: true, responseCount: responsesByPoints.length };
  } catch (error) {
    console.error('❌ Error calculating vote results:', error);
    return { success: false, error };
  }
}

/**
 * Send targeted notifications to users who haven't completed required actions
 */
async function sendTargetedNotificationToUsers(
  leagueId: string,
  userIds: string[],
  notificationData: any
) {
  if (userIds.length === 0) {
    console.log('No users need to be notified');
    return;
  }

  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    try {
      const result = await sendNotificationToUser(userId, notificationData);
      totalSent += result.sent;
      totalFailed += result.failed;
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
      totalFailed++;
    }
  }

  console.log(`📱 Targeted notification summary: ${totalSent} sent, ${totalFailed} failed to ${userIds.length} users`);
}

/**
 * Send 24-hour warning notifications for phases that will expire in the next cron run
 * Only sends to users who haven't completed the required action
 * Skips warnings for phases that are 1 day or less to avoid duplicate notifications
 */
async function send24HourWarningNotifications() {
  console.log('📢 Checking for 24-hour warning notifications...');

  try {
    // Get all ACTIVE and VOTING prompts that haven't already sent warnings
    const activePrompts = await db.prompt.findMany({
      where: {
        status: 'ACTIVE',
        submissionWarningNotificationSent: false,
      },
      include: {
        league: true,
      },
    });

    const votingPrompts = await db.prompt.findMany({
      where: {
        status: 'VOTING',
        votingWarningNotificationSent: false,
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

      // Skip 24-hour warnings for 1-day rounds to avoid duplicate notifications
      if (leagueSettings.submissionDays <= 1) {
        console.log(`⏭️ Skipping 24h submission warning for 1-day round: "${prompt.text}"`);
        // Mark as sent to prevent repeated checking
        await db.prompt.update({
          where: { id: prompt.id },
          data: { submissionWarningNotificationSent: true },
        });
        continue;
      }

      // Add debugging information for 24-hour warning logic
      const phaseEndTime = getPhaseEndTime(prompt, leagueSettings);
      const nextCronTime = new Date();
      nextCronTime.setUTCDate(nextCronTime.getUTCDate() + 1);
      nextCronTime.setUTCHours(19, 0, 0, 0); // Next cron at 7 PM UTC

      const willExpire = willPhaseExpireInNextCronRun(prompt, leagueSettings);
      const isAlreadyExpired = isPhaseExpired(prompt, leagueSettings);
      console.log(`🔍 24h warning check for "${prompt.text}": Phase ends ${phaseEndTime?.toISOString()}, Next cron ${nextCronTime.toISOString()}, Will expire: ${willExpire}, Already expired: ${isAlreadyExpired}`);

      if (willExpire && !isAlreadyExpired) {
        console.log(`⚠️ Sending 24h submission warning for: "${prompt.text}"`);

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
            const notificationData = createNotificationData('submission-deadline-24h', {
              promptText: prompt.text,
              leagueName: prompt.league.name,
              leagueId: prompt.leagueId,
            });
            
            await sendTargetedNotificationToUsers(prompt.leagueId, usersWhoNeedToSubmit, notificationData);
            console.log(`📱 Sent submission deadline warning to ${usersWhoNeedToSubmit.length} users who haven't submitted for: "${prompt.text}"`);
          } else {
            console.log(`ℹ️ All users have already submitted for: "${prompt.text}" - no notifications sent`);
          }
          
          // Mark warning as sent regardless (to prevent repeated processing)
          await db.prompt.update({
            where: { id: prompt.id },
            data: { submissionWarningNotificationSent: true },
          });
          
        } catch (notificationError) {
          console.error(`❌ Failed to send submission warning for "${prompt.text}":`, notificationError);
        }
      } else if (willExpire && isAlreadyExpired) {
        console.log(`⏭️ Skipping 24h submission warning for "${prompt.text}" - phase already expired, will be transitioned later in this cron run`);
        // Mark warning as sent to prevent repeated checking
        await db.prompt.update({
          where: { id: prompt.id },
          data: { submissionWarningNotificationSent: true },
        });
      }
    }

    // Check VOTING prompts for voting deadline warnings
    for (const prompt of votingPrompts) {
      const leagueSettings = {
        submissionDays: prompt.league.submissionDays,
        votingDays: prompt.league.votingDays,
        votesPerPlayer: prompt.league.votesPerPlayer,
      };

      // Skip 24-hour warnings for 1-day rounds to avoid duplicate notifications
      if (leagueSettings.votingDays <= 1) {
        console.log(`⏭️ Skipping 24h voting warning for 1-day round: "${prompt.text}"`);
        // Mark as sent to prevent repeated checking
        await db.prompt.update({
          where: { id: prompt.id },
          data: { votingWarningNotificationSent: true },
        });
        continue;
      }

      // Add debugging information for 24-hour warning logic
      const phaseEndTime = getPhaseEndTime(prompt, leagueSettings);
      const nextCronTime = new Date();
      nextCronTime.setUTCDate(nextCronTime.getUTCDate() + 1);
      nextCronTime.setUTCHours(19, 0, 0, 0); // Next cron at 7 PM UTC

      const willExpire = willPhaseExpireInNextCronRun(prompt, leagueSettings);
      const isAlreadyExpired = isPhaseExpired(prompt, leagueSettings);
      console.log(`🔍 24h voting warning check for "${prompt.text}": Phase ends ${phaseEndTime?.toISOString()}, Next cron ${nextCronTime.toISOString()}, Will expire: ${willExpire}, Already expired: ${isAlreadyExpired}`);

      if (willExpire && !isAlreadyExpired) {
        console.log(`⚠️ Sending 24h voting warning for: "${prompt.text}"`);

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
            const notificationData = createNotificationData('voting-deadline-24h', {
              promptText: prompt.text,
              leagueName: prompt.league.name,
              leagueId: prompt.leagueId,
            });
            
            await sendTargetedNotificationToUsers(prompt.leagueId, usersWhoNeedToVote, notificationData);
            console.log(`📱 Sent voting deadline warning to ${usersWhoNeedToVote.length} users who haven't completed voting for: "${prompt.text}"`);
          } else {
            console.log(`ℹ️ All users have completed their voting for: "${prompt.text}" - no notifications sent`);
          }
          
          // Mark warning as sent regardless (to prevent repeated processing)
          await db.prompt.update({
            where: { id: prompt.id },
            data: { votingWarningNotificationSent: true },
          });
          
        } catch (notificationError) {
          console.error(`❌ Failed to send voting warning for "${prompt.text}":`, notificationError);
        }
      } else if (willExpire && isAlreadyExpired) {
        console.log(`⏭️ Skipping 24h voting warning for "${prompt.text}" - phase already expired, will be transitioned later in this cron run`);
        // Mark warning as sent to prevent repeated checking
        await db.prompt.update({
          where: { id: prompt.id },
          data: { votingWarningNotificationSent: true },
        });
      }
    }
    
    console.log('✅ 24-hour warning notifications check completed');
  } catch (error) {
    console.error('❌ Error checking 24-hour warning notifications:', error);
  }
}

export async function processPromptQueue() {
  // Always normalize to exact cron hour (7 PM UTC = 11 AM PT / 12 PM PDT)
  const now = new Date();
  const normalizedNow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    19, // 19:00 UTC = cron execution time
    0,
    0,
    0
  ));
  
  try {
    console.log('🔄 Processing 2-phase prompt queue...');

    // Step 0: Send 24-hour warning notifications before phase transitions
    await send24HourWarningNotifications();

    // Process each league individually to ensure proper state management
    const leagues = await db.league.findMany({
      where: { 
        isActive: true,
        isStarted: true // Only process leagues that have been started by their owners
      },
      include: { 
        prompts: {
          where: {
            status: { in: ['ACTIVE', 'VOTING', 'SCHEDULED'] }
          },
          orderBy: { queueOrder: 'asc' }
        }
      },
    });

    console.log(`🏟️ Processing ${leagues.length} active started leagues...`);

    for (const league of leagues) {
      console.log(`\n🔍 Processing league: ${league.name} (${league.id})`);
      
      const leagueSettings = {
        submissionDays: league.submissionDays,
        votingDays: league.votingDays,
        votesPerPlayer: league.votesPerPlayer,
      };

      // Get prompts from preloaded data
      const activePrompt = league.prompts.find(p => p.status === 'ACTIVE');
      const votingPrompt = league.prompts.find(p => p.status === 'VOTING');
      const nextScheduledPrompt = league.prompts.find(p => p.status === 'SCHEDULED');

      console.log(`   📊 League status: ACTIVE=${activePrompt ? '✓' : '✗'}, VOTING=${votingPrompt ? '✓' : '✗'}, SCHEDULED=${nextScheduledPrompt ? '✓' : '✗'}`);

      // Step 1: Check for ACTIVE prompts and expire if needed
      if (activePrompt) {
        const phaseEndTime = getPhaseEndTime(activePrompt, leagueSettings);
        const isExpired = isPhaseExpired(activePrompt, leagueSettings);
        
        console.log(`   📋 ACTIVE prompt: "${activePrompt.text}"`);
        console.log(`      Started: ${activePrompt.phaseStartedAt?.toISOString()}`);
        console.log(`      Should end: ${phaseEndTime?.toISOString()}`);
        console.log(`      Submission days: ${leagueSettings.submissionDays}, Is expired: ${isExpired}`);
        
        if (isExpired) {
          console.log(`   ⏰ ACTIVE prompt expired, transitioning to VOTING...`);
          
          // Mark responses as published and move to voting phase
          const publishedCount = await db.response.updateMany({
            where: { promptId: activePrompt.id },
            data: {
              isPublished: true,
              publishedAt: normalizedNow,
            },
          });

          await db.prompt.update({
            where: { id: activePrompt.id },
            data: {
              status: 'VOTING',
              phaseStartedAt: normalizedNow, // Update phase start time for voting phase
              submissionEndedAt: normalizedNow, // Record when submission phase actually ended
            },
          });

          console.log(`   🗳️ Started voting for: "${activePrompt.text}" (${publishedCount.count} responses published)`);

          // Send notification to league members that voting is now available
          try {
            const notificationData = createNotificationData('voting-available', {
              promptText: activePrompt.text,
              leagueName: league.name,
              leagueId: league.id
            });
            
            await sendNotificationToLeague(league.id, notificationData);
            console.log(`   📱 Sent voting notification for prompt: "${activePrompt.text}"`);
          } catch (notificationError) {
            console.error(`   ❌ Failed to send voting notification: ${notificationError}`);
          }
        } else {
          console.log(`   ✅ ACTIVE prompt still valid, continuing...`);
        }
        
        // If there's an active prompt (expired or not), skip to next league
        // We don't want to process VOTING prompts while ACTIVE exists
        continue;
      }

      // Step 2: Check for VOTING prompts and expire if needed, then activate next
      if (votingPrompt) {
        const phaseEndTime = getPhaseEndTime(votingPrompt, leagueSettings);
        const isExpired = isPhaseExpired(votingPrompt, leagueSettings);
        
        console.log(`   🗳️ VOTING prompt: "${votingPrompt.text}"`);
        console.log(`      Started: ${votingPrompt.phaseStartedAt?.toISOString()}`);
        console.log(`      Should end: ${phaseEndTime?.toISOString()}`);
        console.log(`      Voting days: ${leagueSettings.votingDays}, Is expired: ${isExpired}`);
        
        if (isExpired) {
          console.log(`   ⏰ VOTING prompt expired, completing and activating next...`);
          
          // Calculate final results
          await calculateVoteResults(votingPrompt.id);

          // Mark prompt as completed
          await db.prompt.update({
            where: { id: votingPrompt.id },
            data: {
              status: 'COMPLETED',
              votingEndedAt: normalizedNow, // Record when voting phase actually ended
              completedAt: normalizedNow,   // Record when challenge was completed
            },
          });

          console.log(`   🏆 Completed voting for: "${votingPrompt.text}"`);

          // Now activate the next prompt (fall through to Step 3)
        } else {
          console.log(`   ✅ VOTING prompt still valid, continuing...`);
          // If voting is still active, skip to next league
          continue;
        }
      }

      // Step 3: If no ACTIVE or VOTING prompts (or voting just expired), activate next scheduled prompt
      console.log(`   🔍 Looking for next scheduled prompt to activate...`);
      
      if (nextScheduledPrompt) {
        console.log(`   ✅ Found next scheduled prompt: "${nextScheduledPrompt.text}"`);
        console.log(`   🚀 Activating prompt (ID: ${nextScheduledPrompt.id})...`);
        
        try {
          // Activate the prompt with normalized timestamp
          await db.prompt.update({
            where: { id: nextScheduledPrompt.id },
            data: {
              status: 'ACTIVE',
              phaseStartedAt: normalizedNow,
            },
          });

          console.log(`   🎉 Successfully activated: "${nextScheduledPrompt.text}"`);
          console.log(`      Phase started at: ${normalizedNow.toISOString()}`);

          // Send notification to league members about the new prompt
          try {
            const notificationData = createNotificationData('new-prompt-available', {
              promptText: nextScheduledPrompt.text,
              leagueName: league.name,
              leagueId: league.id
            });
            
            await sendNotificationToLeague(league.id, notificationData);
            console.log(`   📱 Sent new prompt notification: "${nextScheduledPrompt.text}"`);
          } catch (notificationError) {
            console.error(`   ❌ Failed to send new prompt notification: ${notificationError}`);
          }
        } catch (updateError) {
          console.error(`   ❌ Failed to activate prompt "${nextScheduledPrompt.text}":`);
          console.error(`      Error: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`);
          console.error(`      This should not happen with the new logic!`);
          
          // Log current database state for debugging - this indicates a bug in our logic
          console.error(`      🔍 Current league prompt states:`);
          league.prompts.forEach(p => {
            console.error(`        - ${p.status}: "${p.text}" (ID: ${p.id}, Started: ${p.phaseStartedAt?.toISOString()})`);
          });
          
          throw updateError; // Re-throw to maintain error handling flow
        }
      } else {
        console.log(`   ℹ️ No scheduled prompts available for activation`);
      }
    }

    // Run photo cleanup periodically
    await cleanupOldPhotos();

    const endTime = new Date();
    const processingTime = endTime.getTime() - now.getTime();
    console.log(`\n✅ Prompt queue processing completed in ${processingTime}ms`);
    console.log(`📊 Summary:`);
    console.log(`   - Leagues processed: ${leagues.length}`);
    console.log(`   - Processing completed at: ${endTime.toISOString()}`);
    console.log(`   - All phase timestamps normalized to: ${normalizedNow.toISOString()}`);

    return { success: true };
  } catch (error) {
    console.error('❌ Error processing prompt queue:', error);
    return { success: false, error };
  }
}

export async function reorderPrompts(promptIds: string[]) {
  try {
    // Update queue order for each prompt
    for (let i = 0; i < promptIds.length; i++) {
      await db.prompt.update({
        where: { id: promptIds[i] },
        data: { queueOrder: i + 2 }, // Start from 2 (after current active prompt)
      });
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error reordering prompts:', error);
    return { success: false, error };
  }
}

export async function getPromptQueue() {
  const prompts = await db.prompt.findMany({
    orderBy: [
      { status: 'desc' }, // SCHEDULED first, then ACTIVE, then VOTING, then COMPLETED
      { queueOrder: 'asc' },
    ],
  });

  return {
    active: prompts.filter(p => p.status === 'ACTIVE'),
    voting: prompts.filter(p => p.status === 'VOTING'),
    scheduled: prompts.filter(p => p.status === 'SCHEDULED'),
    completed: prompts.filter(p => p.status === 'COMPLETED'),
  };
}

/**
 * Manually transition a prompt to the next phase (for admin use)
 * This bypasses the normal timing constraints
 */
export async function manualPhaseTransition(leagueId: string) {
  // Always normalize to exact cron hour for consistency
  const now = new Date();
  const normalizedNow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    19, // 19:00 UTC = cron execution time
    0,
    0,
    0
  ));
  
  try {
    console.log('⚡ Manual phase transition requested...');

    // Find the current active or voting prompt for this league
    const currentPrompt = await db.prompt.findFirst({
      where: {
        leagueId,
        status: { in: ['ACTIVE', 'VOTING'] }
      },
    });

    if (!currentPrompt) {
      // No active prompt, try to start the next scheduled one
      const nextPrompt = await db.prompt.findFirst({
        where: { 
          leagueId,
          status: 'SCHEDULED' 
        },
        orderBy: { queueOrder: 'asc' },
      });

      if (nextPrompt) {
        await db.prompt.update({
          where: { id: nextPrompt.id },
          data: {
            status: 'ACTIVE',
            phaseStartedAt: normalizedNow,
          },
        });

        console.log(`⚡ Manually activated: "${nextPrompt.text}"`);
        return { success: true, action: 'activated', prompt: nextPrompt.text };
      } else {
        return { success: false, error: 'No scheduled prompts available' };
      }
    }

    const nextPhase = getNextPhase(currentPrompt.status);
    if (!nextPhase) {
      return { success: false, error: 'Prompt is already completed' };
    }

    if (currentPrompt.status === 'ACTIVE') {
      // Transition from ACTIVE to VOTING
      const publishedCount = await db.response.updateMany({
        where: { promptId: currentPrompt.id },
        data: {
          isPublished: true,
          publishedAt: normalizedNow,
        },
      });

      await db.prompt.update({
        where: { id: currentPrompt.id },
        data: {
          status: 'VOTING',
          phaseStartedAt: normalizedNow,
          submissionEndedAt: normalizedNow, // Record when submission phase actually ended
        },
      });

      console.log(`⚡ Manually started voting for: "${currentPrompt.text}" (${publishedCount.count} responses published)`);
      return { success: true, action: 'started_voting', prompt: currentPrompt.text };
    }

    if (currentPrompt.status === 'VOTING') {
      // Transition from VOTING to COMPLETED
      await calculateVoteResults(currentPrompt.id);

      await db.prompt.update({
        where: { id: currentPrompt.id },
        data: {
          status: 'COMPLETED',
          votingEndedAt: normalizedNow, // Record when voting phase actually ended
          completedAt: normalizedNow,   // Record when challenge was completed
        },
      });

      console.log(`⚡ Manually completed voting for: "${currentPrompt.text}"`);
      
      // Also try to start the next prompt
      const nextPrompt = await db.prompt.findFirst({
        where: { 
          leagueId,
          status: 'SCHEDULED' 
        },
        orderBy: { queueOrder: 'asc' },
      });

      if (nextPrompt) {
        await db.prompt.update({
          where: { id: nextPrompt.id },
          data: {
            status: 'ACTIVE',
            phaseStartedAt: normalizedNow,
          },
        });

        console.log(`⚡ Manually activated next prompt: "${nextPrompt.text}"`);
        return {
          success: true,
          action: 'completed_and_started_next',
          completedPrompt: currentPrompt.text,
          newPrompt: nextPrompt.text
        };
      }

      return { success: true, action: 'completed', prompt: currentPrompt.text };
    }

    return { success: false, error: 'Unexpected prompt status' };
  } catch (error) {
    console.error('❌ Error during manual phase transition:', error);
    return { success: false, error: 'Failed to transition phase' };
  }
}