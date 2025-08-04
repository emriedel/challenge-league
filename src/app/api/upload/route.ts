import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createErrorResponse, ErrorCodes } from '@/lib/errors';
import { FILE_LIMITS } from '@/constants/app';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

export const { POST } = createMethodHandlers({
  POST: async ({ session, req }) => {
    console.log('Upload API called');
    console.log('User authenticated:', session.user.id);

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('No file in formData');
      return createErrorResponse('INVALID_INPUT', 'No file provided');
    }

    // Validate file size  
    if (file.size > FILE_LIMITS.PHOTO_MAX_SIZE) {
      console.log(`File too large: ${file.size} bytes`);
      return createErrorResponse('FILE_TOO_LARGE');
    }

    // Validate file type (accept common image types)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log(`Invalid file type: ${file.type}`);
      return createErrorResponse('INVALID_FILE_TYPE');
    }

    console.log(`File received: ${file.name}, ${file.size} bytes, ${file.type}`);

    try {
      // Check if we have Vercel Blob token
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        console.log('Using Vercel Blob for storage');
        
        // Upload to Vercel Blob
        const { url } = await put(file.name, file, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        console.log('File uploaded to Vercel Blob:', url);
        return NextResponse.json({ url });
      } else {
        console.log('No Blob token found, using local storage');
        
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
        console.log('File saved locally:', url);
        return NextResponse.json({ url });
      }
    } catch (error) {
      console.error('Upload error:', error);
      return createErrorResponse('STORAGE_ERROR');
    }
  }
});