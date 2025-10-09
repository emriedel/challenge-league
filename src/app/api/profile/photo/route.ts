import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { db } from '@/lib/db';
import { put, del } from '@vercel/blob';
import { FILE_LIMITS } from '@/constants/app';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

// Dynamic export is handled by the API handler
export { dynamic } from '@/lib/apiMethods';

/**
 * Helper function to safely delete old photo from storage
 */
async function deleteOldPhoto(photoUrl: string) {
  if (!photoUrl) return;

  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasValidBlobToken = blobToken && blobToken.startsWith('vercel_blob_rw_') && !isDevelopment;

    if (hasValidBlobToken && photoUrl.includes('vercel-storage.com')) {
      // Delete from Vercel Blob
      await del(photoUrl, { token: blobToken });
      console.log(`Deleted old blob: ${photoUrl}`);
    } else if (photoUrl.startsWith('/uploads/')) {
      // Delete from local storage
      const filename = photoUrl.replace('/uploads/', '');
      const filepath = join(process.cwd(), 'public', 'uploads', filename);
      await unlink(filepath);
      console.log(`Deleted old local file: ${filepath}`);
    }
  } catch (error) {
    // Log but don't fail - orphaned files are acceptable
    console.error('Failed to delete old photo (non-critical):', error);
  }
}

const uploadProfilePhoto = async ({ req, session }: AuthenticatedApiContext) => {
  const formData = await req.formData();
    const file = formData.get('photo') as File;

  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size for profile photos
  if (file.size > FILE_LIMITS.PROFILE_PHOTO_MAX_SIZE) {
    throw new Error(`File size must be less than ${FILE_LIMITS.PROFILE_PHOTO_MAX_SIZE / (1024 * 1024)}MB`);
  }

  // Get user's current profile photo before upload
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { profilePhoto: true },
  });

  let photoUrl: string;

  // Check if we have a valid Vercel Blob token and we're not in development
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasValidBlobToken = blobToken && blobToken.startsWith('vercel_blob_rw_') && !isDevelopment;

  if (hasValidBlobToken) {
    // Use Vercel Blob for production
    // Normalize file extension to avoid Vercel Blob pattern errors
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };

    const normalizedExtension = extensionMap[file.type] || 'jpg'; // fallback to jpg
    const filename = `profile-photos/${session.user.id}-${Date.now()}.${normalizedExtension}`;

    console.log(`Uploading to Vercel Blob: ${filename}, MIME: ${file.type}, Size: ${file.size}`);

    try {
      const blob = await put(filename, file, {
        access: 'public',
        token: blobToken,
      });
      photoUrl = blob.url;
    } catch (error) {
      console.error('Vercel Blob upload error:', error);
      throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } else {
    // Use local storage for development or when no valid blob token
    const filename = `profile-${session.user.id}-${Date.now()}.${file.type.split('/')[1]}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads directory
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(process.cwd(), 'public/uploads');

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);
    photoUrl = `/uploads/${filename}`;
  }

    // Update user's profile photo in database
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: { profilePhoto: photoUrl },
      select: {
        id: true,
        username: true,
        profilePhoto: true,
      },
    });

  // Delete old photo only after successful upload and DB update
  if (currentUser?.profilePhoto && currentUser.profilePhoto !== photoUrl) {
    await deleteOldPhoto(currentUser.profilePhoto);
  }

  return NextResponse.json({
    success: true,
    user: updatedUser,
    photoUrl,
  });
};

const deleteProfilePhoto = async ({ session }: AuthenticatedApiContext) => {
  // Get user's current profile photo
  const currentUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { profilePhoto: true },
  });

  // Remove profile photo from user
  const updatedUser = await db.user.update({
    where: { id: session.user.id },
    data: { profilePhoto: null },
    select: {
      id: true,
      username: true,
      profilePhoto: true,
    },
  });

  // Delete the old photo from storage
  if (currentUser?.profilePhoto) {
    await deleteOldPhoto(currentUser.profilePhoto);
  }

  return NextResponse.json({
    success: true,
    user: updatedUser,
  });
};

export const { POST, DELETE } = createMethodHandlers({
  POST: uploadProfilePhoto,
  DELETE: deleteProfilePhoto
});