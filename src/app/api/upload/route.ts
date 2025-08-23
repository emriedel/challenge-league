import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ValidationError, ApiError } from '@/lib/apiErrors';
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
      throw new ValidationError('No file provided');
    }

    // Validate file size  
    if (file.size > FILE_LIMITS.PHOTO_MAX_SIZE) {
      console.log(`File too large: ${file.size} bytes`);
      throw new ValidationError('File size is too large. Please choose a smaller file.');
    }

    // Validate file type (accept common image types)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log(`Invalid file type: ${file.type}`);
      throw new ValidationError('Invalid file type. Please upload an image file.');
    }

    console.log(`File received: ${file.name}, ${file.size} bytes, ${file.type}`);

    try {
      // Check if we have a valid Vercel Blob token and we're not in development
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      const isDevelopment = process.env.NODE_ENV === 'development';
      const hasValidBlobToken = blobToken && blobToken.startsWith('vercel_blob_rw_') && !isDevelopment;
      
      if (hasValidBlobToken) {
        console.log('Using Vercel Blob for storage');
        
        // Upload to Vercel Blob
        const { url } = await put(file.name, file, {
          access: 'public',
          token: blobToken,
        });

        console.log('File uploaded to Vercel Blob:', url);
        return NextResponse.json({ url });
      } else {
        console.log('Using local storage (development mode or no valid blob token)');
        
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
      throw new ApiError('File storage error. Please try again.', 500, 'STORAGE_ERROR');
    }
  }
});