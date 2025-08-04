# Deployment Guide - Challenge League

This guide will walk you through deploying Challenge League's creative competition platform for the first time. Since we use SQLite for the database, deployment is much simpler than typical web apps!

## Prerequisites

- GitHub account (for code hosting)
- Vercel account (for app hosting) - sign up at [vercel.com](https://vercel.com)

**Note:** You do NOT need any external database service (like Neon, PlanetScale, etc.) since we use SQLite!

## Step 1: Prepare Your Code for Deployment

### 1.1 Database Configuration

Your Prisma schema is configured for SQLite:

```prisma
// prisma/schema.prisma:
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

This works perfectly for both development and production. SQLite is ideal for Challenge League because:
- Low write frequency (weekly submissions)
- Mostly read operations (viewing galleries, leaderboards)  
- Simple deployment (no external database needed)
- Fast performance for your use case
- Zero database hosting costs

### 1.2 Verify Environment Variables

Your `.env.example` is already set up correctly:

```bash
# Local development
DATABASE_URL="file:./dev.db"

# Production (same concept, different file location)
DATABASE_URL="file:./prod.db"
```

### 1.3 Commit Your Code to GitHub

```bash
# If you haven't initialized git yet:
git init

# Add all files
git add .

# Commit your changes
git commit -m "Prepare Challenge League for deployment with SQLite"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/challenge-league.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Next.js project

### 2.2 Generate Security Secrets

First, generate secure secrets for your deployment:

```bash
# Generate NEXTAUTH_SECRET (32+ characters)
openssl rand -hex 32

# Generate CRON_SECRET (32+ characters)  
openssl rand -hex 32
```

### 2.3 Configure Environment Variables

Before deploying, add these environment variables in Vercel:

1. In the Vercel project setup, go to "Environment Variables"
2. Add each of these (using your generated secrets):

```bash
# Database (SQLite file in production)
DATABASE_URL=file:./prod.db

# NextAuth (generate your own secrets)
NEXTAUTH_SECRET=your-nextauth-secret-at-least-32-chars-long
NEXTAUTH_URL=https://your-app-name.vercel.app

# Cron Security (generate your own secret)
CRON_SECRET=your-cron-secret-for-secure-endpoint-access

# Vercel Blob (for photo uploads - OPTIONAL, app works without this)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token_here
```

**Important Notes:**
- `DATABASE_URL`: Uses `file:./prod.db` - Vercel will create this SQLite file automatically
- `NEXTAUTH_SECRET`: Use the generated secret from earlier
- `NEXTAUTH_URL`: Will be your actual Vercel URL (update after first deploy)
- `CRON_SECRET`: Use the generated secret from earlier
- `BLOB_READ_WRITE_TOKEN`: **OPTIONAL** - App will work without it, using serverless-compatible file handling

### 2.4 Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete (2-5 minutes)
3. The SQLite database will be created automatically on first run

### 2.5 Initialize Database with Seed Data

After successful deployment, you need to run the database migration and seed:

**Using Vercel CLI (Recommended):**
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Run database setup on production
vercel env pull .env.production
npx dotenv -e .env.production -- npx prisma db push
npx dotenv -e .env.production -- npm run db:seed
```

This will:
- Create the SQLite database file (`prod.db`)
- Set up all tables and relationships
- Add the 6 test players and Main League
- Add sample challenges for immediate testing

## Step 3: Set Up Photo Uploads

**Important:** Photo uploads work automatically without any additional setup! The app intelligently handles file storage:
- **Without Blob Storage**: Uses serverless-compatible file handling (works perfectly)
- **With Blob Storage**: Optionally use Vercel Blob for external file storage

### 3.1 Option A: Default Setup (Recommended)

Your app works immediately with built-in photo handling. **No additional setup required!**

### 3.2 Option B: Optional Vercel Blob Storage

If you want to use external blob storage:

1. Go to your Vercel dashboard
2. Navigate to "Storage" tab  
3. Click "Create Database" → "Blob"
4. Name it "challenge-league-uploads"
5. Click "Create"
6. Get the access token from Settings → Access Tokens
7. Add to environment variables:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token_here
   ```
8. Redeploy your application

## Step 4: Update URLs and Test

### 4.1 Update NEXTAUTH_URL

1. Copy your Vercel app URL (something like `https://challenge-league-abc123.vercel.app`)
2. Go to Vercel project settings → Environment Variables
3. Update `NEXTAUTH_URL` to your actual URL
4. Redeploy the app

### 4.2 Test Your Deployment

1. Visit your deployed app
2. Test competition features:
   - Create a new account or use test credentials (player1@example.com / password123)
   - Verify auto-assignment to Main League
   - Check league dashboard with tabs (Overview, Voting, Results, Leaderboard)
   - Test photo submission to active challenges
   - Test voting interface (if in voting phase)

### 4.3 Verify Database

Your SQLite database is working if:
- You can register new users
- Test accounts can log in
- League data displays properly
- Photo uploads work (after Blob storage is configured)

## Step 5: Set Up Automated Competition Cycles

### 5.1 Verify Cron Configuration

Your `vercel.json` is already configured:

```json
{
  "crons": [
    {
      "path": "/api/cron/prompt-cycle",
      "schedule": "0 12 * * *"
    }
  ]
}
```

This runs daily at noon UTC to check and transition competition phases.

### 5.2 Verify Cron Functionality

1. In Vercel dashboard, go to "Functions" tab
2. Check "Cron Functions" section
3. Verify the `/api/cron/prompt-cycle` function is listed
4. Monitor the function logs for successful executions

### 5.3 Manual Cycle Testing

You can manually trigger cycle processing:

1. Sign in as admin (player1@example.com / password123)
2. Go to `/admin`
3. Use "Process Queue Now" button to test transitions

## Step 6: Set Up Custom Domain (Optional)

### 6.1 Purchase Domain

Buy a domain from any registrar (Namecheap, GoDaddy, etc.)

### 6.2 Configure in Vercel

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow the DNS setup instructions
4. Update `NEXTAUTH_URL` environment variable to your custom domain

## SQLite Database Management

### Advantages of SQLite for Challenge League

✅ **Zero maintenance** - No database server to manage
✅ **Zero cost** - No database hosting fees
✅ **Perfect performance** - SQLite is extremely fast for your use case
✅ **Simple backups** - Database is just a file
✅ **No connection limits** - No concurrent connection issues
✅ **Serverless friendly** - Works perfectly with Vercel's serverless functions

### Database Persistence

**Important:** Vercel's serverless environment is stateless, but your SQLite database will persist because:
- Database file is created in the persistent storage area
- Vercel maintains the file across function invocations
- Data survives deployments and restarts

### Backup Strategy

Since your database is a single file, backups are simple:

1. **Automatic Vercel backups** - Vercel maintains your deployment artifacts
2. **Manual backups** - Use Vercel CLI to download the database file periodically
3. **Export data** - Create admin endpoints to export/import league data if needed

## What You No Longer Need

Since you're using SQLite, you can:

✅ **Delete your Neon database** - No longer needed
✅ **Remove PostgreSQL references** - From any local setup
✅ **Simplify environment variables** - No complex database URLs
✅ **Skip database hosting costs** - SQLite is free

## Common Issues and Solutions

### Issue: "Database not found"
**Solution**: Make sure `DATABASE_URL=file:./prod.db` is set in Vercel environment variables.

### Issue: "No data after deployment"
**Solution**: Run the database seed command using Vercel CLI as shown in Step 2.4.

### Issue: "Build fails"
**Solution**: Check that `prisma generate` runs properly in the build process.

## Environment Summary

You'll now have:
- **Local Development**: SQLite database (`dev.db`) with seeded competition data
- **Production**: SQLite database (`prod.db`) on Vercel with automated cycles
- **Version Control**: Code on GitHub
- **Domain**: Custom domain (optional) or Vercel subdomain
- **Automation**: Cron jobs managing competition phase transitions daily
- **Admin Interface**: Challenge management at `/admin`
- **File Storage**: Intelligent photo handling (works with or without Vercel Blob)
- **Database**: Simple, fast SQLite - no external services needed

## Test User Accounts

After running database seed, choose from these accounts:

### Basic Seed (`npm run db:seed`)
- **Admin**: player1@example.com / password123
- **Users**: player2@example.com through player6@example.com / password123

### Large Seed (`npx tsx prisma/seed-large.ts`)
- **Admin**: photophoenix@example.com / password123  
- **Users**: craftycaptain@example.com, pixelpioneer@example.com, etc. / password123

Congratulations! Your Challenge League is now deployed with a simple, efficient SQLite setup! 🏆

## Benefits of This Approach

🚀 **Simpler deployment** - No database setup needed
💰 **Cost effective** - No database hosting fees
⚡ **Better performance** - SQLite is incredibly fast for reads
🔧 **Easier maintenance** - No database server to manage
📦 **Portable** - Entire database is just one file