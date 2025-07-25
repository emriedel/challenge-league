# Development Guide - Glimpse Competition League

## 🧪 Test Credentials

The following test accounts are available after running `npx prisma db seed`:

### Player Accounts
| Email | Password | Username | Special Access |
|-------|----------|----------|----------------|
| `player1@example.com` | `password123` | `player1` | **Admin Access** 🔑 |
| `player2@example.com` | `password123` | `player2` | Player |
| `player3@example.com` | `password123` | `player3` | Player |
| `player4@example.com` | `password123` | `player4` | Player |
| `player5@example.com` | `password123` | `player5` | Player |
| `player6@example.com` | `password123` | `player6` | Player |

### Admin Access
- **Username**: `player1` has admin access to `/admin`
- Admin can manage creative challenges, queue ordering, and system processing
- All other accounts are regular players in the Main League

### League Setup
- All players are automatically assigned to the "Main League"
- Pre-populated with sample challenges and vote data
- Complete competition cycle examples ready for testing

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
3. Players vote for their top 3 favorites (3pts, 2pts, 1pt)
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

# View database in browser
npx prisma studio

# Check current data
npx prisma db seed

# Generate client after schema changes
npx prisma generate
```

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
- **Categories**: Cooking, Creativity, Photography, Adventure, Design, Fitness, Art, DIY
- **Difficulty Levels**: Easy ⭐, Medium ⭐⭐, Hard ⭐⭐⭐
- **Sample Tasks**:
  - "Submit a photo of a beautiful dinner you made this week"
  - "Create something artistic with household items"
  - "Capture an interesting shadow or reflection"

### Voting System
- **3-Choice Ranking**: Players select 1st, 2nd, 3rd place choices
- **Weighted Scoring**: 3pts for 1st, 2pts for 2nd, 1pt for 3rd
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
- Check that exactly 3 votes are selected (1st, 2nd, 3rd)
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

### Adding New Challenge Categories
1. Update categories array in `src/app/admin/page.tsx`
2. Add sample tasks in `prisma/seed.ts`
3. Consider UI icons/colors for new categories

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