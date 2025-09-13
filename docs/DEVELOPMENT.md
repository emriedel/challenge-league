# Development Guide - Challenge League

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ installed
- Docker Desktop installed
- Git installed

### Setup (2 minutes)
```bash
# Clone and install
git clone <repository-url>
cd challenge-league
npm install

# Start PostgreSQL database
docker compose up -d

# Set up database with initial migration and seed test data
npm run db:init

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) - your local Challenge League is ready! 🎉

## 🧪 Test Accounts

All users use password `password123`:

**Primary Test Accounts:**
- `photophoenix@example.com` - Main League Owner & Admin
- `craftycaptain@example.com` - Photography Masters Owner  
- `pixelpioneer@example.com` - Crafty Creators Owner
- `artisticace@example.com` - Multi-league member
- `creativecomet@example.com` - Multi-league member

**Additional Test Users Available:**
snapsage, visionvoyager, dreamdesigner, studiostar, framefusion, colorcrafter, lenslegend, brushboss, sketchsorcerer, paintpro, digitaldynamo, artfulavenger, creativeclimber, visualvibe, mastermaker

## 🏆 What's in the Test Data

**Multiple Leagues:**
- **Main Creative League** - General creative challenges
- **Photography Masters** - Advanced photography challenges  
- **Crafty Creators** - Hands-on making challenges

**Per League:**
- 3 completed rounds with full voting history
- 1 active round with partial submissions
- 3 scheduled future rounds
- Realistic participation and vote distributions

## 🛠️ Daily Development Commands

### Core Development
```bash
# Start development server (with hot reload)
npm run dev

# Check code quality
npm run lint
npm run type-check

# Build for production
npm run build
npm start
```

### Database Management
```bash
# Start/stop PostgreSQL
docker compose up -d
docker compose down

# Nuclear reset: drop database, reapply migrations, fresh data (if needed)
npm run db:reset

# Refresh test data only (lighter option)
npm run db:seed

# Browse database in your browser
npx prisma studio

# Create database migration after schema changes
npx prisma migrate dev --name your-feature-name
```

### Testing
```bash
# Unit tests (Vitest)
npm test
npm run test:unit

# Integration tests (Playwright)
npm run test:integration
npm run test:integration:ui    # With UI mode

# All tests
npm run test:all
```

## 🗄️ Database Development Workflow

Challenge League uses **PostgreSQL for both development and production** with a streamlined migration workflow.

### Making Database Schema Changes

**Step 1: Edit Schema Locally**
```bash
# 1. Edit prisma/schema.prisma with your changes
# 2. Create and apply migration locally
npx prisma migrate dev --name describe-your-change

# 3. Test your changes thoroughly
npm run dev

# 4. Update any affected TypeScript types/code
npm run type-check
```

**Step 2: Deploy Changes Automatically**
```bash
# Commit everything including migration files
git add .
git commit -m "Add feature: describe-your-change"

# Push to deploy - migrations apply automatically!
git push
```

### Safety Features
- ✅ **No file swapping** - Never modifies your environment files
- ✅ **Environment isolation** - Clear separation between dev/prod
- ✅ **Safety checks** - Prevents accidental production access  
- ✅ **Automated migrations** - Production migrations happen during build
- ✅ **Rollback capable** - Migration history tracked in git

## 🔧 Environment Variables

Create `.env` file (most are optional for development):

```bash
# Database (auto-configured with Docker)
DATABASE_URL="postgresql://challenge_league:dev_password@localhost:5432/challenge_league_dev"

# Authentication (auto-generated if missing)
NEXTAUTH_SECRET="dev-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Photo uploads (optional - app works without this)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Push notifications (optional for development)
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"  
VAPID_SUBJECT="mailto:admin@challengeleague.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
```

**Note:** App works without any environment variables for basic local development.

## 🚨 Common Issues & Solutions

### Database Issues
```bash
# "Database connection failed" or migration errors
docker compose down && docker compose up -d
npm run db:reset

# "Schema out of sync"
npx prisma generate
npx prisma migrate reset  # Nuclear option - removes all data
npm run db:reset
```

### Authentication Issues
```bash
# "NextAuth configuration error" or login failures
rm -rf .next
npm run dev

# Check environment variables
echo $NEXTAUTH_SECRET
```

### Build/Type Issues
```bash
# TypeScript errors after schema changes
npx prisma generate
npm run type-check

# Module resolution issues
rm -rf .next node_modules
npm install
npm run dev
```

### Photo Upload Issues
- Check file size is under 10MB
- Verify image format is supported (jpg, png, gif, webp)
- For production: check `BLOB_READ_WRITE_TOKEN` is set

## 📁 Project Structure Deep Dive

```
challenge-league/
├── prisma/
│   ├── schema.prisma          # Database schema (PostgreSQL)
│   ├── seed.ts                # Test data generator
│   └── migrations/            # Database migration history
├── src/
│   ├── app/                   # Next.js 14 app router
│   │   ├── page.tsx           # League Dashboard
│   │   ├── auth/              # Login/register pages
│   │   ├── app/               # Main app pages (/app/[leagueId])
│   │   ├── admin/             # Global admin (unused)
│   │   └── api/               # Backend API routes
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components
│   │   ├── forms/             # Form components
│   │   └── league/            # League-specific components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Database & utilities
│   │   ├── prisma.ts          # Database client
│   │   ├── auth.ts            # NextAuth configuration
│   │   └── utils.ts           # Utility functions
│   ├── types/                 # TypeScript definitions (centralized)
│   └── constants/             # App configuration
├── tests/                     # Testing infrastructure
│   ├── integration/           # Playwright E2E tests
│   └── utils/                 # Test utilities
├── public/                    # Static assets
├── docker-compose.yml         # PostgreSQL development setup
├── vercel.json               # Deployment & cron configuration
└── tailwind.config.js        # Theme configuration
```

## 🎯 Development Tips

### Working with the Database
- Use `npm run db:reset` for fresh starts (existing projects) or `npm run db:init` (first time only)
- Use `npx prisma studio` to visualize data
- Migration files are auto-generated - don't edit them manually
- Test schema changes locally before pushing

### Component Development
- Follow existing patterns in `/src/components/`
- Use TypeScript types from `/src/types/`
- Components should be functional with hooks
- Add new API routes in `/src/app/api/`

### Debugging Competition Cycles
- Use admin panel "Process Queue Now" to trigger transitions
- Check browser console for detailed processing logs
- Monitor database with `npx prisma studio` during transitions
- Test with multiple users to simulate real competition

### Performance Optimization
- Images are automatically optimized via Vercel Blob
- Use Next.js Image component for photos
- Database queries are optimized with proper indexing
- Lazy loading implemented for large photo galleries

## 🔄 Automated Systems

### Competition Cycle Management
- **Cron Schedule**: Daily at 7 PM UTC (11 AM PT / 12 PM PDT)
- **Phase Transitions**: ACTIVE → VOTING → COMPLETED
- **Vote Calculation**: Automatic ranking and point distribution
- **Queue Processing**: Next challenge activated automatically

### Push Notifications
- **Auto-enable**: New users prompted to enable notifications in onboarding flow
- **Phase Notifications**: Automatic notifications for new prompt available, voting phase starting, as well as 24-hour submission reminders
- **Debug Mode**: Access via `?debug` URL parameter

### Error Handling
- Centralized API error responses
- Automatic cleanup of invalid push subscriptions
- Graceful degradation when services unavailable
- Comprehensive logging for debugging

## 🧪 Testing Strategy

### Unit Tests (Vitest)
- Business logic functions
- React hook behavior
- API route handlers
- Database operations

### Integration Tests (Playwright)
- Complete user workflows
- Multi-user competition scenarios
- Phase transition automation
- Cross-browser compatibility

### Test Data Management
- Isolated test databases for each test run
- Realistic competition scenarios with voting history
- Multiple leagues and user types
- Automated cleanup after test completion

## 🚀 Production Deployment

### Automated Deployment
1. Push code to main branch
2. Vercel builds application
3. Database migrations apply automatically
4. Cron jobs start running
5. App is live!

### Environment Variables (Production)
```bash
# Required for production
DATABASE_URL="your-postgresql-connection-string"
NEXTAUTH_SECRET="your-production-secret"  
NEXTAUTH_URL="https://your-app.vercel.app"

# Optional but recommended
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:admin@yourdomain.com"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
CRON_SECRET="your-cron-secret"
```

### Monitoring Production
- Check Vercel function logs for cron job execution
- Monitor database performance via provider dashboard
- Track user engagement through competition participation
- Watch for push notification delivery rates

---

**Ready to develop?** Run `npm run db:init && npm run dev` and start coding! 🚀

The development environment is designed to be as frictionless as possible - everything works out of the box with minimal configuration required.