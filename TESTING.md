# Challenge League Testing Infrastructure

## Overview

This project uses a comprehensive testing setup with both unit tests (Vitest) and integration tests (Playwright) to ensure all major functionality works correctly. The testing infrastructure provides **isolated database environments** and **comprehensive user flow automation** without interfering with development data.

## Test Structure

```
tests/
├── integration/               # End-to-end integration tests
│   ├── simplified-user-flow.spec.ts       # ✅ WORKING - Basic user flows
│   ├── comprehensive-user-flow.spec.ts     # 🔧 IN PROGRESS - Full workflow
│   ├── final-comprehensive-flow.spec.ts    # 🔧 ALTERNATIVE - Complete flow
│   ├── working-user-journey.spec.ts        # ✅ WORKING - UI validation
│   ├── debug-*.spec.ts                     # 🔧 DEBUG - Development helpers
│   └── test-prompt-addition.spec.ts        # 🔧 IN PROGRESS - Prompt management
├── unit/                      # Unit tests (basic setup)
│   └── example.test.ts        
└── utils/                     # Test utilities and helpers
    ├── database.ts           # ✅ Database isolation & cleanup
    └── test-helpers.ts       # ✅ Comprehensive user flow helpers
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

## Implementation Status

### ✅ **FULLY WORKING** - Core User Flow Testing

#### `simplified-user-flow.spec.ts`
**Multi-user league workflow that successfully tests:**

- ✅ **User Registration**: Unique account creation with proper validation
- ✅ **League Creation**: Admin creates league with form validation
- ✅ **Multi-User Coordination**: Second user registration and league joining  
- ✅ **Database Isolation**: Each test gets isolated database, no dev data interference
- ✅ **Cleanup**: Automatic test database and file cleanup

#### `working-user-journey.spec.ts` 
**UI validation and user interface testing:**

- ✅ **Form Validation**: Registration and sign-in form validation
- ✅ **Navigation**: Links and page transitions  
- ✅ **Performance**: Page load under 10 seconds
- ✅ **Security**: Protected routes authentication
- ✅ **Accessibility**: Keyboard navigation support
- ✅ **Responsive**: Mobile viewport compatibility  
- ✅ **Error Detection**: No critical console errors

### 🔧 **IN PROGRESS** - Advanced Workflow Features

#### Core User Flow Requirements (Your Original Plan)
**Progress on comprehensive workflow testing:**

**✅ IMPLEMENTED & WORKING:**
- ✅ **Account Creation**: Unique user registration with proper validation
- ✅ **Profile Photo Upload**: File upload functionality with cleanup
- ✅ **League Creation**: Admin creates league with form validation
- ✅ **League Settings Access**: Admin-only League Settings page navigation
- ✅ **Multi-User Coordination**: Second user registration and league joining
- ✅ **Database Isolation**: Complete database isolation between tests
- ✅ **Page Navigation**: Challenge, Results, Standings page accessibility
- ✅ **User Interface Validation**: All main UI components tested

**🔧 PARTIALLY IMPLEMENTED (Helpers Ready, Needs Refinement):**
- 🔧 **Prompt Addition**: League Settings navigation works, but form interaction needs refinement
- 🔧 **Photo Submissions**: Helper function implemented, needs validation with actual challenge flow
- 🔧 **Phase Transitions**: Helper function exists, needs alignment with actual UI state management
- 🔧 **Voting System**: Voting helper implemented, needs integration with proper league phases
- 🔧 **Results Processing**: Basic page navigation works, needs vote calculation verification

**❓ NEEDS INVESTIGATION:**
- ❓ **League Prompt Management**: Leagues come pre-seeded with challenges, add form may be conditionally shown
- ❓ **Phase State Management**: Understanding when leagues are in submission vs voting vs results phases
- ❓ **UI Element Discovery**: Some admin controls may require specific league states to be visible

## Test Infrastructure Features

### 🔒 **Database Isolation & Safety**
- ✅ Each test gets a completely isolated SQLite database (`test-{timestamp}-{random}.db`)
- ✅ **SAFETY CHECKS**: Cannot accidentally use development database (`dev.db`)
- ✅ Automatic cleanup of test databases after each test
- ✅ Orphaned test database cleanup utilities
- ✅ No interference with development data or other tests running concurrently

### 📁 **File Upload & Management**
- ✅ Creates temporary PNG test images for profile photos and submissions
- ✅ Validates actual file upload functionality
- ✅ Automatic cleanup of test files and temp directories
- ✅ Proper file handling in isolated test environment

### 👥 **Multi-User & Concurrency**
- ✅ Multiple browser contexts for true multi-user simulation
- ✅ Concurrent user actions and league interactions
- ✅ Unique user generation (timestamp + random ID) to prevent conflicts
- ✅ Proper isolation between user sessions

### 📊 **Test Utilities & Helpers**
- ✅ **`tests/utils/database.ts`**: Complete database utilities with schema creation
- ✅ **`tests/utils/test-helpers.ts`**: Comprehensive user flow helpers
- ✅ **User Management**: `createTestUser()`, `registerUser()`, `signInUser()`
- ✅ **League Management**: `createLeague()`, `joinLeagueById()`, `addPromptToLeague()`
- ✅ **Media Handling**: `uploadProfilePhoto()`, `submitChallengeResponse()`
- ✅ **Admin Functions**: `transitionLeaguePhase()`, League Settings navigation
- ✅ **Voting System**: `castVotes()` with proper vote allocation

### 🎯 **Error Handling & Debugging**
- ✅ Comprehensive error screenshots and videos on failures
- ✅ Console error monitoring during test execution
- ✅ Detailed error context and DOM snapshots
- ✅ Debug test files for investigating UI element discovery
- ✅ Performance assertions (page load times)

## What We've Learned About The App

### 🏗️ **UI Architecture Insights**
- **League Settings Tab**: Admin-only tab appears in league navigation, not as separate page
- **Profile Overlays**: Profile modals can interfere with element interactions, need to be closed
- **Pre-seeded Data**: New leagues come with 8 challenges (1 active + 7 scheduled) from seed data
- **Form Validation**: League creation requires both name and description despite "optional" label
- **Admin Controls**: Phase transition and prompt management only visible to league owners

### 📋 **Test Data Patterns**
- ✅ Unique user generation: `test{suffix}{timestamp}{randomId}` (length limited to 30 chars)
- ✅ Email format: `testuser{id}@example.com`
- ✅ League names: `{Purpose} League {timestamp}` 
- ✅ Fresh database per test with proper schema creation matching Prisma `@@map` directives
- ✅ No dependency on development seed data

## Next Steps for Full Test Coverage

### 🎯 **Immediate Priorities**

1. **Prompt Addition Form Discovery**
   - Investigate when "Add Challenge" form appears in League Settings
   - May require clearing existing challenge queue or different league state
   - Debug test files created: `debug-league-settings-page.spec.ts`, `debug-prompt-form.spec.ts`

2. **Phase State Management**
   - Understand league phase lifecycle (submission → voting → results)
   - Identify UI elements that trigger phase transitions
   - Test phase-specific UI element visibility

3. **Photo Submission Integration**
   - Validate `submitChallengeResponse()` with active challenges
   - Test file upload in actual league challenge context
   - Verify submission confirmation and UI feedback

### 🔧 **Enhancement Opportunities**

4. **Voting Flow Completion**
   - Test voting phase activation and UI changes
   - Validate vote submission and confirmation
   - Test vote count calculations and results

5. **Results Processing**
   - Verify challenge completion and results display
   - Test ranking calculations and leaderboard updates
   - Validate next challenge activation

6. **Error Scenario Testing**
   - Test form validation edge cases
   - Test network failure scenarios
   - Test concurrent user conflict resolution

## Troubleshooting

### ❌ **Common Issues & Solutions**

**League Creation Timeouts:**
```bash
# Check if profile overlay is blocking interaction
# Debug test includes overlay closing patterns
npx playwright test debug-league-settings.spec.ts
```

**Database Conflicts:**
```bash
# Our tests are completely isolated, but if you see database errors:
npm run test:cleanup  # Removes orphaned test databases
npm run db:setup     # Resets development database (unrelated to tests)
```

**Element Not Found:**
```bash
# Use debug tests to investigate element selectors
npx playwright test debug-prompt-form.spec.ts --reporter=line
# Check screenshots in test-results/ directory
```

### 🔧 **Development Workflow**

**Running Specific Test Groups:**
```bash
# Working tests only
npx playwright test simplified-user-flow.spec.ts working-user-journey.spec.ts

# Debug/development tests  
npx playwright test debug-*.spec.ts

# Comprehensive workflow (in progress)
npm run test:integration:comprehensive
```

**Test Development:**
```bash
# Run with UI for debugging
npx playwright test --ui

# Generate test code
npx playwright codegen localhost:3000
```

## Adding New Tests

### Integration Test Template
```typescript
import { test, expect } from '@playwright/test';
import { resetTestDb, cleanupTestDb } from '../utils/database';
import { createTestUser, registerUser, cleanupTestFiles } from '../utils/test-helpers';

test.describe('Your Test Suite', () => {
  test.beforeEach(async () => {
    await resetTestDb(); // Fresh isolated database
  });

  test.afterEach(async () => {
    await cleanupTestDb(); // Cleanup database and files
    cleanupTestFiles();
  });

  test('your test scenario', async ({ page }) => {
    // Use helpers for common flows
    const user = createTestUser('test');
    await registerUser(page, user);
    
    // Your test logic here
    expect(page.url()).toContain('/profile/setup');
  });
});
```

### Extending Test Helpers

Add new helpers to `tests/utils/test-helpers.ts`:
```typescript
export async function yourNewHelper(page: Page, ...params): Promise<void> {
  console.log('🔧 Your action...');
  
  // Implementation
  
  console.log('✅ Action completed');
}
```

## Summary

**🎉 Current State: SOLID FOUNDATION ESTABLISHED**

The testing infrastructure successfully provides:
- ✅ **Safe isolated testing** with no development data interference
- ✅ **Core user workflows** completely automated and tested
- ✅ **Multi-user scenarios** with proper session isolation
- ✅ **Comprehensive test utilities** for all major app features
- ✅ **Debugging capabilities** for investigating UI interactions

**🚀 Ready for:** Production use of existing test suite and incremental enhancement of advanced features.