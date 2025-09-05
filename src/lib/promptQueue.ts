import { db } from './db';
import { isPhaseExpired, getNextPhase } from './phaseCalculations';
import { del } from '@vercel/blob';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { sendNotificationToLeague, createNotificationData } from './pushNotifications';

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

    // Calculate vote counts and points for each response
    for (const response of responses) {
      const totalVotes = response.votes.length;
      const totalPoints = response.votes.reduce((sum, vote) => sum + vote.points, 0);

      await db.response.update({
        where: { id: response.id },
        data: { totalVotes, totalPoints }
      });
    }

    // Calculate final rankings
    const responsesByPoints = await db.response.findMany({
      where: { promptId },
      orderBy: [
        { totalPoints: 'desc' },
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

export async function processPromptQueue() {
  const now = new Date();
  
  try {
    console.log('🔄 Processing 2-phase prompt queue...');

    // Step 1: Move ACTIVE prompts to VOTING when submission window ends
    const activePrompts = await db.prompt.findMany({
      where: {
        status: 'ACTIVE',
      },
    });

    for (const prompt of activePrompts) {
      // Check if the active phase has expired
      if (isPhaseExpired(prompt)) {
        // Mark responses as published and move to voting phase
        const publishedCount = await db.response.updateMany({
          where: { promptId: prompt.id },
          data: { 
            isPublished: true,
            publishedAt: now,
          },
        });

        await db.prompt.update({
          where: { id: prompt.id },
          data: { 
            status: 'VOTING',
            phaseStartedAt: now, // Update phase start time for voting phase
          },
        });

        console.log(`🗳️ Started voting for: "${prompt.text}" (${publishedCount.count} responses published)`);

        // Send notification to league members that voting is now available
        try {
          const notificationData = createNotificationData('voting-available', {
            promptText: prompt.text,
            leagueName: 'Your League' // TODO: Get actual league name
          });
          
          await sendNotificationToLeague(prompt.leagueId, notificationData);
          console.log(`📱 Sent voting notification for prompt: "${prompt.text}"`);
        } catch (notificationError) {
          console.error('❌ Failed to send voting notification:', notificationError);
        }
      }
    }

    // Step 2: Complete VOTING prompts when voting window ends
    const votingPrompts = await db.prompt.findMany({
      where: {
        status: 'VOTING',
      },
    });

    for (const prompt of votingPrompts) {
      // Check if the voting phase has expired
      if (isPhaseExpired(prompt)) {
        // Calculate final results
        await calculateVoteResults(prompt.id);

        // Mark prompt as completed (no need to update phaseStartedAt for completed)
        await db.prompt.update({
          where: { id: prompt.id },
          data: { status: 'COMPLETED' },
        });

        console.log(`🏆 Completed voting for: "${prompt.text}"`);
      }
    }

    // Step 3: For each league, activate next prompt if no active prompt exists
    const leagues = await db.league.findMany({
      where: { 
        isActive: true,
        isStarted: true // Only process leagues that have been started by their owners
      },
      select: { id: true },
    });

    for (const league of leagues) {
      const currentActivePrompt = await db.prompt.findFirst({
        where: { 
          status: 'ACTIVE',
          leagueId: league.id,
        },
      });

      if (!currentActivePrompt) {
        // Find the next scheduled prompt for this league
        const nextPrompt = await db.prompt.findFirst({
          where: { 
            status: 'SCHEDULED',
            leagueId: league.id,
          },
          orderBy: { queueOrder: 'asc' },
        });

        if (nextPrompt) {
          // Activate the prompt with current timestamp
          await db.prompt.update({
            where: { id: nextPrompt.id },
            data: {
              status: 'ACTIVE',
              phaseStartedAt: now,
            },
          });

          console.log(`🚀 Activated next task for league ${league.id}: "${nextPrompt.text}"`);
          console.log(`   Phase started at: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`);

          // Send notification to league members about the new prompt
          try {
            const notificationData = createNotificationData('new-prompt-available', {
              promptText: nextPrompt.text,
              leagueName: 'Your League' // TODO: Get actual league name
            });
            
            await sendNotificationToLeague(league.id, notificationData);
            console.log(`📱 Sent new prompt notification: "${nextPrompt.text}"`);
          } catch (notificationError) {
            console.error('❌ Failed to send new prompt notification:', notificationError);
          }
        }
      }
    }

    // Run photo cleanup periodically
    await cleanupOldPhotos();

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
  const now = new Date();
  
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
            phaseStartedAt: now,
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
          publishedAt: now,
        },
      });

      await db.prompt.update({
        where: { id: currentPrompt.id },
        data: { 
          status: 'VOTING',
          phaseStartedAt: now,
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
        data: { status: 'COMPLETED' },
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
            phaseStartedAt: now,
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