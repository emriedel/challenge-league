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

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 2560, // Increased for modern phone cameras (4K displays)
  maxHeight: 1440, // Increased for portrait photos
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
 */
async function attemptCompression(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<File> {
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
            // Clean up
            URL.revokeObjectURL(img.src);

            if (!blob) {
              reject(new CompressionError(
                CompressionErrorType.COMPRESSION_FAILED,
                'Failed to create compressed image blob'
              ));
              return;
            }

            // Convert blob to file
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.jpg'), // Ensure .jpg extension
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );

            resolve(compressedFile);
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
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Strategy 1: Try with default quality and dimensions
  try {
    console.log(`Attempting compression: ${opts.maxWidth}x${opts.maxHeight} @ ${opts.quality} quality`);
    const compressed = await attemptCompression(
      file,
      opts.maxWidth,
      opts.maxHeight,
      opts.quality
    );

    // Check if size is acceptable
    if (compressed.size <= opts.maxSizeBytes) {
      console.log(`✓ Compression successful: ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)}`);
      return compressed;
    }

    console.log(`⚠ Compressed file still too large (${formatFileSize(compressed.size)}), trying lower quality`);
  } catch (error) {
    console.warn('Initial compression attempt failed:', error);
  }

  // Strategy 2: Try with lower quality
  try {
    const lowerQuality = Math.max(0.70, opts.quality - 0.20);
    console.log(`Attempting compression with lower quality: ${lowerQuality}`);
    const compressed = await attemptCompression(
      file,
      opts.maxWidth,
      opts.maxHeight,
      lowerQuality
    );

    if (compressed.size <= opts.maxSizeBytes) {
      console.log(`✓ Lower quality compression successful: ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)}`);
      return compressed;
    }

    console.log(`⚠ Still too large, trying smaller dimensions`);
  } catch (error) {
    console.warn('Lower quality compression failed:', error);
  }

  // Strategy 3: Try with smaller dimensions (75% of original)
  try {
    const smallerWidth = Math.floor(opts.maxWidth * 0.75);
    const smallerHeight = Math.floor(opts.maxHeight * 0.75);
    console.log(`Attempting compression with smaller dimensions: ${smallerWidth}x${smallerHeight}`);
    const compressed = await attemptCompression(
      file,
      smallerWidth,
      smallerHeight,
      0.85
    );

    if (compressed.size <= opts.maxSizeBytes) {
      console.log(`✓ Smaller dimensions compression successful: ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)}`);
      return compressed;
    }

    console.log(`⚠ Still too large, trying aggressive compression`);
  } catch (error) {
    console.warn('Smaller dimensions compression failed:', error);
  }

  // Strategy 4: Try aggressive compression (small dimensions + low quality)
  try {
    const aggressiveWidth = Math.floor(opts.maxWidth * 0.5);
    const aggressiveHeight = Math.floor(opts.maxHeight * 0.5);
    console.log(`Attempting aggressive compression: ${aggressiveWidth}x${aggressiveHeight} @ 0.70 quality`);
    const compressed = await attemptCompression(
      file,
      aggressiveWidth,
      aggressiveHeight,
      0.70
    );

    console.log(`✓ Aggressive compression successful: ${formatFileSize(file.size)} → ${formatFileSize(compressed.size)}`);
    return compressed;
  } catch (error) {
    console.warn('Aggressive compression failed:', error);
  }

  // Strategy 5: Last resort - return original if it's under the pre-upload limit
  const PRE_UPLOAD_LIMIT = 5 * 1024 * 1024; // 5MB
  if (file.size <= PRE_UPLOAD_LIMIT) {
    console.warn(`⚠ All compression strategies failed, using original file (${formatFileSize(file.size)})`);
    return file;
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