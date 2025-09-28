import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ValidationError, ApiError } from '@/lib/apiErrors';
import { FILE_LIMITS } from '@/constants/app';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

// Configure route for file uploads
export const maxDuration = 60; // 60 seconds timeout
export const runtime = 'nodejs';


export const { POST } = createMethodHandlers({
  POST: async ({ session, req }) => {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new ValidationError('No file provided');
    }

    // Validate file size
    if (file.size > FILE_LIMITS.PHOTO_MAX_SIZE) {
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
      throw new ValidationError('Invalid file type. Please upload a supported image file (JPEG, PNG, WebP, GIF, HEIC).');
    }

    try {
      // Check if we have a valid Vercel Blob token and we're not in development
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      const isDevelopment = process.env.NODE_ENV === 'development';
      const hasValidBlobToken = blobToken && blobToken.startsWith('vercel_blob_rw_') && !isDevelopment;

      if (hasValidBlobToken) {
        // Normalize filename to avoid Vercel Blob pattern errors
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
        const sanitizedFilename = `upload-${Date.now()}.${normalizedExtension}`;

        // Upload to Vercel Blob
        const { url } = await put(sanitizedFilename, file, {
          access: 'public',
          token: blobToken,
        });

        return NextResponse.json({ url });
      } else {
        
        // Fallback: store locally in public/uploads
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        try {
          await mkdir(uploadsDir, { recursive: true });
        } catch (error) {
          // Directory might already exist, that's fine
        }

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name}`;
        const filepath = join(uploadsDir, filename);

        // Write file
        await writeFile(filepath, buffer);

        const url = `/uploads/${filename}`;
        return NextResponse.json({ url });
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw new ApiError('File storage error. Please try again.', 500, 'STORAGE_ERROR');
    }
  }
}, true, 'uploads'); // Apply upload rate limiting