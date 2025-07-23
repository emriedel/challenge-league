import { db } from './db';
import { getWeeklyPromptDates } from './weeklyPrompts';

export async function processPromptQueue() {
  const now = new Date();
  
  try {
    // Complete any active prompts that have ended
    const activePrompts = await db.prompt.findMany({
      where: {
        status: 'ACTIVE',
        weekEnd: { lt: now },
      },
    });

    for (const prompt of activePrompts) {
      // Mark responses as published
      await db.response.updateMany({
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

      console.log(`✅ Completed prompt: "${prompt.text}"`);
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
      } else {
        console.log('⚠️ No scheduled prompts available');
      }
    }

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