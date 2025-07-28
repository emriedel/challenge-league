import { db } from './db';
import { getWeeklyPromptDates } from './weeklyPrompts';
import { del } from '@vercel/blob';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

async function cleanupOldPhotos() {
  try {
    // Find prompts that were completed more than 1 week ago (past cleanup threshold)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // 1 week ago

    const oldPrompts = await db.prompt.findMany({
      where: {
        status: 'COMPLETED',
        weekEnd: { lt: cutoffDate },
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
    console.log('🔄 Processing 3-phase prompt queue...');

    // Phase 1: Move ACTIVE prompts to VOTING when submission window ends
    const activePrompts = await db.prompt.findMany({
      where: {
        status: 'ACTIVE',
        weekEnd: { lt: now },
      },
    });

    for (const prompt of activePrompts) {
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
        data: { status: 'VOTING' },
      });

      console.log(`🗳️ Started voting for: "${prompt.text}" (${publishedCount.count} responses published)`);
    }

    // Phase 2: Complete VOTING prompts when voting window ends
    const votingPrompts = await db.prompt.findMany({
      where: {
        status: 'VOTING',
        voteEnd: { lt: now },
      },
    });

    for (const prompt of votingPrompts) {
      // Calculate final results
      await calculateVoteResults(prompt.id);

      // Mark prompt as completed
      await db.prompt.update({
        where: { id: prompt.id },
        data: { status: 'COMPLETED' },
      });

      console.log(`🏆 Completed voting for: "${prompt.text}"`);
    }

    // Phase 3: Activate next prompt if no active prompt exists
    const currentActivePrompt = await db.prompt.findFirst({
      where: { status: 'ACTIVE' },
    });

    if (!currentActivePrompt) {
      // Find the next scheduled prompt
      const nextPrompt = await db.prompt.findFirst({
        where: { status: 'SCHEDULED' },
        orderBy: { queueOrder: 'asc' },
      });

      if (nextPrompt) {
        // Calculate dates for this prompt (3-phase system)
        const { weekStart, weekEnd } = getWeeklyPromptDates(now);
        const voteStart = new Date(weekEnd); // Voting starts when submissions close
        const voteEnd = new Date(voteStart);
        voteEnd.setDate(voteEnd.getDate() + 2); // Vote for 2 days (Sat-Mon)
        
        // Activate the prompt with current dates
        await db.prompt.update({
          where: { id: nextPrompt.id },
          data: {
            status: 'ACTIVE',
            weekStart,
            weekEnd,
            voteStart,
            voteEnd,
          },
        });

        console.log(`🚀 Activated next task: "${nextPrompt.text}"`);
        console.log(`   Submit: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`);
        console.log(`   Vote: ${voteStart.toLocaleDateString()} - ${voteEnd.toLocaleDateString()}`);
      } else {
        console.log('⚠️ No scheduled tasks available');
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