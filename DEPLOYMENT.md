# Deployment Guide - Challenge League

This guide covers deploying Challenge League with proper Prisma-compliant database management using SQLite for development and PostgreSQL for production.

## Database Strategy

- **Local Development**: SQLite (zero setup, fast, perfect for development)
- **Production**: PostgreSQL (persistent, reliable, cloud-ready)

## Prerequisites

- GitHub account (for code hosting)
- Vercel account (for app hosting) - sign up at [vercel.com](https://vercel.com)

## Step 1: Prepare Your Code for Deployment

### 1.1 Local Development Setup

**For development, reset your local database:**

```bash
# Reset and seed your local database (SQLite)
npm run db reset development --force
```

This creates a local SQLite database (`dev.db`) with test data.

### 1.2 Commit Your Code to GitHub

```bash
# Add all files
git add .

# Commit your changes
git commit -m "Prepare Challenge League for production deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/challenge-league.git
git branch -M main
git push -u origin main
```

## Step 2: Set Up Vercel Postgres Database

### 2.1 Create Vercel Postgres Database

1. Go to [vercel.com](https://vercel.com) and log in
2. Go to your dashboard
3. Click "Storage" tab
4. Click "Create Database" → "Postgres"
5. Name it "challenge-league-db"
6. Select your region
7. Click "Create"

### 2.2 Get Database Connection String

1. After creating the database, click on it
2. Go to ".env.local" tab
3. Copy the `POSTGRES_URL` value (this is your `DATABASE_URL`)

## Step 3: Deploy to Vercel

### 3.1 Connect GitHub to Vercel

1. Back in Vercel dashboard, click "New Project"
2. Import your GitHub repository
3. Vercel will auto-detect it's a Next.js project

### 3.2 Generate Security Secrets

Generate secure secrets for your deployment:

```bash
# Generate NEXTAUTH_SECRET (32+ characters)
openssl rand -hex 32

# Generate CRON_SECRET (32+ characters)  
openssl rand -hex 32
```

### 3.3 Configure Environment Variables

In the Vercel project setup, go to "Environment Variables" and add:

```bash
# Database (PostgreSQL from Step 2.2)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# NextAuth (use generated secret from Step 3.2)
NEXTAUTH_SECRET=your-generated-nextauth-secret-here
NEXTAUTH_URL=https://your-app-name.vercel.app

# Cron Security (use generated secret from Step 3.2)
CRON_SECRET=your-generated-cron-secret-here

# Vercel Blob (OPTIONAL - app works without this)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token_here
```

**Important Notes:**
- `DATABASE_URL`: Use the PostgreSQL connection string from Step 2.2
- `NEXTAUTH_SECRET`: Use the generated secret from Step 3.2
- `NEXTAUTH_URL`: Will be your actual Vercel URL (update after first deploy)
- `CRON_SECRET`: Use the generated secret from Step 3.2
- `BLOB_READ_WRITE_TOKEN`: **OPTIONAL** - App will work without it

### 3.4 Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete (3-5 minutes)
3. The app will be deployed but database needs initialization

## Step 4: Initialize Production Database

**For first-time production setup:**

```bash
# Install Vercel CLI if you haven't
npm i -g vercel && vercel login && vercel link

# Pull production environment variables
vercel env pull .env.production

# Check database status
npm run db status production

# Initialize production database with schema and test data
npm run db migrate production --force
npm run db seed production --force
```

🛡️ **Safety System**: Our Prisma-compliant database manager prevents accidental production access and requires explicit `--force` flags for destructive operations.

## Step 5: Set Up Photo Uploads (Optional)

### 5.1 Option A: Default Setup (Recommended)

Your app works immediately with built-in photo handling. **No additional setup required!**

### 5.2 Option B: Vercel Blob Storage

If you want external blob storage:

1. Go to Vercel Dashboard → Storage → Create Database → Blob
2. Name it "challenge-league-uploads"
3. Get the access token from Settings → Access Tokens
4. Add to environment variables:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token_here
   ```
5. Redeploy your application

## Step 6: Final Configuration

### 6.1 Update NEXTAUTH_URL

1. Copy your Vercel app URL (something like `https://challenge-league-abc123.vercel.app`)
2. Go to Vercel project settings → Environment Variables
3. Update `NEXTAUTH_URL` to your actual URL
4. Redeploy the app

### 6.2 Test Your Deployment

1. Visit your deployed app
2. Test competition features:
   - Create a new account or use test credentials
   - Verify auto-assignment to Main League
   - Check league dashboard functionality
   - Test photo submission and voting

## Step 7: Set Up Automated Competition Cycles

### 7.1 Verify Cron Configuration

Your `vercel.json` is already configured for automatic competition management:

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

This runs daily at noon UTC to manage competition phases.

## Database Management - Prisma Best Practices

Following official Prisma documentation: https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production

### Local Development Commands

```bash
# Start development server
npm run dev

# Reset local database (SQLite) - removes all data and reseeds
npm run db reset development --force

# Seed local database with test data
npm run db seed development

# Open database browser for local database
npm run db studio development

# Create new migration during development
npx prisma migrate dev --name your-feature-description

# Generate Prisma client
npm run db generate development
```

### Production Database Commands

```bash
# Check migration status (always run first)
npm run db status production

# Apply pending migrations to production (RECOMMENDED for schema changes)
npm run db migrate production --force

# Seed production with test data (DESTRUCTIVE - use with caution)
npm run db seed production --force

# Open database browser for production (be careful!)
npm run db studio production

# Generate Prisma client for production schema
npm run db generate production

# Get help with all available commands
npm run db help
```

### Schema Change Workflow

When you make changes to `prisma/schema.prisma` or `prisma/schema.production.prisma`:

#### Step 1: Develop and Test Locally

```bash
# Make your schema changes in prisma/schema.prisma

# Create and apply migration locally
npx prisma migrate dev --name describe-your-change

# Test your changes locally
npm run dev
```

#### Step 2: Deploy Code Changes

```bash
# Commit your changes (including migration files)
git add .
git commit -m "Add new database feature: describe-your-change"

# Push to GitHub (triggers Vercel deployment)
git push
```

#### Step 3: Apply Database Changes to Production

```bash
# Check what migrations are pending
npm run db status production

# Apply the new migrations to production database
npm run db migrate production --force
```

### Safety Features

**What `prisma migrate deploy` does:**
- ✅ **Only applies new migrations** - Never modifies existing data
- ✅ **Atomic operations** - All migrations succeed or all fail
- ✅ **Migration locking** - Prevents concurrent migrations
- ✅ **Rollback protection** - Warns if migrations were modified

**What it does NOT do:**
- ❌ Never resets or drops existing data
- ❌ Never applies schema drift fixes  
- ❌ Never modifies previously applied migrations

## Common Issues and Solutions

### Issue: "Database schema mismatch after code changes"

Your code expects the new schema, but production database hasn't been updated yet.

**Solution**: Apply the pending migration:
```bash
npm run db migrate production --force
```

### Issue: "Local database problems or migration errors"  

**Solution**: Reset your local environment:
```bash
npm run db reset development --force
```

### Issue: "Build fails with Prisma error"

**Solution**: Make sure you've committed your migration files and the Prisma client is generated:
```bash
npx prisma generate
npm run build
```

### Issue: "Cannot connect to database in production"

**Solution**: Verify your PostgreSQL `DATABASE_URL` is correct in Vercel environment variables.

### Issue: "Photos not uploading"

**Solution**: The app works without Blob storage. If you want external storage, set up Vercel Blob as described in Step 5.

### Issue: "Migration fails with data loss warning"

**Solution**: Prisma is protecting your data. Review the migration carefully and ensure you understand what data changes will occur.

## Test User Accounts

The database seed creates test users across leagues with competition history:

**Primary Test Accounts:**
- **Main League Users**: player1@example.com, player2@example.com, etc.
- **All passwords**: `password123`

**Features Included:**
- Test leagues with different themes
- Completed competition rounds with voting history  
- Active rounds with submissions
- Scheduled future rounds

## Deployment Safety Summary

### ✅ Always Safe Operations

These commands never modify your production data:

```bash
git push                           # Deploys code changes only
npm run db status production       # Check migration status
npm run db studio production       # Browse database (read-only intent)
npm run db generate production     # Generate Prisma client
npm run dev                       # Local development
```

### ⚠️ Production Operations (Require --force)

These commands can modify production data and require explicit confirmation:

```bash
# Safe migration deployment (recommended)
npm run db migrate production --force

# Destructive operations (use with extreme caution)
npm run db reset production --force     # Wipes entire database
npm run db seed production --force      # May overwrite user data
```

### 📋 Complete Schema Change Workflow

1. **Make schema changes** in `prisma/schema.prisma`
2. **Test locally**: `npx prisma migrate dev --name your-change`
3. **Commit and deploy**: `git push`
4. **Apply to production**: `npm run db migrate production --force`
5. **Verify success**: `npm run db status production`

## Environment Summary

You'll have:
- **Local Development**: SQLite database with fast, zero-setup development
- **Production**: PostgreSQL database on Vercel with persistent, reliable data
- **Version Control**: Code on GitHub with automated deployments
- **Automation**: Cron jobs managing competition phases
- **Admin Interface**: Challenge management at `/admin`
- **File Storage**: Intelligent photo handling (works with or without Blob storage)

Congratulations! Your Challenge League is now deployed with Prisma-compliant database management! 🏆

---

**Ready to compete?** Your app uses industry-standard database practices and deploys safely with proper migration controls.