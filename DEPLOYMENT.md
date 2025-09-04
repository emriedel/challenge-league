# Deployment Guide - Challenge League

This guide covers deploying Challenge League with PostgreSQL for both development and production using Prisma's recommended migration workflow.

## Database Strategy

- **Local Development**: PostgreSQL in Docker (consistent with production)
- **Production**: PostgreSQL on Vercel (persistent, reliable, cloud-ready)

## Prerequisites

- Docker Desktop installed locally
- GitHub account (for code hosting)
- Vercel account (for app hosting) - sign up at [vercel.com](https://vercel.com)

## Step 1: Local Development Setup

### 1.1 Set Up Local PostgreSQL

```bash
# Start PostgreSQL container
docker compose up -d

# Set up database with initial migration
npx prisma migrate dev --name init

# Seed database with test data
npm run db:seed

# Start development server
npm run dev
```

This creates a local PostgreSQL database with test data accessible at http://localhost:3000.

### 1.2 Database Development Workflow

When making schema changes:

```bash
# 1. Edit prisma/schema.prisma
# 2. Create and apply migration locally
npx prisma migrate dev --name describe-your-change

# 3. Test your changes
npm run dev

# 4. Commit migration files (IMPORTANT!)
git add prisma/migrations/
git commit -m "Add feature: describe-your-change"
```

## Step 2: Deploy to Production

### 2.1 Commit Your Code to GitHub

```bash
# Add all files including migration files
git add .

# Commit your changes
git commit -m "Prepare Challenge League for production deployment"

# Push to GitHub
git push
```

### 2.2 Set Up Vercel Postgres Database

1. Go to [vercel.com](https://vercel.com) and log in
2. Go to your dashboard
3. Click "Storage" tab
4. Click "Create Database" → "Postgres"
5. Name it "challenge-league-db"
6. Select your region
7. Click "Create"

### 2.3 Get Database Connection String

1. After creating the database, click on it
2. Go to ".env.local" tab
3. Copy the `POSTGRES_URL` value (this is your `DATABASE_URL`)

## Step 3: Deploy Application to Vercel

### 3.1 Connect GitHub to Vercel

1. In Vercel dashboard, click "New Project"
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
# Database (PostgreSQL from Step 2.3)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# NextAuth (use generated secret from Step 3.2)
NEXTAUTH_SECRET=your-generated-nextauth-secret-here
NEXTAUTH_URL=https://your-app-name.vercel.app

# Cron Security (use generated secret from Step 3.2)
CRON_SECRET=your-generated-cron-secret-here

# Vercel Blob (OPTIONAL - app works without this)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token_here
```

### 3.4 Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete (3-5 minutes)
3. The app will be deployed but database needs initialization

## Step 4: Initialize Production Database

**Apply migrations to production database:**

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Link to your project
vercel link

# Apply all migrations to production
npx prisma migrate deploy

# Optionally seed production with test data
npm run db:seed
```

🛡️ **Safety**: `prisma migrate deploy` only applies new migrations and never modifies existing data.

## Step 5: Update Final Configuration

### 5.1 Update NEXTAUTH_URL

1. Copy your Vercel app URL (e.g., `https://challenge-league-abc123.vercel.app`)
2. Go to Vercel project settings → Environment Variables
3. Update `NEXTAUTH_URL` to your actual URL
4. Redeploy the app

### 5.2 Verify Deployment

1. Visit your deployed app
2. Test key features:
   - User registration and league auto-assignment
   - League dashboard functionality
   - Photo submission and voting
   - League startup feature

## Ongoing Development & Deployment

### Making Schema Changes

Follow this workflow for any database changes:

#### Step 1: Develop Locally

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name your-feature-description

# 3. Test changes
npm run dev

# 4. Update any affected code
```

#### Step 2: Deploy Code

```bash
# Commit everything including migration files
git add .
git commit -m "Add feature: your-feature-description"

# Push to trigger Vercel deployment
git push
```

#### Step 3: Apply Database Changes to Production

```bash
# Apply migrations to production database
npx prisma migrate deploy
```

### Common Commands

#### Local Development
```bash
# Start/stop PostgreSQL
docker compose up -d
docker compose down

# Reset local database (removes all data)
npx prisma migrate reset

# View database
npx prisma studio

# Generate Prisma client
npx prisma generate
```

#### Production Database
```bash
# Check migration status
npx prisma migrate status

# Apply pending migrations
npx prisma migrate deploy

# Reset production (DESTRUCTIVE - use with extreme caution)
npx prisma migrate reset
```

## Database Migration Safety

### ✅ Safe Operations
- `npx prisma migrate dev` - Local development migrations
- `npx prisma migrate deploy` - Production deployment (only applies new migrations)
- `npx prisma studio` - Database browsing
- `npx prisma generate` - Generate client

### ⚠️ Destructive Operations
- `npx prisma migrate reset` - Wipes entire database
- `npx prisma db push` - Bypasses migration system

### Migration Best Practices

1. **Always commit migration files** - Never let Vercel auto-generate migrations
2. **Test locally first** - Create and test migrations in development
3. **Use `migrate deploy` in production** - Never use `migrate dev` or `db push`
4. **Review migration SQL** - Check generated SQL before applying to production
5. **Backup before major changes** - Download database backup for significant schema changes

## Automated Competition Management

Your `vercel.json` configures automatic competition cycles:

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

This runs daily at noon UTC to manage competition phases automatically.

## Troubleshooting

### "Database schema out of sync"
```bash
# Apply pending migrations
npx prisma migrate deploy
```

### "Migration failed"
```bash
# Check what migrations are pending
npx prisma migrate status

# Review the failed migration file in prisma/migrations/
# Fix any issues and run again
npx prisma migrate deploy
```

### "Local development issues"
```bash
# Reset local database
npx prisma migrate reset

# Restart Docker if needed
docker compose down && docker compose up -d
```

### "Deployment fails"
Ensure:
1. Migration files are committed to GitHub
2. `DATABASE_URL` is correctly set in Vercel
3. Production database is accessible

## Test Accounts

After seeding, use these test accounts:

- **Email**: photophoenix@example.com, craftycaptain@example.com, etc.
- **Password**: password123
- **Features**: Pre-populated leagues, competitions, and voting history

## Environment Summary

- **Local Development**: PostgreSQL in Docker with hot reload
- **Production**: PostgreSQL on Vercel with automated deployments
- **Database Migrations**: Prisma-managed with version control
- **Competition Cycles**: Automated via Vercel Cron
- **Photo Storage**: Works with/without Vercel Blob

Your Challenge League is now deployed with industry-standard practices! 🏆