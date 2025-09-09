/**
 * Image compression utilities for optimizing uploaded photos
 */

export interface CompressionOptions {
  /** Maximum width in pixels (default: 1920) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 1080) */
  maxHeight?: number;
  /** JPEG quality 0-1 (default: 0.85) */
  quality?: number;
  /** Maximum file size in bytes (default: 1MB) */
  maxSizeBytes?: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  maxSizeBytes: 1 * 1024 * 1024, // 1MB
};

/**
 * Compress an image file to reduce size while maintaining quality
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas 2D context not supported'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while preserving aspect ratio
      const { width: newWidth, height: newHeight } = calculateDimensions(
        img.width,
        img.height,
        opts.maxWidth,
        opts.maxHeight
      );

      // Set canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }

          // Check if compression was successful
          if (blob.size > opts.maxSizeBytes) {
            // If still too large, try with lower quality
            const lowerQuality = Math.max(0.5, opts.quality - 0.2);
            canvas.toBlob(
              (retryBlob) => {
                if (!retryBlob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }
                
                // Convert blob to file
                const compressedFile = new File(
                  [retryBlob],
                  file.name.replace(/\.[^/.]+$/, '.jpg'), // Ensure .jpg extension
                  {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  }
                );
                
                resolve(compressedFile);
              },
              'image/jpeg',
              lowerQuality
            );
          } else {
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
          }
        },
        'image/jpeg',
        opts.quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
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