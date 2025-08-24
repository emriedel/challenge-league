/**
 * Starter prompts for new leagues
 * These provide a good variety of creative challenges to get leagues started
 */

export const STARTER_PROMPTS: string[] = [
  "Take a photo of your favorite snack or drink",
  "Capture an interesting shadow you find today",
  "Show us your workspace or creative corner", 
  "Take a photo of something that makes you happy",
  "Photograph your view right now (window, outdoors, etc.)",
  "Create a simple dish using only 5 ingredients and photograph it",
  "Take a photo that represents your mood today",
  "Create something artistic using only items from your kitchen",
  "Find and photograph an interesting texture or pattern",
  "Document a small adventure or exploration in your neighborhood",
  "Create a work of art inspired by a song and photograph your creation",
  "Cook a dish you've never made before and capture the process",
  "Create a photo story using 3 everyday objects in an unexpected way",
  "Visit somewhere new (even if it's just a different route) and document what you discover",
  "Transform a mundane object into something beautiful through photography",
  "Submit a photo of a beautiful dinner you made this week",
  "Build something functional using only items from your junk drawer",
  "Show us your most creative use of natural lighting",
  "Make a miniature world scene in a small container",
  "Create a color gradient using natural objects",
  "Photograph water in its most interesting form",
  "Design a cozy reading nook using items you already own",
  "Create an abstract composition using only kitchen utensils"
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