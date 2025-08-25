#!/bin/bash

# Production Database Migration Script
# Safely applies database schema changes to production while preserving all data

set -e  # Exit on any error

echo "🔄 Starting production database migration..."
echo

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Error: Vercel CLI not found. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

echo "📥 Step 1: Pulling production environment variables..."
vercel env pull .env.production

if [ ! -f ".env.production" ]; then
    echo "❌ Error: Failed to pull production environment variables"
    echo "   Make sure you're logged in: vercel login"
    echo "   Make sure project is linked: vercel link"
    exit 1
fi

echo "✅ Production environment variables pulled successfully"
echo

echo "💾 Step 2: Backing up current local environment..."
if [ -f ".env" ]; then
    mv .env .env.backup
    echo "✅ Local .env backed up to .env.backup"
else
    echo "ℹ️  No local .env found, skipping backup"
fi
echo

echo "🔄 Step 3: Backing up current schema..."
cp prisma/schema.prisma prisma/schema.backup
echo "✅ Schema backed up to prisma/schema.backup"
echo

echo "🔄 Step 4: Switching to production environment..."
cp .env.production .env
echo "✅ Now using production environment"
echo

echo "🗃️  Step 5: Applying database migrations to production..."
echo "⚠️  This will update the production database schema while preserving all data"
echo

# Run the migration (will fail safely if there's potential data loss)
cp prisma/schema.production.prisma prisma/schema.prisma
npx prisma generate

echo "Running database migration..."
if ! npx prisma db push; then
    echo
    echo "❌ Migration failed due to potential data loss."
    echo "Prisma detected changes that could result in data loss."
    echo 
    echo "To proceed anyway (only if you're certain it's safe):"
    echo "   npx prisma db push --accept-data-loss"
    echo
    echo "Or review the changes and modify your schema accordingly."
    exit 1
fi

echo "✅ Database migration completed successfully!"
echo

echo "🔄 Step 6: Restoring local development environment..."
if [ -f ".env.backup" ]; then
    mv .env.backup .env
    echo "✅ Local environment restored"
else
    rm .env
    echo "✅ Production environment removed (no local backup to restore)"
fi

echo "🔄 Step 7: Restoring original schema..."
if [ -f "prisma/schema.backup" ]; then
    mv prisma/schema.backup prisma/schema.prisma
    echo "✅ Original schema restored"
else
    echo "⚠️  Warning: No schema backup found"
fi

# Clean up
rm -f .env.production
echo "✅ Cleaned up temporary files"
echo

echo "🎉 Production migration completed successfully!"
echo
echo "Next steps:"
echo "1. Deploy your updated code: git push"
echo "2. Verify the changes work in production"
echo
echo "📊 Your production data has been preserved:"
echo "   • All user accounts and profiles"
echo "   • All competition responses and votes"
echo "   • All league memberships and settings"
echo "   • Complete competition history"