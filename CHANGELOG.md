# Changelog

All notable changes to Glimpse will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Multiple league support planning
- Achievement system design
- PWA capabilities planning

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

---

## [1.0.0] - 2025-07-25

### Added
- **Competition Game Transformation**
  - Complete pivot from social media to Taskmaster-inspired competition
  - League system with Main League auto-assignment
  - 3-phase competition cycle (Submit → Vote → Results)
  - Weighted voting system (3pts, 2pts, 1pt)
  - Comprehensive leaderboard with statistics tracking

- **Creative Challenge System**
  - Task categories: Cooking, Creativity, Photography, Adventure, Design, Fitness, Art, DIY
  - Difficulty levels: Easy ⭐, Medium ⭐⭐, Hard ⭐⭐⭐
  - Admin interface for challenge management
  - Queue system for automated challenge progression

- **Voting & Competition Features**
  - Anonymous 3-choice ranked voting
  - Automatic result calculation and ranking
  - Points tracking and league standings
  - Anti-gaming measures (no self-voting)
  - Real-time competition status updates

- **Database Schema**
  - League and LeagueMembership models
  - Vote model with ranked scoring
  - Enhanced Prompt model with categories and 3-phase timing
  - Response model with vote tracking and final rankings

- **Admin System**
  - Challenge creation with categories and difficulty
  - Queue management and reordering
  - Manual cycle processing for testing
  - Real-time system monitoring

- **Automated Systems**
  - Cron jobs for cycle transitions (every 12 hours)
  - Automatic vote calculation and ranking
  - Photo cleanup for completed challenges
  - Seamless phase progression

### Changed
- **Complete App Restructure**
  - Gallery page → League Dashboard with tabbed interface
  - Friend-based sharing → League-wide competition
  - Simple prompts → Creative challenges with categories
  - Static responses → Voted and ranked submissions

- **User Experience**
  - Registration now auto-joins Main League
  - Dashboard shows competition status, personal stats, and leaderboard
  - Voting interface with interactive submission ranking
  - Results view with trophy rankings and point totals

### Removed
- **Social Media Features**
  - Friendship system completely removed
  - Friend-based response visibility
  - Social media style gallery browsing
  - Private sharing between friends

### Fixed
- Database migration issues with new schema
- TypeScript errors with new models
- Admin access authentication
- Photo upload system compatibility

### Security
- Admin access controls for challenge management
- Cron job security with secret tokens
- Vote integrity with anti-gaming measures

---

## [0.1.0] - 2025-07-22

### Added
- **Project Foundation**
  - Initial Next.js 14 project with TypeScript
  - Tailwind CSS styling system
  - NextAuth.js authentication
  - Prisma ORM with SQLite/PostgreSQL support
  - Vercel Blob file storage integration

- **Original Social Media Features**
  - Weekly photo prompt system
  - Friend-based sharing network
  - Gallery for viewing friends' responses
  - Photo upload with drag-and-drop
  - Caption writing interface

- **Documentation**
  - Comprehensive README with project overview
  - CLAUDE.md for project memory and guidelines
  - CONTRIBUTING.md with development standards
  - USAGE.md with detailed command reference
  - DEVELOPMENT.md with testing procedures

- **Development Setup**
  - Environment variable configuration
  - Database seeding system
  - Development, staging, and production environments
  - Hot reloading and type checking
  - ESLint and Prettier configuration

### Changed
- N/A (Initial release)

### Security
- NextAuth.js authentication system
- Environment variable setup for sensitive configuration
- Basic admin access controls

---

## Planned Releases

### [2.0.0] - Enhanced Competition Features
**Expected: Q3 2025**

#### Planned Features
- Multiple league support with private leagues
- Achievement system and badges
- Enhanced competition statistics
- PWA capabilities with push notifications
- Advanced challenge categories
- Photo editing tools integration
- Social sharing of results

### [2.1.0] - Advanced Voting
**Expected: Q4 2025**

#### Planned Features
- Voting analytics and insights
- Challenge difficulty-based scoring
- Seasonal competitions and tournaments
- Community-created challenges
- Enhanced admin moderation tools

### [3.0.0] - Mobile App
**Expected: Q1 2026**

#### Planned Features
- React Native mobile application
- Native camera integration
- Push notification system
- Offline submission drafts
- Enhanced mobile voting interface
- App store deployment (iOS and Android)

---

## Release Notes Template

Use this template for future releases:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features and functionality
- New files, dependencies, or configurations

### Changed
- Changes to existing functionality
- Updates to documentation or dependencies
- Behavior modifications

### Deprecated
- Features marked for removal in future versions
- Backwards compatibility warnings

### Removed
- Deleted features, files, or functionality
- Dependency removals

### Fixed
- Bug fixes and issue resolutions
- Performance improvements
- Error corrections

### Security
- Security improvements and fixes
- Vulnerability patches
- Privacy enhancements
```

---

## Versioning Strategy

We follow Semantic Versioning (SemVer):

- **MAJOR** version when making incompatible API changes
- **MINOR** version when adding functionality in a backwards compatible manner
- **PATCH** version when making backwards compatible bug fixes

Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.