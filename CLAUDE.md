# Challenge League - Creative Competition Platform

## Project Overview
Challenge League is a creative competition web application inspired by Taskmaster, where players join leagues to compete in weekly creative challenges. Players submit photo responses to specific tasks, then vote on each other's submissions to determine winners and rankings.

**Purpose:** Foster creativity and friendly competition through engaging weekly challenges
**Development Strategy:** Web-first with PWA features, mobile app to follow later
**Core Technology Stack:**
- Frontend: Next.js 14 with TypeScript and Tailwind CSS
- Backend: Next.js API routes (same repo)
- Database: PostgreSQL with Prisma ORM (or SQLite for development)
- Authentication: NextAuth.js
- File Storage: Vercel Blob or AWS S3
- Deployment: Vercel
- Future: React Native app using same backend

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
├── lib/                # Database, auth, and utility functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── constants/          # App constants and configuration
├── public/             # Static assets
└── styles/             # Global styles and Tailwind config
```

### State Management
- Use React Context + useReducer for global state
- Server-side state management with Next.js
- Local component state for UI-specific data

### Testing Approach
- Jest for unit tests
- React Testing Library for component tests
- Playwright or Cypress for E2E testing
- Aim for 80%+ test coverage on business logic

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
- `npx prisma migrate dev --name feature-name` - Create and apply migrations locally
- `npx prisma migrate deploy` - Apply migrations to production (safe)
- `npx prisma migrate reset` - Reset local database (removes all data)
- `npx prisma generate` - Generate Prisma client
- `npx prisma studio` - Open database browser
- `npm run db:seed` - Seed database with test data

### Deployment (Prisma Migration Workflow)
- `git push` - Deploy code to Vercel (triggers build)
- `npx prisma migrate deploy` - Apply database migrations to production
- `npx prisma migrate status` - Check migration status

## Core App Specifications

### 2-Phase Competition Cycle
- **Submission Phase**: 7 days to submit creative responses
- **Voting Phase**: 2 days to vote on submissions
- **Results**: Winners announced immediately after voting ends, next challenge begins

### Main App Features
1. **League Dashboard**: Overview of competition status, personal stats, and leaderboard
2. **Task Submission**: Current challenge with creative prompts, photo upload, caption input
3. **Voting Interface**: Instagram-style feed with double-tap voting and vote buttons
4. **Results Gallery**: View ranked results from completed challenges
5. **Leaderboard**: League standings based on total points earned

### Competition Rules
- Players automatically join the "Main League" upon registration
- No editing responses after submission
- Players see "waiting for voting" state after submitting
- Confirmation step required before submitting
- Players cannot vote for their own submissions
- Each player gets exactly 3 votes to cast (1 vote per submission, each vote = 1 point)
- Double-tap photos or use vote buttons to cast votes
- Photos automatically deleted after each cycle (no permanent history)
- Rankings based on total vote points received
- No grace period for submission or voting deadlines

### Creative Challenge System
- **Diverse Prompts**: Wide variety of creative tasks covering cooking, photography, art, adventure, and more
- **Sample Tasks**:
  - "Submit a photo of a beautiful dinner you made this week"
  - "Create something artistic with household items and share the result"
  - "Capture an interesting shadow or reflection in your daily life"
  - "Visit somewhere you've never been before and document it"
  - "Show us your workspace or favorite creative corner"
  - "Photograph something that represents your mood today"

### League System
- Single "Main League" for all players initially
- League-wide visibility for all submissions and results
- Comprehensive leaderboard tracking:
  - Total points across all challenges
  - Number of wins (1st place finishes)
  - Podium finishes (top 3 placements)
  - Total challenges participated in
  - Average ranking

### Voting System
- Anonymous voting with public results
- Instagram-style interface with double-tap voting
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
- Auto-assignment to Main League
- No offline functionality required

## Development Phases

### Phase 1: Competition MVP ✅ COMPLETED
1. Next.js app setup with TypeScript and Tailwind
2. User authentication with NextAuth.js
3. League system with auto-assignment
4. 2-phase competition cycle (submit → vote → results)
5. Creative task system with categories and difficulty
6. Photo upload and caption submission
7. Instagram-style voting interface with double-tap functionality
8. League dashboard with multiple tabs
9. Leaderboard with comprehensive stats
10. Automatic cycle management and vote calculation

### Phase 2: Enhanced Competition Features
1. PWA configuration for mobile-like experience
2. Web push notifications for phase transitions
3. Enhanced UI/UX polish with animations
4. Performance optimizations
5. Multiple league support
6. Advanced task categories and challenges
7. Achievement system and badges
8. User profile management
9. Photo editing tools
10. Social sharing features

### Phase 3: Mobile App
1. React Native app using existing backend API
2. Native push notifications for voting reminders
3. Enhanced mobile photo capture and editing
4. Mobile-optimized voting interface
5. App store deployment (iOS and Android)
6. Feature parity with web version
7. Offline draft submissions
8. Native camera integration

## Database Schema (Key Models)

### User
- Standard authentication fields
- Username (unique identifier)
- League memberships (many-to-many)
- Responses and votes

### League
- Name and description
- Active status
- Member count
- Auto-assignment for new users

### Prompt (Challenge)
- Text description and category
- Difficulty level (1-3)
- 2-phase timing (submit, vote)
- Status: SCHEDULED → ACTIVE → VOTING → COMPLETED
- Queue order for automatic progression

### Response (Submission)
- Photo URL and caption
- Vote tracking (total votes, points, final rank)
- Publication status
- User and prompt relationships

### Vote
- Ranked voting (1st, 2nd, 3rd place)
- Point values (3, 2, 1)
- Voter and response relationships
- Prevents self-voting and duplicate ranks

## Automated Systems

### Cron Jobs
- Runs every 12 hours to check phase transitions
- Automatically moves ACTIVE prompts to VOTING when submission deadline passes
- Calculates vote results and moves VOTING prompts to COMPLETED
- Activates next scheduled prompt when no active prompt exists
- Cleans up old photos from completed challenges

### Admin Interface
- Creative task management with categories and difficulty
- Queue reordering and editing
- Manual cycle processing for testing
- Comprehensive prompt status overview
- Real-time queue processing controls

## Test Data
- 6 test players (player1-player6@example.com)
- Main League with sample challenges
- Pre-populated voting data and rankings
- Multiple challenge categories represented
- Complete competition cycle examples

This transformed Challenge League into a engaging creative competition platform that encourages regular participation, creativity, and friendly competition among players!

## Database Development Workflow

Challenge League uses **PostgreSQL for both development and production** with Prisma's recommended migration workflow for safe, version-controlled database changes.

### Local Development Setup

```bash
# Start PostgreSQL container
docker compose up -d

# Set up database with initial schema
npx prisma migrate dev --name init

# Seed with test data
npm run db:seed

# Start development server
npm run dev
```

### Making Database Schema Changes

Follow this **3-step workflow** for any database changes:

#### Step 1: Develop and Test Locally

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration locally
npx prisma migrate dev --name describe-your-change

# 3. Test your changes thoroughly
npm run dev

# 4. Update any affected TypeScript types/code
```

#### Step 2: Deploy Code Changes  

```bash
# Commit ALL files including migration files
git add .
git commit -m "Add feature: describe-your-change"

# Push to GitHub (triggers Vercel deployment)
git push
```

#### Step 3: Apply Database Changes to Production

```bash
# Apply migrations to production database (SAFE)
npx prisma migrate deploy
```

### Important Migration Rules

**✅ ALWAYS commit migration files** - Never let production auto-generate migrations  
**✅ Use `migrate deploy` for production** - Only applies new migrations, never modifies existing data  
**✅ Test locally first** - Create and test all changes in development  
**❌ Never use `db push` or `migrate dev` in production** - These bypass the migration system  

### Common Database Commands

```bash
# Local development
docker compose up -d              # Start PostgreSQL
npx prisma migrate reset          # Reset local DB (removes all data)
npx prisma studio                 # Browse database
npx prisma generate              # Generate Prisma client

# Production (SAFE operations)
npx prisma migrate status        # Check pending migrations
npx prisma migrate deploy        # Apply pending migrations
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

### New League Startup Feature

Added `isStarted` boolean field to League model:
- New leagues start with `isStarted: false`
- League owners must manually start their leagues
- Only started leagues process prompt queues automatically
- Provides proper onboarding and control for league creators

## High Priority Refactoring Tasks

The following refactoring tasks have been identified as high priority for improving code quality, maintainability, and developer experience:

### ✅ Completed Refactorings
- **Type Consolidation** - Centralized all TypeScript type definitions into `/src/types/` directory with proper organization and barrel exports. Eliminated duplicate types across 15+ files.
- **Standardize API Route Error Handling** - Created consistent error response format across all API endpoints with centralized `ApiError` classes, proper status codes, and structured error responses. Enhanced `createApiHandler` to use standardized error handling.

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

### Changing Themes
To modify the app's color scheme:
1. Update the `app` color values in `tailwind.config.js`
2. All components will automatically use the new colors
3. No need to search/replace individual utility classes

### Current Theme: Instagram Dark Mode
- Pure black backgrounds for modern dark aesthetic
- Subtle gray surfaces for content separation
- White/light gray text hierarchy for readability
- Blue accents preserved for interactive elements