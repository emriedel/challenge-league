import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createErrorResponse, ErrorCodes } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    console.log('Upload API called');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('No session found');
      return createErrorResponse('UNAUTHORIZED');
    }

    console.log('User authenticated:', session.user.id);

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('No file in formData');
      return createErrorResponse('VALIDATION_ERROR', 'No file provided');
    }

    console.log('File received:', file.name, file.size, file.type);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.log('Invalid file type:', file.type);
      return createErrorResponse('INVALID_FILE_TYPE');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log('File too large:', file.size);
      return createErrorResponse('FILE_TOO_LARGE', 'File size must be less than 10MB');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const userId = session.user.id;
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filename = `responses/${userId}-${timestamp}.${fileExtension}`;

    // Check if BLOB_READ_WRITE_TOKEN is available
    if (!process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN === 'your-vercel-blob-token-here') {
      console.log('Using local file storage (development mode)');
      
      // For development: store files locally in public/uploads
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
      
      const filepath = join(uploadDir, `${userId}-${timestamp}.${fileExtension}`);
      const buffer = Buffer.from(await file.arrayBuffer());
      
      await writeFile(filepath, buffer);
      
      const publicUrl = `/uploads/${userId}-${timestamp}.${fileExtension}`;
      console.log('Local upload successful:', publicUrl);
      
      return NextResponse.json({
        url: publicUrl,
        filename: `${userId}-${timestamp}.${fileExtension}`,
      });
    }

    console.log('Uploading to Vercel Blob:', filename);

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });

    console.log('Blob upload successful:', blob.url);

    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
    });
  } catch (error) {
    console.error('Upload error details:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('BLOB_READ_WRITE_TOKEN')) {
        return NextResponse.json({ 
          error: 'Blob storage configuration error. Please check environment variables.' 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: `Upload failed: ${error.message}` 
      }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}