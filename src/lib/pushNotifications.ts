import { db } from './db';
import webpush from 'web-push';

// Initialize web-push with VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@challengeleague.com'
};

webpush.setVapidDetails(
  vapidKeys.subject,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export interface NotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    [key: string]: any;
  };
  tag?: string;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

export type NotificationType =
  | 'new-prompt-available'
  | 'submission-deadline-24h'
  | 'voting-available'
  | 'voting-deadline-24h'
  | 'league-started'
  | 'badge-refresh';

/**
 * Send push notification to a specific user
 */
export async function sendNotificationToUser(
  userId: string, 
  notificationData: NotificationData
): Promise<{ success: boolean; sent: number; failed: number }> {
  try {
    // Get all push subscriptions for this user
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { success: true, sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const promises: Promise<void>[] = [];

    for (const subscription of subscriptions) {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      };

      const promise = webpush
        .sendNotification(pushSubscription, JSON.stringify(notificationData))
        .then(() => {
          console.log(`✅ Notification sent successfully to ${subscription.endpoint.substring(0, 50)}...`);
          console.log(`📱 Notification data:`, JSON.stringify(notificationData, null, 2));
          sent++;
        })
        .catch(async (error: any) => {
          console.error(`❌ Failed to send notification to ${subscription.endpoint}:`, error);
          failed++;
          
          // Remove invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`🗑️ Removing invalid subscription: ${subscription.endpoint}`);
            await db.pushSubscription.delete({
              where: { id: subscription.id }
            });
          }
        });

      promises.push(promise);
    }

    // Wait for all notifications to complete
    await Promise.allSettled(promises);

    console.log(`📱 Notification summary for user ${userId}: ${sent} sent, ${failed} failed`);
    return { success: true, sent, failed };

  } catch (error) {
    console.error('Error sending notification to user:', error);
    return { success: false, sent: 0, failed: 0 };
  }
}

/**
 * Send push notification to all users in a league
 */
export async function sendNotificationToLeague(
  leagueId: string, 
  notificationData: NotificationData,
  excludeUserId?: string
): Promise<{ success: boolean; totalSent: number; totalFailed: number }> {
  try {
    // Get all active members of the league
    const memberships = await db.leagueMembership.findMany({
      where: { 
        leagueId,
        isActive: true,
        ...(excludeUserId && { userId: { not: excludeUserId } })
      },
      include: {
        user: {
          include: {
            pushSubscriptions: true
          }
        }
      }
    });

    if (memberships.length === 0) {
      console.log(`No active members found in league ${leagueId}`);
      return { success: true, totalSent: 0, totalFailed: 0 };
    }

    let totalSent = 0;
    let totalFailed = 0;
    const promises: Promise<void>[] = [];

    for (const membership of memberships) {
      const { user } = membership;
      
      if (user.pushSubscriptions.length === 0) {
        console.log(`No push subscriptions for user ${user.username}`);
        continue;
      }

      for (const subscription of user.pushSubscriptions) {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        const promise = webpush
          .sendNotification(pushSubscription, JSON.stringify(notificationData))
          .then(() => {
            console.log(`✅ Notification sent to ${user.username}`);
            totalSent++;
          })
          .catch(async (error: any) => {
            console.error(`❌ Failed to send notification to ${user.username}:`, error);
            totalFailed++;
            
            // Remove invalid subscriptions
            if (error.statusCode === 410 || error.statusCode === 404) {
              console.log(`🗑️ Removing invalid subscription for ${user.username}`);
              await db.pushSubscription.delete({
                where: { id: subscription.id }
              });
            }
          });

        promises.push(promise);
      }
    }

    // Wait for all notifications to complete
    await Promise.allSettled(promises);

    console.log(`📱 League notification summary: ${totalSent} sent, ${totalFailed} failed to ${memberships.length} members`);
    return { success: true, totalSent, totalFailed };

  } catch (error) {
    console.error('Error sending notification to league:', error);
    return { success: false, totalSent: 0, totalFailed: 0 };
  }
}

/**
 * Send silent badge refresh notification to all users
 */
export async function sendBadgeRefreshNotificationToAllUsers(): Promise<{ success: boolean; totalSent: number; totalFailed: number }> {
  try {
    // Get all active users with push subscriptions
    const users = await db.user.findMany({
      include: {
        pushSubscriptions: true
      }
    });

    if (users.length === 0) {
      console.log('No users with push subscriptions found');
      return { success: true, totalSent: 0, totalFailed: 0 };
    }

    let totalSent = 0;
    let totalFailed = 0;
    const promises: Promise<void>[] = [];

    const notificationData = createNotificationData('badge-refresh', {});

    for (const user of users) {
      if (user.pushSubscriptions.length === 0) {
        continue;
      }

      for (const subscription of user.pushSubscriptions) {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        const promise = webpush
          .sendNotification(pushSubscription, JSON.stringify(notificationData))
          .then(() => {
            console.log(`✅ Badge refresh notification sent to ${user.username}`);
            totalSent++;
          })
          .catch(async (error: any) => {
            console.error(`❌ Failed to send badge refresh notification to ${user.username}:`, error);
            totalFailed++;

            // Remove invalid subscriptions
            if (error.statusCode === 410 || error.statusCode === 404) {
              console.log(`🗑️ Removing invalid subscription for ${user.username}`);
              await db.pushSubscription.delete({
                where: { id: subscription.id }
              });
            }
          });

        promises.push(promise);
      }
    }

    // Wait for all notifications to complete
    await Promise.allSettled(promises);

    console.log(`🔔 Badge refresh notification summary: ${totalSent} sent, ${totalFailed} failed to ${users.length} users`);
    return { success: true, totalSent, totalFailed };

  } catch (error) {
    console.error('Error sending badge refresh notifications:', error);
    return { success: false, totalSent: 0, totalFailed: 0 };
  }
}

/**
 * Create notification data based on type
 */
export function createNotificationData(
  type: NotificationType,
  context: {
    promptText?: string;
    leagueName?: string;
    leagueId?: string;
    hoursLeft?: number;
  }
): NotificationData {
  const { promptText, leagueName, leagueId, hoursLeft } = context;

  switch (type) {
    case 'new-prompt-available':
      return {
        title: 'A New Challenge Is Available!',
        body: promptText || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'new-prompt',
        data: {
          url: leagueId ? `/app/league/${leagueId}` : '/',
          type: 'new-prompt'
        }
      };

    case 'submission-deadline-24h':
      return {
        title: '24 Hours Left to Submit!',
        body: promptText || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'submission-reminder',
        data: { 
          url: leagueId ? `/app/league/${leagueId}` : '/',
          type: 'submission-reminder'
        }
      };

    case 'voting-available':
      return {
        title: 'Voting is Open!',
        body: promptText || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'voting-open',
        data: { 
          url: leagueId ? `/app/league/${leagueId}` : '/',
          type: 'voting-open'
        }
      };

    case 'voting-deadline-24h':
      return {
        title: '24 Hours Left to Vote!',
        body: promptText || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'voting-reminder',
        data: {
          url: leagueId ? `/app/league/${leagueId}` : '/',
          type: 'voting-reminder'
        }
      };

    case 'league-started':
      return {
        title: 'Your League Has Started!',
        body: `Check out the first challenge for ${leagueName || 'your league'}!`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'league-started',
        data: {
          url: leagueId ? `/app/league/${leagueId}` : '/',
          type: 'league-started',
          leagueId,
          invalidateCache: true // Signal for cache invalidation
        }
      };

    case 'badge-refresh':
      return {
        title: 'Challenge League',
        body: 'League status updated',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'badge-refresh',
        data: {
          type: 'badge-refresh',
          silent: true // This will be a silent notification just to trigger badge refresh
        }
      };

    default:
      return {
        title: 'Challenge League',
        body: 'New activity in your league!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: { url: '/' }
      };
  }
}