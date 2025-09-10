import { NextResponse } from 'next/server';
import { createMethodHandlers } from '@/lib/apiMethods';
import { sendNotificationToUser, createNotificationData } from '@/lib/pushNotifications';
import type { AuthenticatedApiContext } from '@/lib/apiHandler';

interface TestNotificationRequest {
  type: 'new-prompt-available' | 'submission-deadline-24h' | 'voting-available' | 'voting-deadline-24h';
  promptText?: string;
}

const testNotification = async ({ req, session }: AuthenticatedApiContext) => {
  const { type, promptText } = await req.json() as TestNotificationRequest;

  if (!type) {
    const error = new Error('Notification type is required');
    (error as any).status = 400;
    throw error;
  }

  try {
    // Create notification data based on type
    const notificationData = createNotificationData(type, {
      promptText: promptText || 'This is a test notification for the Challenge League app!',
      leagueName: 'Test League',
      leagueId: 'test-league-id',
      hoursLeft: 24
    });

    // Send notification to the current user
    const result = await sendNotificationToUser(session.user.id, notificationData);

    return NextResponse.json({
      success: true,
      message: `Test notification sent successfully`,
      result: {
        sent: result.sent,
        failed: result.failed,
        notificationType: type
      }
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    const apiError = new Error('Failed to send test notification');
    (apiError as any).status = 500;
    throw apiError;
  }
};

export const { POST } = createMethodHandlers({
  POST: testNotification
});