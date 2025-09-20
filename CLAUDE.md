# Challenge League - A Creative Competition Platform

## Project Overview
Challenge League is a web application inspired by Taskmaster, where players join leagues to compete in weekly challenges. Players submit photo responses to specific challenges, then vote on each other's submissions to determine winners and rankings.

**Purpose:** Foster creativity and friendly competition through weekly challenges
**Development Strategy:** Web-first with PWA features, mobile app to follow later
**Current Status:** MVP Complete

## Core Technology Stack
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes (same repo)
- **Database**: PostgreSQL with Prisma ORM (Docker for development)
- **Authentication**: NextAuth.js with email/password
- **File Storage**: Vercel Blob for photo uploads
- **Deployment**: Vercel with automated CI/CD
- **Testing**: Vitest (unit) + Playwright (integration)
- **Future**: React Native app using same backend

## Development Guidelines

### Code Standards
- Use TypeScript for type safety
- Follow ESLint configuration with Prettier formatting
- Component-based architecture with hooks
- Functional components preferred over class components
- Use custom hooks for business logic
- Implement proper error boundaries

### File Structure
```
src/
├── app/                 # Next.js app directory (pages and layouts)
├── components/          # Reusable UI components
├── lib/                 # Database, auth, and utility functions
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions (centralized)
├── constants/           # App constants and configuration
├── public/              # Static assets
└── styles/              # Global styles and Tailwind config
```

### State Management
- React Context + useReducer for global state
- Server-side state management with Next.js
- Local component state for UI-specific data
- @tanstack/react-query for API state management

## Important Commands

### Development
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Check code style
- `npm run type-check` - TypeScript type checking

### Database (PostgreSQL with Docker)
- `docker compose up -d` - Start local PostgreSQL database
- `docker compose down` - Stop local PostgreSQL database  
- `npm run db:init` - Create initial migration and seed test data (first time setup only)
- `npm run db:reset` - Nuclear reset: drop database, reapply all migrations, seed fresh data
- `npx prisma migrate dev --name feature-name` - Create and apply migrations locally
- `npx prisma migrate deploy` - Apply migrations to production (safe)
- `npx prisma migrate reset` - Reset local database (removes all data)
- `npx prisma generate` - Generate Prisma client
- `npx prisma studio` - Open database browser
- `npm run db:seed` - Refresh test data only (keeps schema and migrations intact)

### Testing
- `npm test` - Run unit tests (Vitest)
- `npm run test:integration` - Run integration tests (Playwright)
- `npm run test:integration:ui` - Run integration tests with UI mode
- `npm run test:integration:basic` - Run basic user flow tests
- `npm run test:integration:isolated` - **RECOMMENDED**: Run isolated integration tests (safe)
- `npm run test:all` - Run both unit and integration tests
- `npm run test:setup` - Install Playwright browsers
- `npm run test:cleanup` - Clean up test files

### Safe Testing Commands (Database Isolated)
```bash
# RECOMMENDED: Always use the isolated test environment
npm run test:integration:isolated

# This command provides complete database safety:
# - Uses dedicated test database (port 5433)
# - Creates isolated Next.js server (port 3005)
# - Automatic cleanup after tests complete
# - Never touches development data
```

### Database Test Safety
**🚨 CRITICAL**: Always use `npm run test:integration:isolated` for integration tests!

**✅ SAFE (Isolated Environment)**:
- `npm run test:integration:isolated` - Uses test database on port 5433
- `npm test` - Unit tests (no database)

**⚠️ POTENTIALLY UNSAFE (May Use Dev Database)**:
- `npm run test:integration` - Regular Playwright tests
- `npm run test:integration:basic` - May use development database

The isolated test environment creates a temporary `.env.test.local` file that overrides development settings, ensuring complete database isolation.

### Deployment (Automated CI/CD Pipeline)
- `git push` - Deploy code and apply migrations automatically
- Database migrations run automatically during Vercel build process
- No manual migration steps required - fully automated!

## Core App Specifications

### 2-Phase Competition Cycle
- **Submission Phase**: X days to submit creative responses (configured by league admin)
- **Voting Phase**: Y days to vote on submissions (configured by legue admin)

### Main App Features
1. **League Dashboard**: Overview of competition status, personal stats, and leaderboard
2. **Task Submission**: Current challenge with creative prompts, photo upload, caption input
3. **Voting Interface**: Instagram-style feed with vote buttons
4. **Results Gallery**: View ranked results from completed challenges
5. **Leaderboard**: League standings based on total points earned
6. **League Settings**: View league settings, or for admins, edit them

### Competition Rules
- Players cannot vote for their own submissions
- Each player gets exactly X votes to cast (configurd by league admin)
- Use vote buttons to cast votes
- Photos preserved indefinitely in results gallery for viewing past competitions
- Rankings based on total votes received
- No grace period for submission or voting deadlines

### Creative Challenge System
- **Diverse Prompts**: Wide variety of creative tasks
- **Sample Tasks**:
   - "Take a photo that could be an album cover"
   - "Find the strangest street name"
   - "Cook the most beautiful meal for yourself"
   - "Find the weirdest statue"
   - "Find the most interesting grocery item from the store"
   - "Take the most dramatic photo of something completely ordinary"

### League System
- Multiple leagues supported with configurable settings
- League-wide visibility for all submissions and results
- Comprehensive leaderboard tracking:
  - Total points across all challenges
  - Number of wins (1st place finishes)
  - Podium finishes (top 3 placements)
  - Total challenges participated in
  - Average ranking

### Voting System
- Anonymous voting with public results
- Players get exactly 3 votes to cast among submissions (1 vote per submission)
- Each vote = 1 point
- Cannot vote for own submission
- Voting window: 2 days after submissions close
- Automatic ranking calculation based on total points

### Username Requirements
- 3-30 characters length
- Letters, numbers, underscores, hyphens only
- Must start with letter or number
- Case insensitive but preserves display case
- Globally unique
- Reserved words blocked

### Authentication
- Email and password based account creation
- Basic onboarding flow explaining the competition
- Multiple league support with configurable settings
- No offline functionality required

## Database Schema (Key Models)

### User
- Standard authentication fields (email, password, profile photo)
- Username (unique identifier)
- League memberships (many-to-many via LeagueMembership)
- Responses, votes, comments, and push subscriptions
- Can own multiple leagues

### League
- Name, slug, and description (all unique)
- Invite code for joining
- Active status and startup flag (`isStarted`)
- Configurable settings:
  - `submissionDays` (default: 6 days)
  - `votingDays` (default: 1 day) 
  - `votesPerPlayer` (default: 3 votes)
- Owner relationship and member count via LeagueMembership

### Prompt (Challenge)
- Text description only (no categories or difficulty)
- Phase timing with `phaseStartedAt` timestamp
- Status: SCHEDULED → ACTIVE → VOTING → COMPLETED
- Queue order for automatic progression
- Notification tracking (24-hour warnings)
- Database constraint: Only one ACTIVE/VOTING prompt per league

### Response (Submission)
- Image URL and caption
- Publication status (`isPublished`) and timestamp
- Vote tracking (total votes, total points, final rank)
- One response per user per prompt (unique constraint)

### Vote
- Simple voting (1 point each, no ranking system)
- Voter and response relationships
- No constraints on duplicate votes (users can vote multiple times for same response)

### LeagueMembership
- Many-to-many relationship between Users and Leagues
- Join timestamp and active status
- Unique constraint: one membership per user per league

### Comment
- Text comments on responses
- One comment per user per response (editable)
- Author and response relationships

### PushSubscription
- Web push notification endpoints
- Encryption keys (p256dh, auth)
- User agent tracking for device identification
- Unique per user per device/browser

## Automated Systems

### Cron Jobs
- Runs daily at 7 PM UTC (11 AM PT / 12 PM PDT) to check phase transitions
- Automatically moves ACTIVE prompts to VOTING when submission deadline passes
- Calculates vote results and moves VOTING prompts to COMPLETED
- Activates next scheduled prompt when no active prompt exists
- Handles automatic phase transitions (photos preserved permanently)

### Admin Interface
- Challenge queue adding, reordering, and editing
- Manual cycle processing for testing
- Comprehensive prompt status overview
- Real-time queue processing controls

## Test Data
- 5 main test players (photophoenix, craftycaptain, pixelpioneer, artisticace, creativecomet)
- Multiple leagues with sample challenges
- Pre-populated voting data and rankings
- Multiple challenge categories represented
- Complete competition cycle examples

All test accounts use password `password123`

## Database Development Workflow

Challenge League uses **PostgreSQL for both development and production** with Prisma's recommended migration workflow for safe, version-controlled database changes.

### Local Development Setup

```bash
# Start PostgreSQL container
docker compose up -d

# Set up database with initial migration and test data
npm run db:init

# Start development server
npm run dev
```

### Making Database Schema Changes

Follow this **2-step workflow** for any database changes:

#### Step 1: Develop and Test Locally

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration locally
npx prisma migrate dev --name describe-your-change

# 3. Test your changes thoroughly
npm run dev

# 4. Update any affected TypeScript types/code
```

#### Step 2: Deploy Everything Automatically

```bash
# Commit ALL files including migration files
git add .
git commit -m "Add feature: describe-your-change"

# Push to deploy code AND database changes automatically
git push
```

**That's it!** Migrations are applied automatically during the build process. No manual steps needed.

### Important Migration Rules

**✅ ALWAYS commit migration files** - Never let production auto-generate migrations  
**✅ Automated migrations** - CI/CD pipeline applies migrations safely during build  
**✅ Test locally first** - Create and test all changes in development  
**❌ Never manually run migrations in production** - Let the automated pipeline handle it  

### Common Database Commands

```bash
# Local development
docker compose up -d              # Start PostgreSQL
npm run db:init                   # Create initial migration and seed data (first time only)
npm run db:reset                  # Nuclear reset: drop database, reapply all migrations, seed fresh data
npm run db:seed                   # Refresh test data only (lighter option)
npx prisma studio                 # Browse database
npx prisma generate              # Generate Prisma client

# Production (rarely needed - migrations are automated!)
npx prisma migrate status        # Check migration status (debugging only)
# Note: Migrations are applied automatically during deployment
```

### Database Schema Structure

The application uses these key models:
- **User**: Authentication and profile information
- **League**: Competition groups with configurable settings
- **LeagueMembership**: Many-to-many relationship between users and leagues
- **Prompt**: Creative challenges with 2-phase timing (ACTIVE → VOTING → COMPLETED)
- **Response**: User submissions with photos, captions, and voting results
- **Vote**: Individual votes cast by users (1 point each)
- **Comment**: User comments on responses
- **PushSubscription**: Web push notification subscriptions

### New League Startup Feature

Added `isStarted` boolean field to League model:
- New leagues start with `isStarted: false`
- League owners must manually start their leagues
- Only started leagues process prompt queues automatically
- Provides proper onboarding and control for league creators

## High Priority Refactoring Tasks

The following refactoring tasks have been identified as high priority for improving code quality, maintainability, and developer experience:

### 🔥 High Priority (Next Phase)
1. **Extract Database Query Patterns** - Create a data access layer to centralize common Prisma queries. Many components duplicate similar database operations (user lookups, league queries, etc.).

2. **Create Custom Data Fetching Hook (useApiQuery)** - Replace repetitive fetch patterns with a standardized hook that handles loading states, error handling, and caching consistently across all components.

### 🟡 Medium Priority (Future Phases)
3. **Improve Authentication State Management** - Create `useAuthRedirect` hook to handle authentication redirects and loading states consistently across protected routes.

4. **Extract Form Validation Patterns** - Create `useFormValidation` hook to centralize validation logic currently scattered across submission forms, user registration, and other forms.

5. **Optimize Image Loading** - Create `OptimizedImage` wrapper component to handle lazy loading, proper sizing, and fallback states for user submissions and profile photos.

6. **Add React.memo to Pure Components** - Identify and memoize components that don't need to re-render on every parent update (ProfileAvatar, ResultsGallery items, etc.).

7. **Implement Consistent Skeleton Loading States** - Standardize loading skeletons across all components to improve perceived performance.

8. **Create Centralized API Client Layer** - Build an API client with interceptors for authentication, error handling, and request/response transformation.

### Implementation Notes
- Focus on high priority items first as they impact code maintainability most significantly
- Each refactoring should maintain backward compatibility
- Run `npm run type-check` and `npm run lint` after each refactoring
- Update component interfaces to use centralized types from `/src/types/`
- Document breaking changes in git commit messages

## Theme System

### Semantic Color Classes
The app uses a custom Tailwind theme with semantic color names defined in `tailwind.config.js`. This allows for easy theme changes from a single location.

**Background Colors:**
- `bg-app-bg` - Main app background (pure black #000000)
- `bg-app-surface` - Cards, modals, elevated content (#1a1a1a)
- `bg-app-surface-dark` - Darker surfaces when needed (#0a0a0a)
- `bg-app-surface-light` - Lighter surfaces for hover states (#262626)

**Border Colors:**
- `border-app-border` - Primary border color (#404040)
- `border-app-border-light` - Lighter borders (#525252)
- `border-app-border-dark` - Darker borders (#262626)

**Text Colors:**
- `text-app-text` - Primary text (white #ffffff)
- `text-app-text-secondary` - Secondary text (light gray #a3a3a3)
- `text-app-text-muted` - Muted text (medium gray #737373)
- `text-app-text-subtle` - Very subtle text (#525252)

**Interactive & Status Colors:**
- `bg-app-hover` - White overlay for hover states
- `bg-app-active` - White overlay for active states
- `text-app-success`, `bg-app-success-bg` - Success colors
- `text-app-error`, `bg-app-error-bg` - Error colors
- `text-app-info` - Info color (blue)

**Destructive Actions:**
- **Muted Red**: `#8b4444` (background), `#7a3d3d` (hover) - Used for sign out buttons and other destructive actions that need to fit the app's muted aesthetic

**Brand Colors:**
- **Secondary Color**: `#3a8e8c` - App logo color, used for accent elements and calls-to-action
- **Primary Brand**: Black/white with secondary teal accents

### Changing Themes
To modify the app's color scheme:
1. Update the `app` color values in `tailwind.config.js`
2. All components will automatically use the new colors
3. No need to search/replace individual utility classes

### Current Theme: Dark Mode with Teal Accents
- Pure black backgrounds for modern dark aesthetic
- Subtle gray surfaces for content separation
- White/light gray text hierarchy for readability
- Teal secondary color (#3a8e8c) for branding and accent elements
- Blue preserved for interactive elements and info states

## Push Notifications System

### Overview
The app includes a comprehensive web push notification system that automatically notifies users of competition phase transitions.

### Features
- **Automatic Notifications**: Sent when prompts transition from ACTIVE to VOTING
- **Browser Support**: Works on Chrome, Firefox, Safari 16.4+, and Edge
- **User Control**: Users can enable/disable via profile modal
- **Debug Panel**: Accessible via `?debug` URL parameter for troubleshooting

### Technical Implementation
- **VAPID Keys**: Secure server-to-browser communication
- **Service Worker**: `/public/sw.js` handles notification display
- **Database Storage**: Push subscriptions stored in `PushSubscription` model
- **Automatic Cleanup**: Invalid subscriptions removed automatically

### Environment Variables Required
```bash
# Server-side VAPID keys (keep secret!)
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key  
VAPID_SUBJECT=mailto:admin@challengeleague.com

# Client-side VAPID key (public, safe to expose)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key
```

## Current Status Summary

**✅ Fully Working:**
- User authentication and league management
- Creative challenge submission and voting system
- Automated competition cycle management
- Multiple league support with configurable settings
- Push notification system for phase transitions
- Dark theme with semantic color system
- PostgreSQL database with automated migrations

**🔄 In Progress:**
- Enhanced UI/UX polish and animations
- Integration testing

**📋 Future Enhancements:**
- Mobile app development

## Cache Invalidation System

### Overview
Challenge League implements a comprehensive cache invalidation system using TanStack Query that ensures seamless UI updates across all pages without requiring full page refreshes.

### Architecture
- **Centralized Patterns**: `src/lib/cacheInvalidation.ts` provides predefined invalidation patterns for different user actions
- **Event-Based Sync**: Custom events broadcast cache updates to listening pages
- **Page-Specific Listeners**: Each page type has targeted cache listeners for optimal performance
- **Type-Safe Helpers**: `CacheInvalidator` class with methods like `handleSubmission()`, `handleVoting()`, `handlePhaseTransition()`

### Usage Examples
```typescript
// Enhanced mutation handling
const cacheInvalidator = useCacheInvalidator();
await cacheInvalidator.handleSubmission('submit', leagueId);
await cacheInvalidator.handleVoting('submit', leagueId);

// Page-specific listeners for automatic updates
useChallengeCacheListener(leagueId);      // Challenge page
useResultsCacheListener(leagueId);        // Results page
useStandingsCacheListener(leagueId);      // Standings page
useLeagueSettingsCacheListener(leagueId); // League Settings page
```

### Seamless Updates
The system handles these scenarios without page refreshes:
- **Submission/Voting**: Immediate state updates across Challenge, Results, and Standings pages
- **Phase Transitions**: All pages instantly reflect ACTIVE → VOTING → COMPLETED changes
- **League Actions**: Navigation indicators update immediately after any user action
- **Cross-Page Sync**: Actions on one page automatically update all other relevant pages

### Backward Compatibility
- Maintains existing `refreshLeagueActions()` function
- All current mutations continue to work
- No breaking changes to existing API

## Testing Infrastructure

### Overview
Challenge League uses a comprehensive testing setup with both unit tests (Vitest) and integration tests (Playwright) to ensure all major functionality works correctly. The testing infrastructure provides **completely isolated database environments** and **comprehensive user flow automation** without interfering with development data.

### ⚠️ **CURRENT STATUS: INTEGRATION TESTS PARTIALLY WORKING**

**Database isolation has been completely solved!** The integration test infrastructure provides true isolation. However, there are critical UI flow issues that need to be addressed to achieve true end-to-end testing.

#### 🎯 **What's Working (UI Flow Validated)**

**Database & Infrastructure**
- ✅ **Complete Database Isolation**: Test and Next.js app share dedicated test database on port 5433
- ✅ **Docker Test Environment**: Automated test container management with `docker-compose.test.yml`
- ✅ **Schema Management**: Automated Prisma schema application to test database
- ✅ **Clean Test Runs**: Each test gets fresh database state with proper cleanup

**User & League Management (Pure UI Flow)**
- ✅ **User Registration**: Complete signup flow with profile setup via UI
- ✅ **Multi-user Support**: Creates and manages multiple test users concurrently via UI
- ✅ **League Creation**: Admin creates leagues via `/app/new` form submission
- ✅ **League Joining**: Member joins leagues via UI (when working correctly)
- ✅ **Prompt Addition**: Admin adds challenges to queue via League Settings UI form

**Database State Management**
- ✅ **Prompt Queue Cleanup**: Ensures newly created leagues have clean prompt state
- ✅ **Queue Ordering**: Newly added prompts get correct queue priority (order 0)
- ✅ **Database Communication**: Test can read league state, prompts, and transitions for debugging

#### 🚨 **CRITICAL UI FLOW ISSUES REQUIRING FIXES**

**❌ Non-UI Patterns (Violates Integration Test Principles)**
1. **League Starting**: Currently bypassed with direct API call to `/api/leagues/[id]/start`
   - **Issue**: `WaitingToStartState` component not rendering despite `league.isStarted: false`
   - **Need**: Fix UI to properly show "Start League" button and handle click through UI
   - **Current Workaround**: Direct API call (not acceptable for integration testing)

**⚠️ Incomplete UI Flow Testing**
2. **Photo Submission Workflow**: Not yet tested through UI
   - **Need**: Test file upload through submission form UI
   - **Need**: Verify photo appears in submissions view

3. **Voting Workflow**: Not yet tested through UI
   - **Need**: Test voting button clicks and vote submission through UI
   - **Need**: Verify vote counts update in real-time

4. **Phase Transitions**: Currently uses admin transition buttons
   - **Need**: Verify automatic phase transitions work through UI
   - **Need**: Test manual phase transitions through admin UI buttons

5. **Results Display**: Not yet tested
   - **Need**: Verify results page shows correct rankings and photos
   - **Need**: Test standings page updates correctly

### Test Architecture

#### **Isolated Test Environment**
```
┌─────────────────────────────────────┐
│  Docker Test Database (Port 5433)   │
│  postgresql://localhost:5433/       │
│  challenge_league_test              │
└─────────────────────────────────────┘
            ↕ (DATABASE_URL)
┌─────────────────────────────────────┐
│  Next.js Test Server (Port 3005)   │
│  Serves UI with test database       │
└─────────────────────────────────────┘
            ↕ (HTTP Requests)
┌─────────────────────────────────────┐
│  Playwright Test Runner             │
│  Runs full user workflow tests     │
└─────────────────────────────────────┘
```

#### **Test Infrastructure Components**

**Docker Configuration:**
- `docker-compose.test.yml` - Dedicated PostgreSQL container for tests
- `scripts/run-integration-tests.js` - Automated test environment orchestration
- `.env.test` - Test-specific environment variables

**Test Files:**
```
tests/
├── integration/
│   └── fixed-workflow.spec.ts     # ✅ Comprehensive end-to-end test (95% working)
├── utils/
│   ├── database.ts               # ✅ Database isolation and management
│   └── test-helpers.ts           # ✅ All user workflow helpers
└── temp/                         # Temporary test files (auto-cleanup)
```

### Integration Test Goal: Complete End-to-End UI Workflow

The comprehensive integration test should validate this complete user journey **through pure UI interactions**:

#### ✅ **Currently Working (Pure UI Flow)**
1. **Account Management**
   - ✅ Create admin and member accounts via signup forms
   - ✅ Complete profile setup with photo uploads via UI

2. **League Management**
   - ✅ Create league via `/app/new` form submission (admin)
   - ✅ Add prompts to queue via League Settings form (admin)
   - ✅ Join league via invite code or league browser (member)

#### ❌ **Currently Broken (UI Issues)**
3. **League Startup**
   - ❌ **CRITICAL**: Start league via "Start League" button (admin)
   - **Issue**: `WaitingToStartState` component not rendering despite correct database state
   - **Workaround**: Currently bypassed with direct API call (not acceptable)

#### 🔄 **Not Yet Implemented (Need UI Testing)**
4. **Challenge Workflow**
   - 🔄 Submit photo responses via submission form UI (both users)
   - 🔄 Transition to voting phase via admin buttons (admin)
   - 🔄 Cast votes via voting interface UI (both users)
   - 🔄 Process results and advance to next challenge via UI

5. **Results Verification**
   - 🔄 Verify Challenge Results page displays correct rankings
   - 🔄 Verify Standings page shows updated leaderboard
   - 🔄 Verify next prompt activates automatically in UI

### ⚠️ **Priority Fix Required: WaitingToStartState Component**

**Problem**: Even when database shows `league.isStarted: false`, the UI renders the regular challenge interface instead of the `WaitingToStartState` component.

**Root Cause Analysis Needed**:
- League API `/api/leagues/[id]` returns correct `isStarted: false`
- Component logic in `page.tsx` checks `league.isStarted === false`
- Yet `WaitingToStartState` component with "Start League" button doesn't render
- Likely caching or state management issue in React Query or component lifecycle

**Must Fix Before Proceeding**: This is blocking true UI integration testing.

### Running Tests

#### **Main Integration Test (Recommended)**
```bash
# Run the isolated integration test with full environment
npm run test:integration:isolated

# This command:
# 1. Starts Docker test database
# 2. Applies database schema
# 3. Starts Next.js server with test config
# 4. Runs Playwright tests
# 5. Cleans up everything
```

#### **Manual Test Environment (For Debugging)**
```bash
# Start test database only
npm run test:db:start

# Stop test database
npm run test:db:stop

# Reset test database (removes all data)
npm run test:db:reset
```

#### **Basic Unit Tests**
```bash
# Run unit tests (Vitest)
npm test

# Run basic Playwright tests (existing)
npm run test:integration:basic
```

### Test Results Summary

#### ✅ **INFRASTRUCTURE (Production Ready)**
- **Database Isolation**: ✅ CRITICAL FIX COMPLETED - `.env.test.local` override system
  - Tests now safely use dedicated test database (port 5433)
  - Development database (port 5432) completely protected
  - Automatic cleanup of temporary environment files
- **Test Environment**: ✅ Fully automated Docker orchestration
- **Schema Management**: ✅ Automated Prisma schema application
- **UI Test Selectors**: ✅ Comprehensive `data-testid` attributes added
- **Cleanup**: ✅ Automatic teardown and file cleanup

#### ✅ **UI FLOWS WORKING (Pure UI Testing)**
- **User Registration**: ✅ Complete signup flow with profile photo upload via UI
- **League Creation**: ✅ Form submission via `/app/new` with validation
- **League Joining**: ✅ Member joins via UI (invite codes/league browser)
- **Prompt Addition**: ✅ Admin adds challenges via League Settings form
- **Database State**: ✅ Proper prompt queue cleanup and ordering

#### ✅ **CORE UI FIXES COMPLETED**
- **WaitingToStartState Rendering**: ✅ Fixed conditional logic (`!league.isStarted` vs strict `=== false`)
  - Simple test passes consistently (league creation → WaitingToStartState display)
  - Component correctly renders when `league.isStarted` is `false` or `undefined`

#### 🔄 **REMAINING UI ISSUE (Comprehensive Test Only)**
- **WaitingToStartState with Prompts**: ❌ Component doesn't render when prompts exist in queue
  - **Simple Flow**: Create league → WaitingToStartState ✅ (works)
  - **Complex Flow**: Create league → Add prompts → WaitingToStartState ❌ (fails)
  - Root cause: Prompt status logic may be overriding league startup logic

#### 🔄 **INCOMPLETE UI FLOWS (Not Yet Tested)**
- **Photo Submission**: File upload through submission form
- **Voting Interface**: Vote casting through UI buttons
- **Phase Transitions**: Manual and automatic transitions via UI
- **Results Display**: Rankings and leaderboard verification

#### 🚨 **NON-UI PATTERNS THAT NEED FIXING**
Current violations of pure UI integration testing:
1. **`startLeague()` function**: Uses direct API call instead of UI button click
2. **Database cleanup in test helpers**: Direct database manipulation (acceptable for setup)
3. **Debug functions**: Direct database queries (acceptable for verification)

#### **Next Steps for Complete Integration Testing**
1. **Debug WaitingToStartState with prompt queue** (immediate priority)
   - Issue: Component doesn't render when league has scheduled prompts
   - Investigation: Check if prompt status logic overrides league startup logic
   - Goal: Make league startup independent of prompt existence

2. **Complete remaining UI workflows** (after Step 1)
   - Photo submission via file upload form
   - Voting interface button interactions
   - Phase transitions through UI (manual and automatic)
   - Results display and navigation verification

3. **Enhanced test coverage**
   - Error handling workflows
   - Edge cases and validation
   - Multi-user concurrent testing

#### **Current Status Summary**
- **✅ Infrastructure**: Production-ready with complete database isolation
- **✅ Core UI**: Basic workflows functional with reliable selectors
- **🔄 Integration**: 95% complete, blocked on one component rendering issue
- **🎯 Goal**: Full end-to-end testing without any API shortcuts