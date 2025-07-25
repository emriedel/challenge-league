# Usage Guide - Glimpse Competition League

This guide covers how to run, develop, and use Glimpse's creative competition platform effectively.

## Quick Start

### Running the App

**Development Mode:**
```bash
# Start the Next.js development server
npm run dev

# Open your browser to http://localhost:3000 (or the port shown)
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
| `npx prisma migrate reset --force` | Reset database completely |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma studio` | Open database browser interface |
| `npx prisma db seed` | Seed database with competition data |
| `npx tsx prisma/seed.ts` | Run seed script directly |

### Deployment Commands

| Command | Description |
|---------|-------------|
| `vercel` | Deploy to Vercel preview |
| `vercel --prod` | Deploy to Vercel production |
| `vercel dev` | Run with Vercel functions locally |

## Environment Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Database Configuration (SQLite for development)
DATABASE_URL="file:./dev.db"

# NextAuth Configuration
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# File Storage - Vercel Blob (optional for development)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Cron Security (for production)
CRON_SECRET="your-cron-secret-here"

# Optional: Analytics and Monitoring
# SENTRY_DSN="your-sentry-dsn"
# VERCEL_ANALYTICS_ID="your-analytics-id"
```

### Different Environments

**Development (`.env`):**
```bash
NEXTAUTH_URL="http://localhost:3000"
DATABASE_URL="file:./dev.db"
```

**Production (Vercel Environment Variables):**
```bash
NEXTAUTH_URL="https://your-app.vercel.app"
DATABASE_URL="your-production-postgresql-url"
BLOB_READ_WRITE_TOKEN="your-production-blob-token"
CRON_SECRET="your-production-cron-secret"
```

## Competition Features Usage

### Player Authentication

**Sign Up Flow:**
1. Visit the app and click "Sign Up"
2. Enter email and password
3. Choose a unique username (letters, numbers, underscores, hyphens)
4. Automatically join the Main League
5. Start competing immediately

**Test Accounts:**
- `player1@example.com` / `password123` (Admin access)
- `player2@example.com` / `password123`
- `player3@example.com` / `password123`
- (etc. through player6)

### League Dashboard

**Overview Tab:**
- See current competition status
- View your personal statistics
- Check recent challenge activity
- Quick access to voting (when active)

**Voting Tab:**
- Vote on submissions when voting is open
- Select your top 3 favorites (1st, 2nd, 3rd place)
- Cannot vote for your own submission
- Weighted scoring: 3pts, 2pts, 1pt

**Results Tab:**
- View latest completed challenge results
- See rankings with trophy icons (🥇🥈🥉)
- Check point totals and final standings

**Leaderboard Tab:**
- Full league standings
- Total points, wins, and podium finishes
- Your rank highlighted in blue

### Creative Challenge System

**How It Works:**
- **Submission Phase**: 7 days to complete and submit (Saturday 12 PM PT to next Saturday)
- **Voting Phase**: 2 days to vote on submissions (Saturday to Monday 12 PM PT)
- **Results Phase**: Winners announced, next challenge begins (Monday 12 PM PT)

**Challenge Categories:**
- **Cooking**: "Submit a photo of a beautiful dinner you made"
- **Creativity**: "Create something artistic with household items"
- **Photography**: "Capture an interesting shadow or reflection"
- **Adventure**: "Visit somewhere you've never been before"
- **Design**: "Make your workspace look as cozy as possible"
- **Fitness**: Movement and activity challenges
- **Art**: Drawing, painting, crafting challenges
- **DIY**: Building and making challenges

**Difficulty Levels:**
- **Easy ⭐**: Quick and simple tasks (30 mins - 1 hour)
- **Medium ⭐⭐**: Moderate effort required (2-4 hours)
- **Hard ⭐⭐⭐**: Challenging and creative (half day or more)

### Submitting to Challenges

**Submission Process:**
1. Go to `/submit` to see the current active challenge
2. Read the challenge description and requirements
3. Complete the challenge in real life
4. Upload a photo of your result (drag-and-drop supported)
5. Write a caption explaining your approach
6. Review and confirm your submission
7. Wait for the submission window to close

**Submission Rules:**
- One submission per player per challenge
- No editing after submission
- Photos must be your own work
- Caption required to explain your approach
- 10MB maximum file size

### Voting System

**How Voting Works:**
- Vote for your top 3 favorite submissions
- Rank them: 1st choice (3 points), 2nd choice (2 points), 3rd choice (1 point)
- Cannot vote for your own submission
- Must cast all 3 votes to submit
- Voting is anonymous, results are public

**Voting Interface:**
1. View all submissions in a grid
2. Click vote buttons (🥇 1st, 🥈 2nd, 🥉 3rd) for each submission
3. Selected submissions are highlighted
4. Submit all votes at once
5. Cannot change votes after submission

### Competition Statistics

**Personal Stats Tracked:**
- Total points earned across all challenges
- Number of wins (1st place finishes)
- Podium finishes (top 3 placements)
- Total challenges participated in
- Current league ranking
- Average ranking position

**League Leaderboard:**
- Ranked by total points earned
- Ties broken by number of wins, then podium finishes
- Updated automatically after each challenge
- Historical performance tracking

## Admin Features

### Admin Access

**Getting Admin Access:**
- Sign in as `player1@example.com` / `password123`
- Visit `/admin` to access challenge management
- Admin controls are restricted to this account only

### Challenge Management

**Creating New Challenges:**
1. Go to the "Add Future Prompt" section
2. Write a creative task description
3. Select a category from the dropdown
4. Choose difficulty level (1-3 stars)
5. Click "Add to Queue" to schedule
6. Challenge will activate automatically when its turn comes

**Managing the Queue:**
- View all upcoming challenges in order
- Drag to reorder challenges (up/down arrows)
- Edit scheduled challenges before they become active
- Delete challenges that haven't started yet
- See current active and voting challenges

**Manual System Control:**
- Use "Process Queue Now" to trigger cycle transitions
- Manually move between submission → voting → results phases
- Useful for testing and troubleshooting
- Check console logs for detailed processing information

## Development Features

### Database Development

**Setting Up Fresh Database:**
```bash
# Reset everything and start fresh
npx prisma migrate reset --force

# Seed with competition data
npx prisma db seed

# View database in browser
npx prisma studio
```

**Working with Schema Changes:**
```bash
# After modifying schema.prisma
npx prisma migrate dev --name "your-change-description"

# Regenerate client
npx prisma generate
```

### Testing the Competition

**Multi-Account Testing:**
1. Open multiple browser windows/incognito tabs
2. Sign in with different player accounts
3. Submit different responses to the same challenge
4. Test voting with various accounts
5. Verify results and leaderboard updates

**Testing Automated Cycles:**
1. Use admin panel to manually trigger "Process Queue Now"
2. Watch console logs for processing details
3. Verify phase transitions work correctly
4. Check vote calculations and rankings

**Testing File Uploads:**
- Development: Photos stored in `public/uploads/`
- Production: Requires `BLOB_READ_WRITE_TOKEN`
- Supports drag-and-drop and click-to-upload
- Image preview before submission

## Advanced Configuration

### Customizing Competition Rules

**Modifying Vote Values:**
Edit point values in `/src/app/api/votes/route.ts`:
```typescript
const points = 4 - rank; // 1st=3pts, 2nd=2pts, 3rd=1pt
```

**Changing Cycle Timing:**
Adjust schedules in `/src/lib/promptQueue.ts`:
```typescript
const voteEnd = new Date(voteStart);
voteEnd.setDate(voteEnd.getDate() + 2); // 2 days voting
```

**Adding New Categories:**
Update categories in `/src/app/admin/page.tsx`:
```typescript
const categories = ['Cooking', 'Creativity', 'Photography', 'YourNewCategory'];
```

### Performance Optimization

**Image Optimization:**
- Automatic image compression via Vercel Blob
- Responsive image loading
- Lazy loading for gallery views
- Next.js Image component optimization

**Database Performance:**
```bash
# Analyze query performance
npx prisma studio

# Check index usage
# Monitor slow queries in production
```

## API Routes

### Competition Endpoints
```
GET /api/league - Get league data and leaderboard
GET /api/votes - Get voting data for current voting session
POST /api/votes - Submit votes for current challenge
GET /api/responses - Get published responses (results)
POST /api/responses - Submit response to active challenge
```

### Admin Endpoints
```
GET /api/admin/prompts - Get prompt queue status
POST /api/admin/prompts - Create new challenge
PATCH /api/admin/prompts/[id] - Edit scheduled challenge
DELETE /api/admin/prompts/[id] - Delete scheduled challenge
POST /api/admin/prompts/reorder - Reorder challenge queue
POST /api/admin/process-queue - Manually trigger cycle processing
```

### File Upload
```
POST /api/upload - Upload photos (local dev or Vercel Blob)
```

### Automated Systems
```
POST /api/cron/prompt-cycle - Automated cycle processing (runs every 12 hours)
```

## Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Reset database completely
npx prisma migrate reset --force
npx prisma db seed

# Regenerate Prisma client
npx prisma generate
```

**Authentication Issues:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Check environment variables
# Verify NEXTAUTH_SECRET is set
```

**Vote Submission Errors:**
- Ensure exactly 3 votes are selected
- Check that you're not voting for your own submission
- Verify voting window is still open
- Try refreshing the page and re-voting

**Upload Issues:**
- Check file size is under 10MB
- Verify image format is supported (jpg, png, gif, webp)
- Ensure `public/uploads/` directory exists for development
- Check `BLOB_READ_WRITE_TOKEN` for production

**Admin Access Issues:**
- Confirm you're signed in as `player1@example.com`
- Check that username is exactly `player1`
- Clear browser cache and re-login
- Verify admin API routes are working

### Performance Issues

**Slow Loading:**
```bash
# Build and test production version
npm run build
npm start

# Check bundle size
npx @next/bundle-analyzer
```

**Memory Issues:**
- Monitor database size growth
- Check for memory leaks in long-running sessions
- Verify photo cleanup is working correctly

## Deployment

### Vercel Deployment

**Environment Variables to Set:**
```bash
DATABASE_URL="your-production-postgresql-url"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-app.vercel.app"
BLOB_READ_WRITE_TOKEN="your-production-blob-token"
CRON_SECRET="your-cron-secret"
```

**Deployment Steps:**
1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main
4. Verify cron jobs are working (check logs)
5. Test competition flow in production

### Production Considerations

**Database:**
- Use PostgreSQL for production (not SQLite)
- Set up regular backups
- Monitor query performance
- Plan for user growth

**File Storage:**
- Vercel Blob handles scaling automatically
- Monitor storage usage and costs
- Set up CDN for global performance

**Monitoring:**
- Set up error tracking (Sentry)
- Monitor cron job execution
- Track user engagement metrics
- Watch for abuse or gaming attempts

---

**Ready to compete?** 🏆 This creative competition platform encourages regular participation, skill development, and friendly rivalry among players!