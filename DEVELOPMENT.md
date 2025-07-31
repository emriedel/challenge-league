# Development Guide - Glimpse Competition League

## 🧪 Test Credentials

The following test accounts are available after running database seed commands:

### Basic Seed (`npx prisma db seed`) - 6 Players
| Email | Password | Username | Special Access |
|-------|----------|----------|----------------|
| `player1@example.com` | `password123` | `player1` | **Admin Access** 🔑 |
| `player2@example.com` | `password123` | `player2` | Player |
| `player3@example.com` | `password123` | `player3` | Player |
| `player4@example.com` | `password123` | `player4` | Player |
| `player5@example.com` | `password123` | `player5` | Player |
| `player6@example.com` | `password123` | `player6` | Player |

### Large Seed (`npx tsx prisma/seed-large.ts`) - 20 Players + 5 Completed Rounds
For comprehensive testing with realistic competition data:

| Email | Password | Username | Points | Wins | Status |
|-------|----------|----------|--------|------|--------|
| `photophoenix@example.com` | `password123` | `PhotoPhoenix` | 29 | 1 | **League Owner** 🔑 |
| `craftycaptain@example.com` | `password123` | `CraftyCaptain` | 14 | 0 | Player |
| `pixelpioneer@example.com` | `password123` | `PixelPioneer` | 13 | 0 | Player |
| `artisticace@example.com` | `password123` | `ArtisticAce` | 21 | 0 | Player |
| `creativecomet@example.com` | `password123` | `CreativeComet` | - | 0 | Player |
| `snapsage@example.com` | `password123` | `SnapSage` | - | 0 | Player |
| `visionvoyager@example.com` | `password123` | `VisionVoyager` | - | 0 | Player |
| `dreamdesigner@example.com` | `password123` | `DreamDesigner` | 25 | 1 | Player |
| `studiostar@example.com` | `password123` | `StudioStar` | - | 0 | Player |
| `framefusion@example.com` | `password123` | `FrameFusion` | - | 0 | Player |
| `colorcrafter@example.com` | `password123` | `ColorCrafter` | 16 | 0 | Player |
| `lenslegend@example.com` | `password123` | `LensLegend` | 20 | 1 | Player |
| `brushboss@example.com` | `password123` | `BrushBoss` | 18 | 1 | Player |
| `sketchsorcerer@example.com` | `password123` | `SketchSorcerer` | 28 | 1 | Player |
| `paintpro@example.com` | `password123` | `PaintPro` | - | 0 | Player |
| `digitaldynamo@example.com` | `password123` | `DigitalDynamo` | - | 0 | Player |
| `artfulavenger@example.com` | `password123` | `ArtfulAvenger` | - | 0 | Player |
| `creativeclimber@example.com` | `password123` | `CreativeClimber` | - | 0 | Player |
| `visualvibe@example.com` | `password123` | `VisualVibe` | 18 | 0 | Player |
| `mastermaker@example.com` | `password123` | `MasterMaker` | - | 0 | Player |

### Large Seed League Data
- **League Name**: Creative Champions League
- **Invite Code**: 6A5SH7
- **Total Members**: 20 active users  
- **Completed Rounds**: 5 with full voting history
- **Active Prompt**: "Show us your most creative breakfast setup - make it Instagram-worthy!" (8 submissions so far)
- **Voting Prompt**: "Capture the most interesting architectural detail in your neighborhood" (12 submissions, 6 users have voted)
- **Total Submissions**: ~90+ creative responses across all prompts
- **Total Votes**: ~320+ distributed votes (including ongoing voting)
- **Current Leader**: CraftyCaptain (28 points, 1 win)

### Admin Access
- **Basic Seed**: `player1` has admin access to `/league-settings`
- **Large Seed**: `PhotoPhoenix` has admin access to `/league-settings`
- Admin can manage creative challenges, queue ordering, and system processing

### League Setup
- All players are automatically assigned to their respective league
- Pre-populated with sample challenges and complete vote data
- Full competition cycle examples ready for testing

## 🚀 Development Workflow

### 1. Initial Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Reset database and apply schema
npx prisma migrate dev

# Seed with competition data
npx prisma db seed

# Start development server
npm run dev
```

### 2. Testing Photo Uploads
- **Development Mode**: Photos stored locally in `public/uploads/`
- **Production Mode**: Requires `BLOB_READ_WRITE_TOKEN` for Vercel Blob
- App automatically falls back to local storage when blob token is missing
- Supports drag-and-drop upload with preview

### 3. Testing the Complete Competition Flow

#### Phase 1: Submission (7 days)
1. Sign in with `player1@example.com` / `password123`
2. Go to **League Dashboard** (`/`) to see current challenge status
3. Go to `/submit` to upload photo and caption for active challenge
4. Submit response (stored as unpublished until submission window closes)
5. Test with multiple players to simulate competition

#### Phase 2: Voting (2 days)
1. Wait for submission window to close (or manually trigger cycle in admin)
2. Voting tab becomes active on the dashboard
3. Players distribute 3 equal-value votes among submissions
4. Cannot vote for own submission
5. Test voting with different player accounts

#### Phase 3: Results & New Challenge
1. Results are calculated automatically when voting closes
2. Winners announced with full rankings
3. Leaderboard updates with new points and statistics
4. Next challenge begins automatically

### 4. Admin Testing
1. Sign in as `player1@example.com`
2. Go to `/admin` to access challenge management
3. **Create Challenges**: Add new tasks with categories and difficulty
4. **Manage Queue**: Reorder upcoming challenges
5. **Manual Processing**: Trigger cycle transitions for testing
6. **Monitor Status**: View current prompt states and queue

### 5. Database Management
```bash
# Reset database completely
npx prisma migrate reset --force

# Basic seed (6 players, basic data)
npx prisma db seed

# Large seed (20 players, 5 completed rounds, realistic data)
npx tsx prisma/seed-large.ts

# View database in browser
npx prisma studio

# Generate client after schema changes
npx prisma generate
```

#### Choosing Your Seed Data
- **Basic Seed**: Ideal for development and testing core features
- **Large Seed**: Perfect for testing UI with realistic data volumes, leaderboards, and full competition history
- **Custom Data**: Modify seed scripts in `prisma/` directory for specific test scenarios

#### Important Note About Sessions
Both seed scripts automatically clear all user sessions when they run. This means:
- **After running any seed script, all users will be logged out**
- **You'll need to log in again** with the new account credentials
- **This prevents stale session issues** where old user IDs don't match the new database data
- **This is expected behavior** - the seed scripts tell you when sessions are cleared

### 6. Environment Variables
Create a `.env` file with:
```bash
# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# Authentication
NEXTAUTH_SECRET="dev-secret-key-replace-in-production"
NEXTAUTH_URL="http://localhost:3000"

# File Storage (optional for development)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token-here"

# Cron Security (for production)
CRON_SECRET="your-cron-secret-here"
```

## 🎮 Testing Features

### League Dashboard
- **Overview Tab**: Current status, personal stats, recent activity
- **Voting Tab**: Active when voting is open, shows submissions to vote on
- **Results Tab**: Latest completed challenge results with rankings
- **Leaderboard Tab**: Full league standings with comprehensive stats

### Creative Challenge System
- **Diverse Prompts**: Wide variety of creative challenges covering cooking, photography, art, adventure, and more
- **Sample Tasks**:
  - "Submit a photo of a beautiful dinner you made this week"
  - "Create something artistic with household items"
  - "Capture an interesting shadow or reflection"
  - "Visit somewhere you've never been before and document it"

### Voting System
- **Equal-Value Voting**: Players get 3 votes to distribute
- **Flexible Distribution**: Can give multiple votes to same submission or spread across different ones
- **Fair Play**: Cannot vote for own submission
- **Anonymous Voting**: Votes are private, results are public

### Admin Interface Features
- Create challenges with categories and difficulty levels
- Drag-and-drop queue reordering
- Edit/delete scheduled challenges
- Manual cycle processing for testing
- Real-time status monitoring
- Queue processing controls

### Automated Systems
- **Cron Jobs**: Run every 12 hours to check transitions
- **Phase Management**: ACTIVE → VOTING → COMPLETED → Next ACTIVE
- **Vote Calculation**: Automatic ranking and point totals
- **Photo Cleanup**: Old images deleted after completion

## 🔧 Common Issues & Solutions

### Authentication Errors
If you see NextAuth.js errors:
```bash
rm -rf .next
npm run dev
```

### Database Issues
If database seems corrupted:
```bash
npx prisma migrate reset --force
npx prisma db seed
```

### Upload Errors
- Ensure `public/uploads/` directory exists and is writable
- Check file size is under 10MB
- Verify user is authenticated before uploading
- Check image format is supported (jpg, png, gif, webp)

### Admin Access Issues
- Confirm you're signed in as `player1@example.com`
- Check that username in session is exactly `player1`
- Clear browser cache and re-login if needed

### Voting Issues
- Ensure you're not trying to vote for your own submission
- Check that exactly 3 votes are used total
- Verify voting window is still open

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # League Dashboard (main competition interface)
│   ├── admin/                # Admin interface for challenge management
│   ├── auth/                 # Authentication pages
│   ├── submit/               # Challenge submission page
│   └── api/
│       ├── votes/            # Voting system endpoints
│       ├── league/           # League data and statistics
│       ├── responses/        # Submission management
│       ├── upload/           # Photo upload handling
│       ├── cron/             # Automated cycle processing
│       └── admin/            # Admin API routes
├── components/
│   ├── VotingCard.tsx        # Individual submission voting interface
│   ├── LeaderboardTable.tsx  # League standings display
│   ├── PhotoUpload.tsx       # Drag-and-drop upload component
│   └── ResponseCard.tsx      # Competition submission display
├── hooks/
│   ├── useLeague.ts          # League data and statistics
│   ├── useVoting.ts          # Voting interface logic
│   ├── useGallery.ts         # Results and gallery data
│   └── usePrompt.ts          # Current challenge information
├── lib/
│   ├── promptQueue.ts        # 3-phase cycle automation
│   ├── auth.ts               # NextAuth.js configuration
│   └── db.ts                 # Prisma database client
└── types/                    # TypeScript definitions for competition
```

## 🎯 Development Tips

### Testing Competition Cycles
1. Use admin panel to manually trigger cycle transitions
2. Test with multiple player accounts simultaneously
3. Verify vote counts and point calculations
4. Check leaderboard updates after results

### Adding New Challenge Types
1. Create new prompt text variations in admin interface
2. Add sample tasks in `prisma/seed.ts`
3. Test different prompt styles and formats

### Customizing Scoring System
- Modify point values in voting API endpoints
- Update vote calculation logic in `promptQueue.ts`
- Adjust ranking algorithms as needed

### Performance Testing
- Test with larger numbers of submissions
- Verify image upload performance
- Check database query efficiency on leaderboard

## 🚀 Next Steps

After local testing:
1. Deploy to Vercel with environment variables
2. Set up Vercel Blob for production photo storage
3. Configure cron jobs for automatic cycle management
4. Monitor competition engagement and adjust timing
5. Plan Phase 2 features (multiple leagues, achievements)

---

**Ready to compete?** Sign in as `player1@example.com` and start your creative competition journey! 🏆