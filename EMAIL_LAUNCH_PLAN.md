# Email System Launch Plan

## Current Status: ✅ READY TO TEST

All email infrastructure is complete and production-ready. Email sending is **intentionally disabled** until you approve the templates and are ready to launch.

---

## 🔒 Security Audit: PASSED ✅

### API Key Security
- ✅ API key stored only in `.env.local` (gitignored, never committed)
- ✅ API key referenced via `process.env.RESEND_API_KEY` only
- ✅ No hardcoded keys in any source files
- ✅ Test scripts with API key have been deleted
- ✅ Vercel production environment variables configured

### Code Quality
- ✅ TypeScript compilation: No errors
- ✅ ESLint: No warnings or errors
- ✅ Production build: Successful
- ✅ All email sending code disabled with clear TODO comments

---

## 📧 What's Implemented

### Email Templates (React Email + Dark Theme)

All templates match your app's aesthetic (#000000 background, #3a8e8c brand color):

1. **Password Reset Email** (`src/emails/PasswordReset.tsx`)
   - Secure 1-hour expiring reset link
   - Clear call-to-action button
   - Security message about ignoring if not requested

2. **Email Verification** (`src/emails/VerifyEmail.tsx`)
   - 24-hour expiring verification link
   - Welcome message for new users
   - Call-to-action button

3. **Challenge Started** (`src/emails/ChallengeStarted.tsx`)
   - Challenge text prominently displayed
   - Submission deadline in Pacific Time
   - Direct link to challenge page
   - League name and context

### Infrastructure

- ✅ Resend API integration (`src/lib/email.ts`)
- ✅ Email notification system (`src/lib/emailNotifications.ts`)
- ✅ Database schema (User, EmailPreferences models)
- ✅ API endpoints (forgot-password, reset-password, verify-email)
- ✅ UI pages (forgot password, reset password flows)
- ✅ Cron job integration (automatic challenge notifications)

### What's Disabled

Three specific locations where email sending is commented out:

1. **Sign-in Page** - "Forgot password?" link hidden
2. **Password Reset API** - Email sending disabled
3. **Cron Job** - Challenge notification emails disabled

All other functionality (token generation, database updates, UI flows) still works.

---

## 📋 Phase 1: Test & Review (Current Phase)

### Step 1: Send Test Emails to Eric

I'll create a test script that sends you examples of all three email types:

**Test Emails to Send:**
1. Password reset email
2. Email verification email
3. Challenge started notification email

**What You'll Review:**
- Email subject lines
- Email copy (tone, grammar, clarity)
- Design and formatting
- Mobile responsiveness (check on phone)
- Link functionality
- Brand consistency

**Questions to Answer:**
- Do the emails sound like your brand?
- Is the tone appropriate (friendly but professional)?
- Are the calls-to-action clear?
- Do you want any wording changes?
- Do the emails look good on mobile?

### Step 2: Iterate on Templates

Based on your feedback, I'll:
- Adjust email copy
- Modify subject lines
- Tweak design elements
- Update tone/voice
- Fix any issues

### Step 3: Final Approval

You give the green light to proceed to Phase 2.

---

## 📋 Phase 2: Enable Core Emails

### Step 1: Enable Password Reset

**Why Start Here:**
- Critical user-facing feature (account recovery)
- Low volume (only sent when requested)
- Easy to test and verify
- Immediate value to users

**What to Enable:**
1. Uncomment "Forgot password?" link in sign-in page
2. Uncomment email sending in forgot-password API
3. Test the complete flow:
   - Click "Forgot password?"
   - Enter email
   - Receive email
   - Click link
   - Reset password
   - Sign in with new password

**Deployment:**
```bash
git add .
git commit -m "Enable password reset emails"
git push
```

**Rollback Plan:**
If issues arise, simply re-comment the code and redeploy.

### Step 2: Enable Challenge Notifications

**Why Second:**
- Adds value to user engagement
- Automated (no manual triggering)
- Tests cron job integration
- Higher volume than password resets

**What to Enable:**
1. Uncomment challenge email sending in cron job
2. Monitor first automated send via Resend dashboard
3. Check that emails respect user preferences
4. Verify timing and content

**Testing:**
- Watch for next challenge activation
- Verify emails sent to all league members
- Check that opted-out users don't receive emails
- Monitor Resend logs for delivery status

**Deployment:**
```bash
git add .
git commit -m "Enable challenge notification emails"
git push
```

---

## 📋 Phase 3: Email Preferences UI

### Why Important:
- User control over notifications
- GDPR/CAN-SPAM compliance
- Better user experience
- Reduces spam complaints

### What to Build:

**New Page:** `/app/profile/email-preferences`

**Features:**
- Toggle switches for each email type:
  - ✉️ Challenge Started (default: ON)
  - 🗳️ Voting Started (default: ON)
  - 🏆 Results Ready (default: ON)
  - 📊 Weekly Digest (default: OFF)
- Save preferences to database
- Clear descriptions for each type
- Instant feedback when saved

**Technical:**
- Read current preferences from `EmailPreferences` model
- Update via API endpoint: `/api/user/email-preferences`
- Use optimistic updates with React Query
- Show success/error messages

**Estimated Time:** 2-3 hours

---

## 📋 Phase 4: Email Verification on Signup (Optional)

### Why Optional:
- Not required to use the app
- Prevents spam signups
- Validates email addresses
- Enables safe email sending

### What to Build:

**Signup Flow Update:**
1. User creates account
2. Immediately send verification email
3. Show "Verify your email" banner in app
4. User clicks email link → Email verified
5. Banner disappears

**Technical:**
- Add email sending to signup API
- Create verification banner component
- Handle verification redirect
- Update email preferences to only send to verified users (optional)

**Estimated Time:** 2-3 hours

---

## 📋 Phase 5: Additional Email Types (Future)

### Voting Started Email
When challenge moves from ACTIVE → VOTING phase

**Template:** `VotingStarted.tsx`
**Trigger:** Cron job when voting phase begins
**Content:**
- Challenge that just closed
- Number of submissions
- Voting deadline
- Your votes remaining
- Link to voting page

### Results Ready Email
When challenge moves from VOTING → COMPLETED

**Template:** `ResultsReady.tsx`
**Trigger:** Cron job when results are calculated
**Content:**
- Challenge title
- Winner announcement
- Your placement (if participated)
- Link to full results
- Next challenge preview

### Weekly Digest Email
Summary of league activity

**Template:** `WeeklyDigest.tsx`
**Trigger:** Cron job every Sunday at 10am PT
**Content:**
- Active challenges this week
- Recent winners
- League leaderboard snapshot
- Upcoming challenges
- Personalized stats

---

## 🚀 Deployment Strategy

### Pre-Launch Checklist:
- [ ] Domain verified in Resend (challenge-league.app)
- [ ] Environment variables set in Vercel production
- [ ] Test emails sent and approved
- [ ] Email templates finalized
- [ ] Code reviewed and tested

### Launch Sequence:
1. **Soft Launch:** Enable for small test group first
2. **Monitor:** Watch Resend dashboard for delivery rates
3. **Iterate:** Fix any issues quickly
4. **Full Launch:** Enable for all users
5. **Monitor:** Track open rates, click rates, unsubscribes

### Success Metrics:
- Delivery rate > 95%
- Open rate > 20%
- Click-through rate > 5%
- Unsubscribe rate < 1%
- Spam complaints < 0.1%

### Monitoring:
- **Resend Dashboard:** Real-time delivery status
- **Server Logs:** Email sending attempts
- **User Feedback:** Monitor support requests
- **Analytics:** Track email engagement

---

## 🔧 Quick Reference: How to Re-Enable Emails

### 1. Forgot Password Link
**File:** `src/app/app/auth/signin/page.tsx`
**Lines:** 100-106
**Action:** Uncomment the `<Link>` component

### 2. Password Reset Email
**File:** `src/app/api/auth/forgot-password/route.ts`
**Lines:** 54-68
**Action:** Uncomment the `sendEmail()` call

### 3. Challenge Notification Emails
**File:** `src/lib/promptQueue.ts`
**Lines:** 552-563
**Action:** Uncomment the `sendChallengeStartedEmails()` call

Each location has a clear TODO comment: `// TODO: Re-enable when email system is launched`

---

## 📊 Next Immediate Steps

### What Eric Needs to Do:

1. **Review This Document** ✓
2. **Request Test Emails** - Let me know when ready, I'll send test versions of all three email types
3. **Approve/Request Changes** - Review test emails and provide feedback
4. **Decide on Launch Timeline** - When do you want to enable emails?

### What I'll Do Next:

1. **Create Test Email Script** - Send you samples of all email templates
2. **Make Any Requested Changes** - Update templates based on your feedback
3. **Provide Step-by-Step Enable Instructions** - When you're ready to launch
4. **Build Email Preferences UI** - If you want this before launch

---

## ❓ Questions?

**Q: Can I test password reset without actually sending emails?**
A: Yes! Check server logs - they'll show "Password reset email would be sent to: [email]"

**Q: What if I want to change email copy after launch?**
A: Edit the React Email templates, test locally, then deploy. Changes take effect immediately.

**Q: How do I preview emails during development?**
A: Run `npx email dev` to open a browser preview of all templates

**Q: What happens if Resend is down?**
A: Emails fail gracefully - app functionality continues, just without email delivery. Errors are logged.

**Q: Can I use a different email provider later?**
A: Yes! The `sendEmail()` function abstracts the provider. Just update `src/lib/email.ts`.

---

**Ready to proceed?** Let me know when you want test emails sent! 🚀
