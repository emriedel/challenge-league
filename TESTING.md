# Testing Guide

## Overview

This project uses a comprehensive testing setup with both unit tests (Vitest) and integration tests (Playwright) to ensure all major functionality works correctly.

## Test Structure

```
tests/
├── integration/               # End-to-end integration tests
│   ├── complete-user-journey.spec.ts  # Main comprehensive test
│   └── setup-verification.spec.ts     # Basic setup verification
├── unit/                      # Unit tests
│   └── example.test.ts        # Example unit test
└── utils/                     # Test utilities and helpers
    ├── database.ts           # Database setup/cleanup utilities
    └── test-helpers.ts       # Common test helper functions
```

## Available Commands

### Setup
```bash
npm run test:setup          # Install Playwright browsers (run once)
```

### Running Tests
```bash
npm test                    # Run unit tests in watch mode
npm run test:unit           # Run unit tests once
npm run test:integration    # Run integration tests
npm run test:integration:ui # Run integration tests with UI
npm run test:all            # Run both unit and integration tests
```

### Test Specific Groups
```bash
npm run test:integration:basic          # Run basic UI tests (Simple User Flow)
npm run test:integration:comprehensive  # Run comprehensive user journey tests
npm run test:cleanup                    # Clean up test files and databases
npm run test:integration -- --grep "Setup Verification"  # Run database setup tests
```

## Working Integration Tests

### ✅ Simple User Flow (`simple-flow.spec.ts`)
**Status: WORKING** - Basic UI and navigation tests:

- Homepage loads and redirects properly for unauthenticated users
- Sign up form is accessible with proper validation
- Sign in form loads correctly  
- Protected routes require authentication
- Navigation between public pages works
- Pages load without critical errors
- Basic performance benchmarks (page load under 10s)

### ✅ Working User Journey (`working-user-journey.spec.ts`)
**Status: WORKING** - Comprehensive user interface testing:

- **Form Validation Testing**: Registration and sign-in form validation works
- **Navigation Testing**: Links and page transitions function correctly
- **Performance Testing**: All pages load under 10 seconds
- **Security Testing**: Protected routes properly require authentication
- **Accessibility Testing**: Keyboard navigation and form accessibility
- **Responsive Testing**: Mobile viewport compatibility
- **Error Detection**: No critical console errors during user flows

### 🚧 Database-Integrated Tests (`complete-user-journey.spec.ts`) 
**Status: IN DEVELOPMENT** - Full database integration covering:

### Phase 1: User Registration & Setup
- ✅ Create new account with email/password
- ✅ Upload profile photo
- ✅ Basic authentication flow

### Phase 2: League Creation & Management  
- ✅ Create new league
- ✅ Add prompts via League Settings page
- ✅ Transition league phases

### Phase 3: Multi-User Participation
- ✅ Register second user
- ✅ Join existing league
- ✅ Multi-user coordination

### Phase 4: Challenge Submissions
- ✅ Submit photo responses with captions
- ✅ File upload validation
- ✅ Multiple user submissions

### Phase 5: Voting System
- ✅ Transition to voting phase
- ✅ Cast votes (3 votes per user)
- ✅ Prevent self-voting
- ✅ Vote calculation

### Phase 6: Results & Navigation
- ✅ Process results and rankings
- ✅ Challenge Results page loads
- ✅ Standings page displays correctly
- ✅ Next prompt activation

### Phase 7: Database Verification
- ✅ Verify all data persisted correctly
- ✅ Check relationships and constraints
- ✅ Validate vote calculations

### Phase 8: Performance & Error Checking
- ✅ Page load time assertions (< 5s for key pages)
- ✅ Console error monitoring
- ✅ No JavaScript errors during flow

## Test Features

### Database Isolation
- Each test gets a fresh SQLite database
- Automatic cleanup between tests
- No interference between test runs

### File Upload Testing
- Creates temporary test images
- Validates upload functionality
- Automatic cleanup of test files

### Multi-User Simulation
- Multiple browser contexts
- Concurrent user actions
- Race condition testing

### Performance Monitoring
- Basic load time assertions
- Console error tracking
- Network request validation

## Test Data

Tests use isolated test data:
- Unique usernames and emails per test run
- Fresh database for each test
- No dependency on seed data

## Troubleshooting

### Playwright Setup Issues
```bash
# If browsers fail to install
npm run test:setup
# Or manually:
npx playwright install
```

### Database Issues
```bash
# Reset development database if tests affect it
npm run db:setup
```

### Port Conflicts
Tests expect the dev server to run on port 3000. Make sure:
```bash
npm run dev  # Should be running on localhost:3000
```

## Adding New Tests

### Unit Tests
Add to `tests/unit/` directory:
```typescript
import { describe, it, expect } from 'vitest';

describe('My Component', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Integration Tests
Add to `tests/integration/` directory:
```typescript
import { test, expect } from '@playwright/test';

test('should test user flow', async ({ page }) => {
  await page.goto('/');
  // Test implementation
});
```

## CI/CD Integration

The tests are designed to run locally. For CI/CD integration, you would typically:

1. Set up test database
2. Start application server
3. Run test suite
4. Generate reports

This setup is optimized for development workflow and manual test execution.