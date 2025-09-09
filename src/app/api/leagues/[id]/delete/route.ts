import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { del } from '@vercel/blob';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

// Ensure this route is always dynamic
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { id: string };
}

// DELETE /api/leagues/[id]/delete - Delete league and all associated data (owner only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Find the league with all related data for cleanup
    const league = await db.league.findUnique({
      where: { id },
      include: {
        prompts: {
          include: {
            responses: {
              include: {
                user: true
              }
            }
          }
        },
        memberships: {
          include: {
            user: true
          }
        }
      }
    });

    if (!league) {
      return NextResponse.json({ 
        error: 'League not found' 
      }, { status: 404 });
    }

    // Check if user is the league owner
    if (league.ownerId !== session.user.id) {
      return NextResponse.json({ 
        error: 'Only league owners can delete leagues' 
      }, { status: 403 });
    }

    // Collect all image URLs that need to be deleted
    const imageUrls: string[] = [];
    
    // Add response images
    for (const prompt of league.prompts) {
      for (const response of prompt.responses) {
        if (response.imageUrl) {
          imageUrls.push(response.imageUrl);
        }
      }
    }

    // Add profile photos for users who are only in this league
    const userProfileCleanup: { userId: string; profilePhoto: string }[] = [];
    for (const membership of league.memberships) {
      if (membership.user.profilePhoto) {
        // Check if user is only in this league
        const otherMemberships = await db.leagueMembership.count({
          where: {
            userId: membership.userId,
            leagueId: { not: id },
            isActive: true
          }
        });
        
        if (otherMemberships === 0) {
          userProfileCleanup.push({
            userId: membership.userId,
            profilePhoto: membership.user.profilePhoto
          });
        }
      }
    }

    // Delete the league (cascade will handle related data)
    await db.league.delete({
      where: { id }
    });

    // Clean up image files
    const cleanupPromises: Promise<void>[] = [];

    // Check if we have Vercel Blob token
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasValidBlobToken = blobToken && blobToken.startsWith('vercel_blob_rw_') && !isDevelopment;

    for (const imageUrl of imageUrls) {
      if (hasValidBlobToken && imageUrl.includes('vercel-storage.com')) {
        // Delete from Vercel Blob
        cleanupPromises.push(
          del(imageUrl, { token: blobToken }).catch(error => {
            console.error(`Failed to delete blob ${imageUrl}:`, error);
          })
        );
      } else if (imageUrl.startsWith('/uploads/')) {
        // Delete local file
        const filename = imageUrl.replace('/uploads/', '');
        const filepath = join(process.cwd(), 'public', 'uploads', filename);
        cleanupPromises.push(
          unlink(filepath).catch(error => {
            console.error(`Failed to delete local file ${filepath}:`, error);
          })
        );
      }
    }

    // Clean up profile photos for users who were only in this league
    for (const cleanup of userProfileCleanup) {
      const { profilePhoto } = cleanup;
      if (hasValidBlobToken && profilePhoto.includes('vercel-storage.com')) {
        cleanupPromises.push(
          del(profilePhoto, { token: blobToken }).catch(error => {
            console.error(`Failed to delete profile photo ${profilePhoto}:`, error);
          })
        );
      } else if (profilePhoto.startsWith('/uploads/')) {
        const filename = profilePhoto.replace('/uploads/', '');
        const filepath = join(process.cwd(), 'public', 'uploads', filename);
        cleanupPromises.push(
          unlink(filepath).catch(error => {
            console.error(`Failed to delete profile photo ${filepath}:`, error);
          })
        );
      }
    }

    // Execute all cleanup operations
    await Promise.allSettled(cleanupPromises);

    // Clear profile photos for users who were only in this league
    if (userProfileCleanup.length > 0) {
      await db.user.updateMany({
        where: {
          id: { in: userProfileCleanup.map(u => u.userId) }
        },
        data: {
          profilePhoto: null
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'League deleted successfully',
      stats: {
        imagesDeleted: imageUrls.length,
        profilePhotosCleared: userProfileCleanup.length
      }
    });

  } catch (error) {
    console.error('Error deleting league:', error);
    return NextResponse.json({ 
      error: 'Failed to delete league' 
    }, { status: 500 });
  }
}