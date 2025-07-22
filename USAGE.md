# Usage Guide - Glimpse

This guide covers how to run, develop, and use Glimpse effectively.

## Quick Start

### Running the App

**Development Mode:**
```bash
# Start the Next.js development server
npm run dev

# Open your browser to http://localhost:3000
```

**Production:**
```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
vercel --prod
```

## Command Reference

### Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build the app for production |
| `npm start` | Start production server |
| `npm run lint` | Check code for style issues |
| `npm run type-check` | Run TypeScript type checking |

### Database Commands

| Command | Description |
|---------|-------------|
| `npx prisma migrate dev` | Create and apply database migrations |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma studio` | Open database browser interface |
| `npx prisma db seed` | Seed database with sample data |
| `npx prisma db reset` | Reset database and apply all migrations |

### Deployment Commands

| Command | Description |
|---------|-------------|
| `vercel` | Deploy to Vercel preview |
| `vercel --prod` | Deploy to Vercel production |
| `vercel dev` | Run with Vercel functions locally |

## Environment Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/glimpse"

# NextAuth Configuration
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Email Configuration (for magic links/notifications)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-specific-password"
EMAIL_FROM="noreply@glimpse.com"

# File Storage - Vercel Blob (recommended)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Alternative: AWS S3 Configuration
# AWS_ACCESS_KEY_ID="your-aws-access-key"
# AWS_SECRET_ACCESS_KEY="your-aws-secret"
# AWS_S3_BUCKET="glimpse-photos"
# AWS_REGION="us-east-1"

# Optional: Analytics and Monitoring
# SENTRY_DSN="your-sentry-dsn"
# VERCEL_ANALYTICS_ID="your-analytics-id"
```

### Different Environments

**Development (`.env.local`):**
```bash
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="postgresql://localhost:5432/glimpse_dev"
```

**Production (Vercel Environment Variables):**
```bash
NEXTAUTH_URL="https://your-app.vercel.app"
DATABASE_URL="your-production-database-url"
```

## App Features Usage

### User Authentication

**Sign Up Flow:**
1. Launch app
2. Tap "Sign Up"
3. Enter email and password
4. Verify email address
5. Set up profile (name, photo, preferences)

**Sign In:**
1. Enter email and password
2. Optional: Use biometric authentication

### Receiving and Responding to Prompts

**Weekly Prompt System:**
- Prompts are sent randomly between Tuesday-Thursday each week
- You have until Sunday to respond
- Push notifications remind you to respond

**Responding to a Prompt:**
1. Open the app when you receive a notification
2. Read the prompt carefully
3. Select a photo from your gallery or take a new one
4. Write a meaningful caption
5. Choose visibility (all friends, close friends, private)
6. Submit your response

### Managing Friends

**Adding Friends:**
```
Profile → Friends → Add Friend → Search by username/email
```

**Friend Categories:**
- **All Friends**: See all your responses
- **Close Friends**: See responses marked for close friends only
- **Best Friends**: Special category with enhanced visibility

**Privacy Controls:**
- Set default visibility for responses
- Block or unfollow users
- Report inappropriate content

### Viewing the Feed

**Feed Features:**
- Chronological display of friend responses
- Filter by prompt category
- Save favorite responses to collections
- React with emoji responses
- Leave thoughtful comments

**Navigation:**
- Swipe to navigate between responses
- Tap profile photos to view user profiles
- Long press to access additional options

## Development Features

### Debug Mode

Enable debug mode in development:
```typescript
// In your .env file
DEBUG_MODE=true

// Access debug menu in app
// iOS: Shake device or Cmd+D in simulator
// Android: Shake device or Cmd+M in simulator
```

**Debug Features:**
- Network request logging
- State inspection
- Performance metrics
- Push notification testing
- Mock data generation

### Hot Reloading

Hot reloading is enabled by default in development:
- Changes to components automatically refresh
- State is preserved during updates
- Styles update instantly

### Testing Different Scenarios

**Mock Data Generation:**
```bash
# Generate sample prompts and responses
npm run dev:generate-mock-data

# Reset app state
npm run dev:reset-state

# Test push notifications
npm run dev:test-notifications
```

## Advanced Configuration

### Custom Prompt Categories

Edit `src/constants/promptCategories.ts`:

```typescript
export const customCategories = [
  {
    id: 'vacation',
    title: 'Travel Memories',
    description: 'Share your favorite vacation photo',
    icon: '✈️',
    frequency: 'monthly'
  },
  // Add more categories...
];
```

### Notification Scheduling

Configure in `src/services/notifications.ts`:

```typescript
export const notificationConfig = {
  promptDelivery: {
    dayOfWeek: [2, 3, 4], // Tuesday-Thursday
    timeRange: [10, 18], // 10 AM - 6 PM
    timezone: 'local'
  },
  reminders: {
    enabled: true,
    intervals: [24, 48, 72] // Hours before deadline
  }
};
```

### Theme Customization

Modify `src/constants/theme.ts`:

```typescript
export const theme = {
  colors: {
    primary: '#6366f1',
    secondary: '#f59e0b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937'
  },
  fonts: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    bold: 'Inter-Bold'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  }
};
```

## Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
npm run reset-cache
npm start -- --reset-cache
```

**iOS build errors:**
```bash
cd ios && pod install && cd ..
npm run ios
```

**Android build errors:**
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

**Authentication issues:**
```bash
# Check Firebase configuration
# Verify API keys in .env file
# Clear app data and try again
```

### Performance Optimization

**Image optimization:**
- Use WebP format when possible
- Implement lazy loading for feeds
- Cache images locally
- Compress uploads before sending

**Bundle size optimization:**
```bash
# Analyze bundle size
npm run analyze

# Enable Hermes (Android)
# Set hermes: true in android/app/build.gradle
```

### Monitoring and Analytics

**Error Tracking:**
- Sentry integration for crash reporting
- Custom error boundaries for graceful failures
- Performance monitoring

**Usage Analytics:**
- Track prompt response rates
- Monitor user engagement
- A/B test new features

## API Documentation

### Authentication Endpoints
```
POST /auth/register
POST /auth/login
POST /auth/refresh
DELETE /auth/logout
```

### Prompt Endpoints
```
GET /prompts/weekly
GET /prompts/history
POST /prompts/respond
PUT /prompts/response/:id
```

### Social Endpoints
```
GET /feed
POST /friends/add
GET /friends/list
POST /responses/:id/react
```

For complete API documentation, see `docs/api.md`.

## Support and Help

**Getting Help:**
- Check this usage guide first
- Search existing GitHub issues
- Join our Discord community
- Contact support through the app

**Reporting Issues:**
- Use GitHub issues for bugs
- Include reproduction steps
- Provide device/OS information
- Add screenshots when helpful

---

**Happy sharing!** 📸 If you need additional help, don't hesitate to reach out to our community or support team.