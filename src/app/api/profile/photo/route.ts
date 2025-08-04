import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { put } from '@vercel/blob';
import { FILE_LIMITS } from '@/constants/app';

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size for profile photos
    if (file.size > FILE_LIMITS.PROFILE_PHOTO_MAX_SIZE) {
      return NextResponse.json({ error: `File size must be less than ${FILE_LIMITS.PROFILE_PHOTO_MAX_SIZE / (1024 * 1024)}MB` }, { status: 400 });
    }

    let photoUrl: string;

    // Check if we have blob storage configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Use Vercel Blob for production
      const filename = `profile-photos/${session.user.id}-${Date.now()}.${file.type.split('/')[1]}`;
      const blob = await put(filename, file, {
        access: 'public',
      });
      photoUrl = blob.url;
    } else {
      // Use local storage for development
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

    return NextResponse.json({
      success: true,
      user: updatedUser,
      photoUrl,
    });

  } catch (error) {
    console.error('Profile photo upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload profile photo' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { photoUrl } = await request.json();

    if (!photoUrl) {
      return NextResponse.json({ error: 'Photo URL is required' }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      user: updatedUser,
      photoUrl,
    });

  } catch (error) {
    console.error('Profile photo update error:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile photo' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });

  } catch (error) {
    console.error('Profile photo removal error:', error);
    return NextResponse.json({ 
      error: 'Failed to remove profile photo' 
    }, { status: 500 });
  }
}