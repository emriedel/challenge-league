# Deployment Guide - Challenge League

This guide will walk you through deploying Challenge League's creative competition platform for the first time, including setting up PostgreSQL database, automated cycle management, and cron jobs.

## Prerequisites

- GitHub account (for code hosting)
- Vercel account (for app hosting) - sign up at [vercel.com](https://vercel.com)
- Neon account (for PostgreSQL database) - sign up at [neon.tech](https://neon.tech)

## Step 1: Prepare Your Code for Deployment

### 1.1 Update Database Configuration for Production

Your Prisma schema is currently configured for SQLite development. For production, we'll use environment variables to switch to PostgreSQL:

```prisma
// prisma/schema.prisma already has:
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

The provider will be overridden by the DATABASE_URL format in production.

### 1.2 Verify Environment Variables Template

Your `.env.example` is already set up correctly. Key variables you'll need:

```bash
# Production Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@host.neon.tech/dbname?sslmode=require"

# NextAuth.js
NEXTAUTH_SECRET="super-long-random-secret-key-at-least-32-characters"
NEXTAUTH_URL="https://your-app-name.vercel.app"

# Vercel Blob for photo uploads
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_your_token_here"

# Cron job security
CRON_SECRET="your-random-cron-secret-here"
```

### 1.3 Commit Your Code to GitHub

```bash
# If you haven't initialized git yet:
git init

# Add all files
git add .

# Commit your changes
git commit -m "Prepare Challenge League for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/challenge-league.git
git branch -M main
git push -u origin main
```

## Step 2: Set Up PostgreSQL Database (Neon)

### 2.1 Create Neon Account and Database

1. Go to [neon.tech](https://neon.tech) and sign up
2. Click "Create a project"
3. Choose:
   - **Name**: `challenge-league-production`
   - **PostgreSQL Version**: Latest (default)
   - **Region**: Choose closest to your users
4. Click "Create Project"

### 2.2 Get Database Connection String

1. In your Neon dashboard, click on your project
2. Go to "Connection Details"
3. Copy the connection string that looks like:
   ```
   postgresql://username:password@host.neon.tech/dbname?sslmode=require
   ```
4. Save this - you'll need it for Vercel

### 2.3 Test Database Connection (Optional)

If you want to test the production database locally:

```bash
# Create a temporary .env.production file
echo 'DATABASE_URL="your-neon-connection-string-here"' > .env.production

# Test the connection
npx dotenv -e .env.production -- npx prisma db push

# If successful, clean up
rm .env.production
```

## Step 3: Deploy to Vercel

### 3.1 Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Next.js project

### 3.2 Configure Environment Variables

Before deploying, add these environment variables in Vercel:

1. In the Vercel project setup, go to "Environment Variables"
2. Add each of these:

```bash
# Database
DATABASE_URL=your-neon-postgresql-connection-string

# NextAuth
NEXTAUTH_SECRET=your-super-secret-key-here-make-it-long-and-random
NEXTAUTH_URL=https://your-app-name.vercel.app

# Vercel Blob (required for photo uploads)
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# Cron Security (required for automated competition cycles)
CRON_SECRET=your-random-cron-secret-here
```

**Important Notes:**
- `NEXTAUTH_SECRET`: Generate a random string at least 32 characters long
- `NEXTAUTH_URL`: Will be your actual Vercel URL (you can update this after first deploy)
- `DATABASE_URL`: The PostgreSQL connection string from Neon
- `CRON_SECRET`: Generate a random secret for cron job security (competition cycle automation)

### 3.3 Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete (2-5 minutes)
3. If it fails, check the build logs and fix any errors

### 3.4 Run Database Migrations

After successful deployment:

1. Go to your Vercel project dashboard
2. Click on "Functions" tab
3. We need to run migrations. You have two options:

**Option A: Use Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Run migrations and seed competition data on production
vercel env pull .env.production
npx dotenv -e .env.production -- npx prisma db push
npx dotenv -e .env.production -- npm run db:seed
```

**Option B: Add Migration to Build Process**
Add this to your `package.json` scripts temporarily:
```json
{
  "scripts": {
    "build": "prisma generate && prisma db push && next build"
  }
}
```
Then redeploy and revert the change.

## Step 4: Set Up Vercel Blob Storage (Required for Photo Uploads)

### 4.1 Create Blob Store

1. Go to your Vercel dashboard
2. Navigate to "Storage" tab
3. Click "Create Database" → "Blob"
4. Name it "challenge-league-uploads"
5. Click "Create"

### 4.2 Get Access Token

1. After creating the Blob store, click on it
2. Go to the "Settings" tab
3. Find the "Access Tokens" section
4. Copy the `BLOB_READ_WRITE_TOKEN`

### 4.3 Add to Environment Variables

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add or update:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token_here
   ```
4. Redeploy your application

## Step 5: Update URLs and Test

### 5.1 Update NEXTAUTH_URL

1. Copy your Vercel app URL (something like `https://challenge-league-abc123.vercel.app`)
2. Go to Vercel project settings → Environment Variables
3. Update `NEXTAUTH_URL` to your actual URL
4. Redeploy the app

### 5.2 Test Your Deployment

1. Visit your deployed app
2. Test competition features:
   - Create a new account or use test credentials (player1@example.com / password123)
   - Verify auto-assignment to Main League
   - Check league dashboard with tabs (Overview, Voting, Results, Leaderboard)
   - Test photo submission to active challenges
   - Test voting interface (if in voting phase)
3. Check the database:
   - Go to Neon dashboard
   - Use the SQL Editor to run: `SELECT * FROM "User";` and `SELECT * FROM "League";`
   - You should see test users and the Main League

## Step 6: Set Up Automated Competition Cycles

### 6.1 Verify Cron Configuration

Your `vercel.json` is already configured:

```json
{
  "crons": [
    {
      "path": "/api/cron/prompt-cycle",
      "schedule": "0 */24 * * *"
    }
  ]
}
```

This runs every 24 hours to check and transition competition phases.

### 6.2 Verify Cron Functionality

1. In Vercel dashboard, go to "Functions" tab
2. Check "Cron Functions" section
3. Verify the `/api/cron/prompt-cycle` function is listed
4. Monitor the function logs for successful executions

### 6.3 Manual Cycle Testing

You can manually trigger cycle processing:

1. Sign in as admin (player1@example.com / password123)
2. Go to `/admin`
3. Use "Process Queue Now" button to test transitions
4. Check console logs for detailed processing information

## Step 7: Set Up Custom Domain (Optional)

### 7.1 Purchase Domain

Buy a domain from any registrar (Namecheap, GoDaddy, etc.)

### 7.2 Configure in Vercel

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow the DNS setup instructions
4. Update `NEXTAUTH_URL` environment variable to your custom domain

## Common Issues and Solutions

### Issue: "Invalid database URL"
**Solution**: Check your DATABASE_URL format. It should include `?sslmode=require` for Neon.

### Issue: "NextAuth configuration error"
**Solution**: Make sure NEXTAUTH_SECRET is set and NEXTAUTH_URL matches your domain exactly.

### Issue: "Build fails on Vercel"
**Solution**: 
1. Check build logs for specific errors
2. Make sure all environment variables are set
3. Test build locally with: `npm run build`

### Issue: "Database connection fails"
**Solution**: 
1. Verify your Neon database is active (not suspended)
2. Check that the connection string is correct
3. Ensure your Neon project has connection permissions

### Issue: "Photo upload fails"
**Solution**:
1. Verify BLOB_READ_WRITE_TOKEN is set correctly
2. Check Vercel Blob storage is created and accessible
3. Test locally with the same token

## Monitoring and Maintenance

### Database Management
- Neon provides a dashboard to monitor your database
- Free tier includes 512MB storage and 100 hours of compute per month
- Set up billing alerts if needed

### Application Monitoring
- Vercel provides analytics and performance monitoring
- Check the "Analytics" tab in your project dashboard
- Monitor cron job executions in the Functions tab

### Backup Strategy
- Neon automatically backs up your database
- Consider exporting data periodically for extra safety
- Document your environment variables securely

## Next Steps

After successful deployment:

1. **Test thoroughly** - Create multiple accounts, test competition flows, voting, and leaderboards
2. **Monitor competition cycles** - Verify automated phase transitions work correctly
3. **Set up monitoring** - Configure error tracking and uptime monitoring for cron jobs
4. **Plan updates** - Set up a development/staging environment for testing changes
5. **Scale considerations** - Monitor usage and upgrade database/hosting as needed
6. **Admin management** - Use admin panel to create diverse creative challenges

## Environment Summary

You'll now have:
- **Local Development**: SQLite database (`dev.db`) with seeded competition data
- **Production**: PostgreSQL on Neon + Next.js app on Vercel with automated cycles
- **Version Control**: Code on GitHub
- **Domain**: Custom domain (optional) or Vercel subdomain
- **Automation**: Cron jobs managing competition phase transitions every 12 hours
- **Admin Interface**: Challenge management at `/admin`
- **File Storage**: Vercel Blob for photo uploads

## Test User Accounts

The seeded database includes these test accounts:
- **Admin**: player1@example.com / password123
- **Users**: player2@example.com through player6@example.com / password123

Congratulations! Your Challenge League competition platform is now deployed and ready for creative challenges! 🏆