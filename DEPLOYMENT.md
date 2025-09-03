# Deployment Guide - Challenge League

This guide will walk you through deploying Challenge League with SQLite for development and PostgreSQL for production - the best of both worlds!

## Database Strategy

- **Local Development**: SQLite (zero setup, fast, perfect for development)
- **Production**: PostgreSQL (persistent, reliable, cloud-ready)

## Prerequisites

- GitHub account (for code hosting)
- Vercel account (for app hosting) - sign up at [vercel.com](https://vercel.com)

## Step 1: Prepare Your Code for Deployment

### 1.1 Local Development Setup

**For development, you only need ONE command:**

```bash
# Reset and seed your local database (SQLite)
npm run db:setup
```

This creates a local SQLite database (`dev.db`) with test data. Use this whenever you want to reset your local dev environment.

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

### 3.4 Configure Build Command

The project includes a `vercel.json` file that automatically configures the correct build command:
```json
{
  "buildCommand": "npm run build:prod"
}
```

This ensures production builds use PostgreSQL schema. **No manual configuration needed!**

If you need to manually override this:
1. Go to Vercel project settings → "Settings" → "General"
2. Find "Build & Development Settings"
3. Set Build Command to: `npm run build:prod`

### 3.5 Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete (3-5 minutes)
3. The PostgreSQL database will be initialized automatically

## Step 4: Initialize Production Database

**For first-time production setup with test data:**

```bash
# Install Vercel CLI if you haven't
npm i -g vercel && vercel login && vercel link

# Pull production environment variables
vercel env pull .env.production

# Initialize production database with test data (SAFE - no file modifications)
npm run db reset production --force
npm run db seed production --force
```

🛡️ **New Safety System**: Our industry-standard database manager prevents accidental production access and requires explicit `--force` flags for destructive operations.

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

**Important**: The `next.config.js` is already configured to handle Vercel Blob storage domains. If you use a different storage provider, you'll need to add its domain to the `remotePatterns` in `next.config.js`.

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

### 7.2 Test Admin Functions

1. Sign in with a test admin account
2. Go to `/admin` to access challenge management
3. Test manual cycle processing
4. Verify queue management works

## Development Workflow

### Daily Development (Simple!)

```bash
# Start development server
npm run dev

# Reset your local database anytime (if needed)
npm run db:setup
```

**That's it!** Your local development uses SQLite - zero configuration needed.

### Deploy to Production
```bash
# Deploy to production (uses PostgreSQL automatically)
git add .
git commit -m "Your changes"
git push              # Automatic deployment via Vercel
```

### Database Commands Reference

**Local Development (SQLite):**
- `npm run db reset development --force` - Reset local database  
- `npm run db seed development` - Add test data
- `npm run db studio development` - Browse local database
- `npx prisma migrate dev` - Create and apply new migration

**Production (PostgreSQL) - Prisma Best Practices:**
- `npm run db migrate production --force` - **RECOMMENDED**: Apply pending migrations
- `npm run db status production` - Check migration status
- `npm run db seed production --force` - Add test data (destructive, requires --force)
- `npm run db studio production` - Browse production database (careful!)
- `npm run db generate production` - Regenerate Prisma client

**Get Help:**
- `npm run db help` - Complete command reference with examples

## Test User Accounts

The database seed creates 20 users across 3 leagues with rich competition history:

**Primary Test Accounts:**
- **Main League Owner**: photophoenix@example.com / password123  
- **Photography Masters Owner**: craftycaptain@example.com / password123
- **Crafty Creators Owner**: pixelpioneer@example.com / password123
- **Multi-League Users**: artisticace@example.com, creativecomet@example.com / password123

**All 20 Users Available:**
All users use password `password123`:
photophoenix, craftycaptain, pixelpioneer, artisticace, creativecomet, snapsage, visionvoyager, dreamdesigner, studiostar, framefusion, colorcrafter, lenslegend, brushboss, sketchsorcerer, paintpro, digitaldynamo, artfulavenger, creativeclimber, visualvibe, mastermaker

**Features Included:**
- 3 leagues with different themes and overlapping membership
- 3 completed rounds per league with voting history  
- 1 active round per league with partial submissions
- 3 scheduled future rounds per league

## Benefits of This Approach

🚀 **Simple development** - SQLite requires zero setup locally
💰 **Cost effective** - Only pay for what you use in production
⚡ **Better performance** - PostgreSQL scales well in production
🔧 **Easier maintenance** - Best database for each environment
📦 **Flexible** - Easy to switch between environments

## Database Schema Changes and Migrations

When you make changes to your database schema (in `prisma/schema.prisma`), use Prisma's official migration system to apply changes safely to production.

### ✅ Prisma-Compliant Migration Workflow

**Following official Prisma best practices from: https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production**

#### Step 1: Develop Locally

```bash
# Make schema changes in prisma/schema.prisma
# Create migration locally
npx prisma migrate dev --name your-change-description

# This automatically applies the migration to your local database
```

#### Step 2: Deploy to Production  

```bash
# 1. Push your code (this deploys the app but doesn't change the database)
git add .
git commit -m "Add database schema changes"  
git push

# 2. Apply pending migrations to production (SAFE - only applies new migrations)
npm run db migrate production --force
```

#### Step 3: Verify Migration Success

```bash
# Check migration status
npm run db status production

# View database (optional)
npm run db studio production
```

### 🛡️ Safety Features

**What `prisma migrate deploy` does:**
- ✅ **Only applies new migrations** - Never modifies existing data
- ✅ **Atomic operations** - All migrations succeed or all fail
- ✅ **Migration locking** - Prevents concurrent migrations
- ✅ **Rollback protection** - Warns if migrations were modified

**What it does NOT do:**
- ❌ Never resets or drops data
- ❌ Never applies schema drift fixes  
- ❌ Never modifies applied migrations

### When Schema Changes Cause Deployment Errors

If you see errors like:
- "Column doesn't exist"
- "Prisma client out of sync"  
- "Database schema mismatch"

**Root Cause:** Your code expects the new schema, but production database hasn't been updated yet.

**Solution:** Apply the pending migration:
```bash
# Apply migration to sync database with code
npm run db migrate production --force
```

## Common Issues and Solutions

### Issue: "Database schema mismatch after code changes"
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
**Solution**: The build should now work automatically with the unified schema approach. Vercel uses `npm run build` which includes `prisma generate`.

### Issue: "Cannot connect to database in production"
**Solution**: Verify your PostgreSQL `DATABASE_URL` is correct in Vercel environment variables.

### Issue: "Photos not uploading"
**Solution**: The app works without Blob storage. If you want external storage, set up Vercel Blob as described in Step 5.

### Issue: "Migration fails with data loss warning"
**Solution**: Prisma is protecting your data. Review the migration carefully:
```bash
# Check what the migration would do
npx prisma db push --preview-feature-only
# If safe, proceed with the migration steps above
```

### Issue: "Accidentally wiped production database with --accept-data-loss"
**Solution**: Restore with test data using the new safe system:
```bash
# Restore production database with fresh test data (new safe method)
vercel env pull .env.production
npm run db reset production --force     # Reset database
npm run db seed production --force      # Restore test data
```

⚠️ **Warning**: `--accept-data-loss` can be extremely destructive. Always use `npm run db preview production` first to see exactly what data will be lost.

## Deployment Safety Audit

### ✅ Safe Automatic Deployments

**Normal git push deployment:**
- Vercel runs `npm run build:prod` 
- This only copies schema and generates Prisma client (`prisma generate`)
- **NO database operations performed**
- **Your data is completely safe**

**Schema changes via git push:**
- Build succeeds but runtime may fail with schema mismatch errors
- **NO data loss occurs** - just runtime errors until you run migration
- Database remains untouched until you manually migrate

### ⚠️ Manual Operations Only

These commands can affect your database but are **NEVER run automatically:**

```bash
# New safe migration system (recommended)
npm run db preview production              # ✅ Always safe - just shows changes
npm run db migrate production --force      # ⚠️ Safe migration (blocks on data loss)
npm run db migrate production --force --accept-data-loss  # ⚠️ Dangerous - can wipe data

# Database reset/seed operations  
npm run db reset production --force        # ⚠️ Wipes and resets database
npm run db seed production --force         # ⚠️ May overwrite user data

# Always safe
npm run build:prod          # ✅ Only generates client
npm run dev                 # ✅ Local development only  
git push                    # ✅ Triggers safe build process
```

### 📋 Safe Schema Change Workflow

1. **Make schema changes locally**
2. **Test with local database:** `npm run db migrate development`
3. **Preview production impact:** `npm run db preview production`  
4. **Commit and push changes:** `git push`
5. **App builds successfully but may show runtime errors**
6. **Apply safe migration:** `npm run db migrate production --force`
7. **App works with new schema**

**Key Point:** The new system gives you complete visibility into what will happen before making any database changes. No more surprises!

## Environment Summary

You'll now have:
- **Local Development**: SQLite database (`dev.db`) with fast, zero-setup development
- **Production**: PostgreSQL database on Vercel with persistent, reliable data
- **Version Control**: Code on GitHub with automated deployments
- **Automation**: Cron jobs managing competition phases
- **Admin Interface**: Challenge management at `/admin`
- **File Storage**: Intelligent photo handling (works with or without Blob storage)

Congratulations! Your Challenge League is now deployed with the optimal database setup! 🏆

---

**Ready to compete?** Your app uses the best database for each environment and deploys automatically!