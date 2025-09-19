/**
 * Starter prompts for new leagues
 * These provide a good variety of creative challenges to get leagues started
 */

export const STARTER_PROMPTS: string[] = [
  "Take a photo that could be an album cover",
  "Find the strangest street name",
  "Cook the most beautiful meal for yourself",
  "Find the weirdest statue",
  "Find the most interesting grocery item from the store",
  "Take the most dramatic photo of something completely ordinary",
  "Take the most colorful photo",
  "Take the coolest photo that incorporates shadows",
  "Find the best plant",
  "Capture the essence of your morning routine",
  "Make the weirdest face",
  "Thrift something cool and show it off",
  "Recreate a famous movie poster",
  "Take the best photo involving a reflection",
  "Take a photo that will make everyone say 'NOPE'",
  "Take the photo that best encapsulates the fall season",
  "Take the most beautiful picture of a sunset",
];

/**
 * Get a random selection of starter prompts for a new league
 * Simply picks random prompts and shuffles them
 */
export function getStarterPrompts(count: number = 8): string[] {
  const shuffled = shuffleArray([...STARTER_PROMPTS]);
  return shuffled.slice(0, count);
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}