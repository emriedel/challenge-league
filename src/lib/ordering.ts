/**
 * Deterministic ordering utilities for user-specific randomization
 * 
 * This module provides functions to create deterministic but seemingly random
 * orderings that are consistent for each user but different between users.
 */

/**
 * Simple hash function to convert a string to a number
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Creates a seeded pseudo-random number generator
 * Uses a Linear Congruential Generator (LCG) for predictable randomness
 */
function createSeededRandom(seed: number) {
  let state = seed;
  return function() {
    // LCG parameters (same as used by glibc)
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Fisher-Yates shuffle with seeded randomness
 * This ensures the same seed always produces the same shuffled order
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const random = createSeededRandom(seed);
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Orders an array of items in a user-specific deterministic way
 * 
 * @param items - Array of items to order (must have 'id' property)
 * @param userId - User ID to use as part of the seed
 * @param contextId - Additional context (e.g., prompt ID) to ensure different orderings for different contexts
 * @returns Shuffled array with consistent ordering for this user + context combination
 */
export function getUserSpecificOrder<T extends { id: string }>(
  items: T[], 
  userId: string, 
  contextId: string = ''
): T[] {
  if (items.length <= 1) {
    return items;
  }
  
  // Create a deterministic seed based on user ID and context
  // This ensures the same user gets the same order for the same context,
  // but different users get different orders
  const seedString = `${userId}-${contextId}`;
  const seed = simpleHash(seedString);
  
  return seededShuffle(items, seed);
}

/**
 * Creates a consistent ordering for voting submissions
 * 
 * @param responses - Array of response objects to order
 * @param userId - Current user's ID
 * @param promptId - Current prompt ID to ensure different ordering per prompt
 * @returns Ordered responses for this user and prompt
 */
export function getVotingOrder<T extends { id: string }>(
  responses: T[], 
  userId: string, 
  promptId: string
): T[] {
  return getUserSpecificOrder(responses, userId, `voting-${promptId}`);
}