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

### Weekly Prompt System

**How It Works:**
- New prompts release every Saturday at 12:00 PM Pacific Time
- You have exactly 7 days to submit your response
- All responses are published simultaneously when the window closes
- Next prompt becomes available immediately after publication

**Responding to a Prompt:**
1. Visit the Submit page to see the current prompt
2. Upload a photo from your device
3. Write a meaningful caption (required)
4. Review your submission in the confirmation dialog
5. Submit your response (cannot be edited after submission)
6. See "waiting for others" status until the cycle ends

### Friend System

**Adding Friends:**
- Search for friends by their unique username
- Send friend requests that must be accepted
- Only friends can see your responses

**Friend Management:**
- View your friends list
- Remove friends if needed
- All responses are friends-only (no public sharing)

**Username Requirements:**
- 3-30 characters long
- Letters, numbers, underscores, and hyphens only
- Must start with a letter or number
- Globally unique across all users

### Gallery Page

**Viewing Responses:**
- See all friends' responses from the previous week
- Responses are displayed in random order
- Each response shows the username, photo, and caption
- No interaction features (likes/comments) in initial version

**Gallery Features:**
- Scroll through all submitted responses
- View full-size photos by clicking
- See which prompt the responses were for
- Clean, distraction-free viewing experience

## Development Features

### Development Mode

Next.js development features:
```bash
# Start development server with hot reloading
npm run dev

# Access at http://localhost:3000
```

**Development Features:**
- Hot reloading for instant updates
- TypeScript error checking
- Automatic code formatting
- Development-only debug logs

### Database Development

**Working with Prisma:**
```bash
# View your database in browser
npx prisma studio

# Reset database and apply all migrations
npx prisma db reset

# Generate new migration after schema changes
npx prisma migrate dev --name your-migration-name
```

### Testing the App

**Manual Testing:**
- Use database seeding to create test users and prompts
- Test the weekly cycle by adjusting system time
- Upload test images to verify file storage
- Test friend requests and user interactions

## Advanced Configuration

### Configuration

**Environment Variables:**
Customize your development setup in `.env.local`:

```bash
# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# NextAuth configuration
NEXTAUTH_SECRET="your-development-secret"
NEXTAUTH_URL="http://localhost:3000"

# File storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN="your-development-token"
```

**Customizing Prompts:**
Add new prompts by seeding the database or using the admin interface:

```bash
# Run database seed script
npx prisma db seed
```

**Styling and Theme:**
- Tailwind CSS configuration in `tailwind.config.js`
- Global styles in `src/app/globals.css`
- Component-specific styles using Tailwind classes

## Troubleshooting

### Common Issues

**Next.js build errors:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Database connection issues:**
```bash
# Reset database
npx prisma db reset

# Regenerate Prisma client
npx prisma generate
```

**Authentication issues:**
```bash
# Check environment variables
# Verify NEXTAUTH_SECRET is set
# Clear browser cookies and try again
```

**File upload issues:**
```bash
# Verify BLOB_READ_WRITE_TOKEN is correct
# Check file size limits
# Ensure proper file permissions
```

### Performance Optimization

**Image optimization:**
- Next.js Image component with automatic optimization
- Vercel Blob automatic image processing
- Lazy loading for gallery images
- Responsive image sizes

**Web performance:**
```bash
# Analyze bundle size
npx @next/bundle-analyzer

# Build for production and test
npm run build
npm start
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

## API Routes

### Authentication (NextAuth.js)
```
GET/POST /api/auth/* - NextAuth.js endpoints
```

### Core Endpoints
```
GET /api/prompts/current - Get current week's prompt
GET /api/responses - Get gallery responses
POST /api/responses - Submit response
GET /api/friends - Get friends list
POST /api/friends - Add friend
```

### File Upload
```
POST /api/upload - Upload photos to Vercel Blob
```

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