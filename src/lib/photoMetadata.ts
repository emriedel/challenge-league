/**
 * Photo metadata extraction utilities for validating photo timestamps
 */

import exifr from 'exifr';

export interface PhotoDateInfo {
  /** Date the photo was taken (from EXIF metadata) */
  dateTaken: Date | null;
  /** Whether EXIF metadata was available */
  hasMetadata: boolean;
}

/**
 * Extract the date a photo was taken from EXIF metadata
 * Returns null if no date metadata is available
 */
export async function extractPhotoDate(file: File): Promise<PhotoDateInfo> {
  try {
    // Extract EXIF data from the file
    // DateTimeOriginal is the standard EXIF field for when photo was taken
    const exifData = await exifr.parse(file, {
      pick: ['DateTimeOriginal', 'DateTime', 'CreateDate'],
    });

    if (!exifData) {
      return { dateTaken: null, hasMetadata: false };
    }

    // Try different EXIF date fields in order of preference
    // DateTimeOriginal: When the photo was originally taken
    // DateTime: When the file was last modified
    // CreateDate: When the file was created
    const dateTaken =
      exifData.DateTimeOriginal ||
      exifData.DateTime ||
      exifData.CreateDate;

    if (!dateTaken || !(dateTaken instanceof Date)) {
      return { dateTaken: null, hasMetadata: true };
    }

    return { dateTaken, hasMetadata: true };
  } catch (error) {
    console.error('Failed to extract photo metadata:', error);
    return { dateTaken: null, hasMetadata: false };
  }
}

/**
 * Determine if we should warn the user about photo age
 *
 * @param photoDate - When the photo was taken
 * @param challengeStartDate - When the challenge became active
 * @returns Warning message if photo is too old, null otherwise
 */
export function shouldWarnAboutPhotoAge(
  photoDate: Date | null,
  challengeStartDate: Date | null | undefined
): string | null {
  // No warning if we don't have both dates
  if (!photoDate || !challengeStartDate) {
    return null;
  }

  // Calculate the time difference
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const timeDiff = challengeStartDate.getTime() - photoDate.getTime();

  // Warn if photo was taken more than a week before challenge started
  if (timeDiff > ONE_WEEK_MS) {
    return 'This photo was taken before the challenge started. Consider taking a new photo during the challenge period.';
  }

  return null;
}

/**
 * Check if a photo should trigger an age warning
 * Combines extraction and validation in one step
 */
export async function checkPhotoAge(
  file: File,
  challengeStartDate: Date | null | undefined
): Promise<string | null> {
  const { dateTaken } = await extractPhotoDate(file);
  return shouldWarnAboutPhotoAge(dateTaken, challengeStartDate);
}
