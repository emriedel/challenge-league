/**
 * Image compression utilities for optimizing uploaded photos
 */

export interface CompressionOptions {
  /** Maximum width in pixels (default: 2560) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 1440) */
  maxHeight?: number;
  /** JPEG quality 0-1 (default: 0.90) */
  quality?: number;
  /** Maximum file size in bytes (default: 1MB) */
  maxSizeBytes?: number;
}

export interface CompressionResult {
  /** The compressed image as a File object (for upload) */
  file: File;
  /** Blob URL for preview (must be revoked by caller) */
  blobUrl: string;
  /** Original blob (for reference) */
  blob: Blob;
}

/**
 * Detect device capabilities and return appropriate dimension limits
 * Older/lower-end devices get smaller dimensions to avoid memory issues
 */
function getDeviceCapableDimensions(): { maxWidth: number; maxHeight: number } {
  if (typeof window === 'undefined') {
    // Server-side: return conservative defaults
    return { maxWidth: 1920, maxHeight: 1920 };
  }

  // Check available memory (Chrome/Edge only)
  const memory = (performance as any).memory;
  if (memory && memory.jsHeapSizeLimit) {
    const availableMemoryMB = memory.jsHeapSizeLimit / (1024 * 1024);
    // If less than 512MB available, use smaller dimensions
    if (availableMemoryMB < 512) {
      console.log(`Low memory detected (${Math.round(availableMemoryMB)}MB), using smaller dimensions`);
      return { maxWidth: 1280, maxHeight: 1280 };
    }
  }

  // Check device pixel ratio and screen size
  const dpr = window.devicePixelRatio || 1;
  const screenWidth = window.screen.width * dpr;
  const screenHeight = window.screen.height * dpr;

  // If screen is small (< 1080p equivalent), use smaller dimensions
  if (screenWidth < 1920 && screenHeight < 1920) {
    console.log(`Small screen detected (${Math.round(screenWidth)}x${Math.round(screenHeight)}), using moderate dimensions`);
    return { maxWidth: 1920, maxHeight: 1920 };
  }

  // High-end devices get full quality
  console.log('High-end device detected, using maximum dimensions');
  return { maxWidth: 2560, maxHeight: 2560 };
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 2560, // Will be overridden by device detection if needed
  maxHeight: 1440, // Will be overridden by device detection if needed
  quality: 0.90,
  maxSizeBytes: 1 * 1024 * 1024, // 1MB
};

/**
 * Error types for better error handling
 */
export enum CompressionErrorType {
  CONTEXT_NOT_SUPPORTED = 'CONTEXT_NOT_SUPPORTED',
  IMAGE_LOAD_FAILED = 'IMAGE_LOAD_FAILED',
  COMPRESSION_FAILED = 'COMPRESSION_FAILED',
  MEMORY_EXCEEDED = 'MEMORY_EXCEEDED',
}

export class CompressionError extends Error {
  constructor(
    public type: CompressionErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'CompressionError';
  }
}

/**
 * Attempt compression with specific options
 * Returns both File object and blob URL for efficient preview
 */
async function attemptCompression(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new CompressionError(
        CompressionErrorType.CONTEXT_NOT_SUPPORTED,
        'Canvas 2D context not supported'
      ));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions while preserving aspect ratio
        const { width: newWidth, height: newHeight } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            // Clean up source image blob URL
            URL.revokeObjectURL(img.src);

            if (!blob) {
              reject(new CompressionError(
                CompressionErrorType.COMPRESSION_FAILED,
                'Failed to create compressed image blob'
              ));
              return;
            }

            // Create blob URL for preview BEFORE converting to File
            // This is more efficient and works better on older devices
            const blobUrl = URL.createObjectURL(blob);

            // Convert blob to file for upload
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.jpg'), // Ensure .jpg extension
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            resolve({
              file: compressedFile,
              blobUrl,
              blob,
            });
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        URL.revokeObjectURL(img.src);
        reject(new CompressionError(
          CompressionErrorType.MEMORY_EXCEEDED,
          'Memory error during compression',
          error as Error
        ));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new CompressionError(
        CompressionErrorType.IMAGE_LOAD_FAILED,
        'Failed to load and decode image'
      ));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress an image file to reduce size while maintaining quality
 * Includes multiple fallback strategies for better reliability
 * Returns both File object (for upload) and blob URL (for preview)
 * Automatically adapts dimensions based on device capabilities
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  // Apply device-specific dimension limits if not explicitly set
  const deviceDimensions = getDeviceCapableDimensions();
  const opts = {
    ...DEFAULT_OPTIONS,
    maxWidth: options.maxWidth || deviceDimensions.maxWidth,
    maxHeight: options.maxHeight || deviceDimensions.maxHeight,
    ...options,
  };

  // Strategy 1: Try with default quality and dimensions
  try {
    console.log(`Attempting compression: ${opts.maxWidth}x${opts.maxHeight} @ ${opts.quality} quality`);
    const result = await attemptCompression(
      file,
      opts.maxWidth,
      opts.maxHeight,
      opts.quality
    );

    // Check if size is acceptable
    if (result.file.size <= opts.maxSizeBytes) {
      console.log(`✓ Compression successful: ${formatFileSize(file.size)} → ${formatFileSize(result.file.size)}`);
      return result;
    }

    // Size not acceptable - revoke this blob URL and try next strategy
    URL.revokeObjectURL(result.blobUrl);
    console.log(`⚠ Compressed file still too large (${formatFileSize(result.file.size)}), trying lower quality`);
  } catch (error) {
    console.warn('Initial compression attempt failed:', error);
  }

  // Strategy 2: Try with lower quality
  try {
    const lowerQuality = Math.max(0.70, opts.quality - 0.20);
    console.log(`Attempting compression with lower quality: ${lowerQuality}`);
    const result = await attemptCompression(
      file,
      opts.maxWidth,
      opts.maxHeight,
      lowerQuality
    );

    if (result.file.size <= opts.maxSizeBytes) {
      console.log(`✓ Lower quality compression successful: ${formatFileSize(file.size)} → ${formatFileSize(result.file.size)}`);
      return result;
    }

    URL.revokeObjectURL(result.blobUrl);
    console.log(`⚠ Still too large, trying smaller dimensions`);
  } catch (error) {
    console.warn('Lower quality compression failed:', error);
  }

  // Strategy 3: Try with smaller dimensions (75% of original)
  try {
    const smallerWidth = Math.floor(opts.maxWidth * 0.75);
    const smallerHeight = Math.floor(opts.maxHeight * 0.75);
    console.log(`Attempting compression with smaller dimensions: ${smallerWidth}x${smallerHeight}`);
    const result = await attemptCompression(
      file,
      smallerWidth,
      smallerHeight,
      0.85
    );

    if (result.file.size <= opts.maxSizeBytes) {
      console.log(`✓ Smaller dimensions compression successful: ${formatFileSize(file.size)} → ${formatFileSize(result.file.size)}`);
      return result;
    }

    URL.revokeObjectURL(result.blobUrl);
    console.log(`⚠ Still too large, trying aggressive compression`);
  } catch (error) {
    console.warn('Smaller dimensions compression failed:', error);
  }

  // Strategy 4: Try aggressive compression (small dimensions + low quality)
  try {
    const aggressiveWidth = Math.floor(opts.maxWidth * 0.5);
    const aggressiveHeight = Math.floor(opts.maxHeight * 0.5);
    console.log(`Attempting aggressive compression: ${aggressiveWidth}x${aggressiveHeight} @ 0.70 quality`);
    const result = await attemptCompression(
      file,
      aggressiveWidth,
      aggressiveHeight,
      0.70
    );

    console.log(`✓ Aggressive compression successful: ${formatFileSize(file.size)} → ${formatFileSize(result.file.size)}`);
    return result;
  } catch (error) {
    console.warn('Aggressive compression failed:', error);
  }

  // Strategy 5: Last resort - return original if it's under the pre-upload limit
  const PRE_UPLOAD_LIMIT = 5 * 1024 * 1024; // 5MB
  if (file.size <= PRE_UPLOAD_LIMIT) {
    console.warn(`⚠ All compression strategies failed, using original file (${formatFileSize(file.size)})`);
    // Create blob URL for the original file
    const blobUrl = URL.createObjectURL(file);
    return {
      file,
      blobUrl,
      blob: file, // Original file is already a Blob
    };
  }

  // All strategies failed
  throw new CompressionError(
    CompressionErrorType.COMPRESSION_FAILED,
    'All compression strategies failed and file is too large'
  );
}

/**
 * Calculate new dimensions while preserving aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Scale down if necessary
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}