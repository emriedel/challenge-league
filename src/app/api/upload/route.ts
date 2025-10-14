import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ValidationError, ApiError } from '@/lib/apiErrors';
import { FILE_LIMITS } from '@/constants/app';
import { logger } from '@/lib/monitoring';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

// Configure route for file uploads
export const maxDuration = 60; // 60 seconds timeout
export const runtime = 'nodejs';

/**
 * Unified upload endpoint with organized folder structure
 * Supports both profile photos and challenge submissions
 */
export const { POST } = createMethodHandlers({
  POST: async ({ session, req }) => {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    // Optional context for organizing uploads
    const uploadType = formData.get('type') as string | null; // 'profile' or 'challenge'
    const leagueId = formData.get('leagueId') as string | null;
    const promptId = formData.get('promptId') as string | null;

    if (!file) {
      logger.warn('Upload attempt with no file', {
        userId: session.user.id,
        uploadType,
        category: 'upload_validation',
      });
      throw new ValidationError('No file provided');
    }

    // Validate file size based on upload type
    const maxSize = uploadType === 'profile'
      ? FILE_LIMITS.PROFILE_PHOTO_MAX_SIZE
      : FILE_LIMITS.PHOTO_MAX_SIZE;

    if (file.size > maxSize) {
      logger.warn('File size exceeded', {
        userId: session.user.id,
        fileSize: file.size,
        maxSize,
        uploadType,
        fileName: file.name,
        fileType: file.type,
        category: 'upload_validation',
      });
      throw new ValidationError('File size is too large. Please choose a smaller file.');
    }

    // Validate file type (accept common image types)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',     // Common animated format
      'image/heic',    // iPhone photos
      'image/heif',    // Modern image format
    ];

    if (!allowedTypes.includes(file.type)) {
      logger.warn('Invalid file type upload attempt', {
        userId: session.user.id,
        fileType: file.type,
        fileName: file.name,
        fileSize: file.size,
        uploadType,
        category: 'upload_validation',
      });
      throw new ValidationError('Invalid file type. Please upload a supported image file (JPEG, PNG, WebP, GIF, HEIC).');
    }

    try {
      // Check if we have a valid Vercel Blob token and we're not in development
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      const isDevelopment = process.env.NODE_ENV === 'development';
      const hasValidBlobToken = blobToken && blobToken.startsWith('vercel_blob_rw_') && !isDevelopment;

      // Normalize file extension
      const extensionMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'image/heic': 'heic',
        'image/heif': 'heif',
      };

      const normalizedExtension = extensionMap[file.type] || 'jpg';
      const timestamp = Date.now();

      // Determine storage path based on upload type
      let storagePath: string;

      if (uploadType === 'profile') {
        // Profile photos: profile-photos/{userId}-{timestamp}.{ext}
        storagePath = `profile-photos/${session.user.id}-${timestamp}.${normalizedExtension}`;
      } else if (uploadType === 'challenge' && leagueId && promptId) {
        // Challenge submissions: challenges/{leagueId}/{promptId}/{userId}-{timestamp}.{ext}
        storagePath = `challenges/${leagueId}/${promptId}/${session.user.id}-${timestamp}.${normalizedExtension}`;
      } else {
        // Fallback for generic uploads
        storagePath = `uploads/${timestamp}.${normalizedExtension}`;
      }

      if (hasValidBlobToken) {
        // Upload to Vercel Blob with organized path
        try {
          const { url } = await put(storagePath, file, {
            access: 'public',
            token: blobToken,
          });

          logger.info('File uploaded successfully to Vercel Blob', {
            userId: session.user.id,
            uploadType: uploadType || undefined,
            leagueId: leagueId || undefined,
            promptId: promptId || undefined,
            fileSize: file.size,
            fileType: file.type,
            storagePath,
            category: 'upload_success',
          });

          return NextResponse.json({ url, storagePath });
        } catch (blobError) {
          logger.error('Vercel Blob upload failed', blobError as Error, {
            userId: session.user.id,
            uploadType: uploadType || undefined,
            leagueId: leagueId || undefined,
            promptId: promptId || undefined,
            fileSize: file.size,
            fileType: file.type,
            fileName: file.name,
            storagePath,
            category: 'upload_blob_error',
          });
          throw blobError;
        }
      } else {
        // Fallback: store locally in public/uploads
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        try {
          await mkdir(uploadsDir, { recursive: true });
        } catch (mkdirError) {
          logger.warn('Failed to create uploads directory', {
            error: mkdirError instanceof Error ? mkdirError.message : 'Unknown error',
            uploadsDir,
            category: 'upload_filesystem',
          });
          // Directory might already exist, that's fine
        }

        // Generate unique filename for local storage
        const filename = `${timestamp}-${file.name}`;
        const filepath = join(uploadsDir, filename);

        // Write file
        try {
          await writeFile(filepath, buffer);

          logger.info('File uploaded successfully to local storage', {
            userId: session.user.id,
            uploadType,
            fileSize: file.size,
            fileType: file.type,
            filename,
            category: 'upload_success',
          });

          const url = `/uploads/${filename}`;
          return NextResponse.json({ url, storagePath: filename });
        } catch (writeError) {
          logger.error('Local file write failed', writeError as Error, {
            userId: session.user.id,
            uploadType,
            fileSize: file.size,
            fileType: file.type,
            fileName: file.name,
            filepath,
            category: 'upload_filesystem_error',
          });
          throw writeError;
        }
      }
    } catch (error) {
      logger.error('Upload failed with unexpected error', error as Error, {
        userId: session.user.id,
        uploadType: uploadType || undefined,
        leagueId: leagueId || undefined,
        promptId: promptId || undefined,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
        category: 'upload_error',
      });
      throw new ApiError('File storage error. Please try again.', 500, 'STORAGE_ERROR');
    }
  }
}, true, 'uploads'); // Apply upload rate limiting