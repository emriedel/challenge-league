/**
 * Image Cache Invalidation Utility
 *
 * Provides functions to invalidate cached images in the service worker
 * when users update their submissions during the ACTIVE phase.
 */

/**
 * Invalidate a cached submission image in the service worker
 *
 * Use this when:
 * - User updates their submission photo during ACTIVE phase
 * - User deletes their submission during ACTIVE phase
 *
 * @param imageUrl - The Vercel Blob URL of the image to invalidate
 */
export async function invalidateSubmissionImage(imageUrl: string): Promise<void> {
  if (!imageUrl) {
    console.warn('No image URL provided for cache invalidation');
    return;
  }

  // Check if service worker is available
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    console.warn('Service worker not available for cache invalidation');
    return;
  }

  try {
    // Send message to service worker to invalidate the cached image
    navigator.serviceWorker.controller.postMessage({
      type: 'INVALIDATE_SUBMISSION_IMAGE',
      data: { imageUrl }
    });

    console.log('📸 Cache invalidation requested for submission image:', imageUrl);
  } catch (error) {
    console.error('Failed to invalidate submission image cache:', error);
  }
}

/**
 * Invalidate multiple cached images at once
 *
 * @param imageUrls - Array of Vercel Blob URLs to invalidate
 */
export async function invalidateMultipleImages(imageUrls: string[]): Promise<void> {
  if (!imageUrls || imageUrls.length === 0) {
    return;
  }

  // Check if service worker is available
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    console.warn('Service worker not available for cache invalidation');
    return;
  }

  try {
    // Invalidate each image
    for (const imageUrl of imageUrls) {
      navigator.serviceWorker.controller.postMessage({
        type: 'INVALIDATE_SUBMISSION_IMAGE',
        data: { imageUrl }
      });
    }

    console.log(`📸 Cache invalidation requested for ${imageUrls.length} images`);
  } catch (error) {
    console.error('Failed to invalidate multiple images cache:', error);
  }
}
