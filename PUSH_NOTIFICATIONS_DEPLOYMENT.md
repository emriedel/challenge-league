# Push Notifications Production Deployment Guide

## 🚀 Deployment Steps

### 1. Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

```bash
# Server-side VAPID keys (keep these secret!)
VAPID_PUBLIC_KEY=BGmYbDgNNePTGrZahwP7BUJwsxbrGvMPUjm8gjYrGzoJTcatANHOpZ--72DICXmQOmeVOtmGVKZsh6knTe5-14c
VAPID_PRIVATE_KEY=YDE4_W97oCfoWsJwhLEx5_ahtUdVBRM6ih6ePv3mVXI
VAPID_SUBJECT=mailto:admin@challengeleague.com

# Client-side VAPID key (this is public and safe to expose)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGmYbDgNNePTGrZahwP7BUJwsxbrGvMPUjm8gjYrGzoJTcatANHOpZ--72DICXmQOmeVOtmGVKZsh6knTe5-14c
```

### 2. Database Migration

The push subscription table should be created automatically during deployment via your CI/CD pipeline. If you need to run it manually:

```bash
npx prisma migrate deploy
```

### 3. Deploy Code

```bash
git add .
git commit -m "Add push notification system with VAPID keys"
git push origin main
```

### 4. Post-Deployment Testing

#### A. Basic Functionality Test
1. Visit your production site
2. Sign in to your account
3. Wait 3-4 seconds for auto-notification prompt
4. Grant permission when browser asks

#### B. Manual Testing via Profile Modal
1. Click your profile avatar (top navigation)
2. Scroll to "Push Notifications" section
3. Verify it shows "✅ Enabled" 
4. Click "📱 Send Test Notification"
5. Verify you receive the notification

#### C. Debug Panel Testing (Production)
1. Visit: `https://yoursite.com/?debug`
2. Click "🔧 Debug Notifications" button (bottom right)
3. Verify all items show ✅:
   - Environment: production
   - Supported: ✅
   - Permission: granted ✅
   - Subscribed: ✅ 
   - VAPID Key: ✅ Set

### 5. Cron Job Testing

Test that notifications are sent during actual prompt transitions:

1. **Option A: Wait for natural transition** (if you have active prompts)
2. **Option B: Manually trigger transition** (if you have admin access)
3. **Option C: Use the manual phase transition API**

## 🔍 Troubleshooting

### Common Issues

#### "VAPID Key Missing" Error
- Double-check environment variables are set in Vercel
- Ensure `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is set (public key)
- Redeploy after adding environment variables

#### "Service Worker Not Registered" 
- Verify `/sw.js` file is accessible at `https://yoursite.com/sw.js`
- Check browser console for service worker registration errors
- Ensure HTTPS is working (required for service workers)

#### "Permission Denied" 
- User has blocked notifications in browser settings
- Clear browser data and try again
- Check if site is in browser's notification blocklist

#### "Subscription Failed"
- Check browser console for detailed error messages
- Verify VAPID keys match between client and server
- Ensure PostgreSQL database is accessible

### Debug Information

Enable detailed logging by visiting: `https://yoursite.com/?debug`

The debug panel will show:
- Environment status
- Browser support
- Permission state  
- Subscription status
- VAPID key presence
- Ability to test notifications

## 📱 Browser Support

Push notifications work in:
- ✅ Chrome (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile) 
- ✅ Safari (macOS 13+, iOS 16.4+)
- ✅ Edge (Chromium-based)
- ❌ Safari (older versions)
- ❌ iOS Safari (older than 16.4)

## 🔒 Security Notes

- VAPID private key is secret - never expose in client-side code
- VAPID public key is safe to expose (it's in NEXT_PUBLIC_*)
- Push notifications require HTTPS (Vercel provides this automatically)
- Service workers only work on same-origin requests

## 🚨 Monitoring

After deployment, monitor:
- Browser console for service worker errors
- Server logs for push notification sending failures
- Database for push subscription growth
- User feedback about notification delivery

## ⚡ Performance

The push notification system:
- Adds ~2KB to bundle size (service worker + client code)
- Minimal server overhead (only when sending notifications)
- Database queries are optimized with proper indexing
- Automatically cleans up invalid subscriptions

## 🎯 Next Steps

After successful deployment:
1. Monitor notification delivery rates
2. Consider adding 24-hour reminder notifications
3. Add notification preferences (disable specific types)
4. Consider adding rich notification actions
5. Monitor browser support as Safari adoption increases

---

## Quick Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Code pushed to main branch
- [ ] Database migration completed
- [ ] Service worker accessible at /sw.js
- [ ] Debug panel shows all green ✅
- [ ] Test notification received successfully
- [ ] Auto-enable works for new users