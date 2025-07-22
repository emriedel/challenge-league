# Glimpse - Claude's Project Memory

## Project Overview
Glimpse is a social media web application that encourages meaningful sharing through weekly photo prompts. Users get one prompt per week and have exactly one week to submit a photo and caption. All responses are published simultaneously when the submission window closes, creating a shared moment of discovery.

**Purpose:** Create a more intentional social media experience that values quality over quantity
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
- React Native Testing Library for component tests
- Detox for E2E testing
- Aim for 80%+ test coverage on business logic

## Important Commands

### Development
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Check code style
- `npm run type-check` - TypeScript type checking

### Database
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma generate` - Generate Prisma client
- `npx prisma studio` - Open database browser
- `npx prisma db seed` - Seed database with test data

### Deployment
- `vercel` - Deploy to Vercel
- `vercel --prod` - Deploy to production
- `vercel dev` - Local development with Vercel functions

## Core App Specifications

### Weekly Cycle
- **Reset Time**: Every Saturday at 12:00 PM Pacific Time
- **Submission Window**: 7 days to submit response to current prompt
- **Publication**: All responses published simultaneously when window closes
- **Next Prompt**: Immediately available after previous responses are published

### Main App Pages
1. **Gallery Page**: View last week's responses from friends (feed-style scroll)
2. **Submit Page**: Current prompt, photo upload, caption input, countdown timer

### User Experience Rules
- No editing responses after submission
- Users see "waiting for others" state after submitting
- Confirmation step required before submitting
- Photos automatically deleted after each cycle (no permanent history)
- Random feed ordering
- Username displayed prominently with each response
- No grace period for submission deadline

### Friend System
- Username-based friend discovery and adding
- Friends-only visibility for all responses
- No interaction features (likes/comments) initially

### Username Requirements
- 3-30 characters length
- Letters, numbers, underscores, hyphens only
- Must start with letter or number
- Case insensitive but preserves display case
- Globally unique
- Reserved words blocked

### Authentication
- Email and password based account creation
- Basic onboarding flow explaining the app
- No offline functionality required

## Development Phases

### Phase 1: Web MVP
1. Next.js app setup with TypeScript and Tailwind
2. User authentication with NextAuth.js
3. Basic onboarding flow
4. Weekly prompt system with countdown timer
5. Photo upload and caption submission
6. Friend system (search and add by username)
7. Gallery page for viewing responses
8. Submit page with confirmation step
9. Automatic photo cleanup after each cycle

### Phase 2: Enhanced Web Features
1. PWA configuration for mobile-like experience
2. Web push notifications for prompt availability
3. Enhanced UI/UX polish
4. Performance optimizations
5. Advanced prompt categories
6. User profile management

### Phase 3: Mobile App
1. React Native app development
2. Native push notifications
3. Enhanced mobile user experience
4. App store deployment
5. Feature parity with web version