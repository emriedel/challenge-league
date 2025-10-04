# Email System Setup Guide

## Overview

Your Challenge League app now has a complete email system powered by Resend! This guide will walk you through the setup process.

## What's Been Implemented

✅ **Password Reset Flow**
- "Forgot Password?" link on sign-in page
- Secure token-based reset (1-hour expiration)
- Beautiful email template with dark theme
- Complete user flow from request to password change

✅ **Email Verification System** (optional)
- Verification tokens with 24-hour expiration
- Database schema to track verification status
- Email template ready to use

✅ **Challenge Notifications**
- Automatic emails when new challenges start
- Integrated into cron job system
- Respects user email preferences
- Includes challenge details and deadline

✅ **Email Preferences**
- Database model for user notification settings
- Default settings: challenge notifications ON
- Ready for UI implementation

## Setup Instructions

### Step 1: Sign Up for Resend

1. Go to [resend.com](https://resend.com)
2. Click "Sign Up" (it's free!)
3. Verify your email address

### Step 2: Add and Verify Your Domain

1. In Resend dashboard, click "Domains" → "Add Domain"
2. Enter your domain: `challenge-league.app`
3. Add the DNS records shown to your domain provider:
   - **MX Record**: For receiving email bounces
   - **TXT Records**: For SPF, DKIM authentication

**Example DNS Records:**
```
Type: MX
Name: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10

Type: TXT
Name: @
Value: "v=spf1 include:amazonses.com ~all"

Type: TXT
Name: resend._domainkey
Value: [Your DKIM key from Resend]
```

4. Wait for verification (usually 5-15 minutes)
5. Once verified, you'll see a green checkmark ✓

### Step 3: Get Your API Key

1. In Resend dashboard, click "API Keys"
2. Click "Create API Key"
3. Name it: `Challenge League Production`
4. Select permission: `Sending access`
5. Click "Create"
6. **IMPORTANT**: Copy the API key (starts with `re_`)
   - You'll only see this once!
   - Keep it secure - it's like a password

### Step 4: Update Environment Variables

#### Local Development (`.env.local`)

The file already has placeholders. Update this line:
```bash
RESEND_API_KEY="re_your_actual_api_key_here"
```

For testing locally, you can also update:
```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
FROM_EMAIL="noreply@challenge-league.app"
```

#### Production (Vercel)

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:

```bash
RESEND_API_KEY=re_your_actual_api_key_here
FROM_EMAIL=noreply@challenge-league.app
NEXT_PUBLIC_APP_URL=https://challenge-league.app
```

5. Make sure to check "Production", "Preview", and "Development"
6. Click "Save"

### Step 5: Deploy

Since you have automated CI/CD, just push to deploy:

```bash
git add .
git commit -m "Add email system with Resend"
git push
```

The migration will run automatically and your email system will be live!

## Testing the Email System

### Test Password Reset (Local)

1. Start your dev server: `npm run dev`
2. Go to `http://localhost:3000/app/auth/signin`
3. Click "Forgot password?"
4. Enter an email address from your test data
5. Check the email inbox (or Resend logs if testing)

### Test Challenge Notifications

1. Create a new league with prompts
2. Manually trigger the cron job:
   ```bash
   curl -X POST http://localhost:3000/api/cron/prompt-cycle \
     -H "Authorization: Bearer development-cron-secret-key-32-chars-minimum-replace-in-production"
   ```
3. Check email inboxes for league members

### Monitor Email Delivery

Resend provides excellent logging:
1. Go to Resend dashboard → Logs
2. See all sent emails, delivery status, and opens
3. Debug any issues with detailed error messages

## Email Templates

All email templates are in `/src/emails/` with dark theme matching your app:

- `PasswordReset.tsx` - Password reset emails
- `VerifyEmail.tsx` - Email verification
- `ChallengeStarted.tsx` - New challenge notifications

You can preview and customize them locally by running:
```bash
npx email dev
```

This opens a browser with live preview of all your email templates!

## Email Preferences (Future)

The database is ready for email preferences, but the UI isn't built yet. To add:

1. Create a settings page at `/app/profile/email-preferences`
2. Show toggles for each notification type
3. Update `EmailPreferences` model via API
4. Users can control what emails they receive

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Make sure it starts with `re_` and is correct
2. **Check Domain**: Must be verified in Resend dashboard
3. **Check Logs**: Look at Resend dashboard → Logs for errors
4. **Check Environment Variables**: Confirm they're set in production

### Emails Going to Spam

1. **Verify DNS Records**: All SPF, DKIM, DMARC records must be correct
2. **Warm Up Domain**: Resend handles this automatically
3. **Check Content**: Avoid spam trigger words
4. **Test Score**: Use [mail-tester.com](https://www.mail-tester.com)

### Local Development

For local development, you can use Resend's sandbox mode:
- Emails only go to verified addresses (your email)
- Perfect for testing without spamming users
- All other functionality works the same

## Free Tier Limits

Resend's free tier includes:
- **3,000 emails per month**
- **100 emails per day**
- All features (no restrictions)

For Challenge League, this should be plenty to start:
- ~100 users × ~4 challenge notifications/month = 400 emails
- Plus password resets and other transactional emails
- Well within free tier!

## Upgrade When Needed

When you exceed free tier:
- **$20/month** for 50,000 emails
- Pay-as-you-go after that
- Very reasonable pricing

## Support

- **Resend Docs**: [resend.com/docs](https://resend.com/docs)
- **React Email Docs**: [react.email](https://react.email)
- **Email Templates**: See `/src/emails/` in your codebase

## What's Next?

Optional enhancements you can add:

1. **Email Verification on Signup**
   - Send verification email when user registers
   - Show "verify your email" banner in app
   - Only send notifications to verified emails

2. **Email Preferences UI**
   - Let users control what emails they receive
   - Toggle for each notification type
   - Unsubscribe links in emails

3. **More Email Types**
   - Voting started notifications
   - Results ready notifications
   - Weekly digest emails

4. **Email Analytics**
   - Track open rates
   - Track click rates
   - Use Resend's analytics API

---

**You're all set!** Once you add your Resend API key and deploy, your email system will be fully operational. 🎉
