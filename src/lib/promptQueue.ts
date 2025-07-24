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

export async function processPromptQueue() {
  const now = new Date();
  
  try {
    console.log('🔄 Processing prompt queue...');

    // Complete any active prompts that have ended
    const activePrompts = await db.prompt.findMany({
      where: {
        status: 'ACTIVE',
        weekEnd: { lt: now },
      },
    });

    for (const prompt of activePrompts) {
      // Mark responses as published
      const publishedCount = await db.response.updateMany({
        where: { promptId: prompt.id },
        data: { 
          isPublished: true,
          publishedAt: now,
        },
      });

      // Mark prompt as completed
      await db.prompt.update({
        where: { id: prompt.id },
        data: { status: 'COMPLETED' },
      });

      console.log(`✅ Completed prompt: "${prompt.text}" (${publishedCount.count} responses published)`);
    }

    // Check if we need to activate the next prompt
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
        // Calculate dates for this prompt
        const { weekStart, weekEnd } = getWeeklyPromptDates(now);
        
        // Activate the prompt with current dates
        await db.prompt.update({
          where: { id: nextPrompt.id },
          data: {
            status: 'ACTIVE',
            weekStart,
            weekEnd,
          },
        });

        console.log(`🚀 Activated next prompt: "${nextPrompt.text}"`);
        console.log(`   Submission window: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`);
      } else {
        console.log('⚠️ No scheduled prompts available');
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
      { status: 'desc' }, // SCHEDULED first, then ACTIVE, then COMPLETED
      { queueOrder: 'asc' },
    ],
  });

  return {
    active: prompts.filter(p => p.status === 'ACTIVE'),
    scheduled: prompts.filter(p => p.status === 'SCHEDULED'),
    completed: prompts.filter(p => p.status === 'COMPLETED'),
  };
}