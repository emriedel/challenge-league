# Development Guide - Challenge League

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ installed
- Git installed

### Setup (30 seconds)
```bash
# Clone and install
npm install

# Set up local database and test data
npm run db:setup

# Start development server
npm run dev
```

**That's it!** Your local SQLite database is ready with test data.

## 🧪 Test Accounts

All users use password `password123`:

**Primary Test Accounts:**
- `photophoenix@example.com` - Main League Owner
- `craftycaptain@example.com` - Photography Masters Owner  
- `pixelpioneer@example.com` - Crafty Creators Owner
- `artisticace@example.com` - Multi-league member
- `creativecomet@example.com` - Multi-league member

**All 20 Available Users:**
photophoenix, craftycaptain, pixelpioneer, artisticace, creativecomet, snapsage, visionvoyager, dreamdesigner, studiostar, framefusion, colorcrafter, lenslegend, brushboss, sketchsorcerer, paintpro, digitaldynamo, artfulavenger, creativeclimber, visualvibe, mastermaker

## 🏆 What's in the Test Data

**3 Leagues:**
- **Main Creative League** (15 members) - General creative challenges
- **Photography Masters** (10 members) - Advanced photography challenges  
- **Crafty Creators** (12 members) - Hands-on making challenges

**Per League:**
- 3 completed rounds with full voting history
- 1 active round with partial submissions
- 3 scheduled future rounds
- Realistic participation and vote distributions

## 🛠️ Daily Development Commands

```bash
# Start development server
npm run dev

# Reset local database (if needed)
npm run db:setup

# Type checking
npm run type-check

# Linting
npm run lint

# Browse database in browser
npx prisma studio
```

## 🎮 Testing Features

### Competition Flow
1. **Sign in** with any test account
2. **Submit** responses to active challenges
3. **Vote** on submissions (3 votes to distribute)
4. **View results** and leaderboard

### Admin Features
1. **Sign in** as `photophoenix@example.com`
2. **Go to** `/admin` to manage challenges
3. **Create** new challenges and manage queue
4. **Trigger** manual cycle processing for testing

### Photo Uploads
- **Local Development**: Photos stored in memory (no setup needed)
- **Drag & Drop**: Upload interface supports drag and drop
- **File Types**: JPG, PNG, GIF, WebP (max 10MB)

## 🔧 Environment Variables

Create `.env` file (optional):
```bash
# Database (auto-created)
DATABASE_URL="file:./dev.db"

# Authentication (auto-generated if missing)
NEXTAUTH_SECRET="dev-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Photo uploads (optional - app works without this)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

**Note:** App works without any environment variables for local development.

## 🚨 Common Issues & Solutions

### "Database problems" or "Migration errors"
```bash
npm run db:setup
```

### "Authentication errors" 
```bash
rm -rf .next
npm run dev
```

### "Can't log in after seed"
This is normal - the seed clears all sessions. Just log in again.

### "TypeScript errors"
```bash
npm run type-check
```

## 📁 Project Structure (Key Files)

```
src/
├── app/
│   ├── page.tsx              # League Dashboard
│   ├── admin/                # Admin challenge management
│   ├── auth/                 # Login/register pages
│   └── api/                  # Backend API routes
├── components/               # React components
├── hooks/                    # Custom React hooks  
├── lib/                      # Database & utilities
└── types/                    # TypeScript definitions

prisma/
├── schema.prisma             # Database schema (SQLite)
├── schema.production.prisma  # Production schema (PostgreSQL)  
└── seed.ts                   # Test data generator
```

## 🎯 Development Tips

### Testing Multi-User Scenarios
- Use multiple browser profiles or incognito tabs
- Sign in as different users to simulate competition
- Test voting with various accounts

### Adding New Features  
- Follow existing patterns in `/src/components/`
- Add new API routes in `/src/app/api/`
- Use TypeScript types from `/src/types/`

### Database Changes
- Modify `prisma/schema.prisma` 
- Run `npm run db:setup` to apply changes
- No migrations needed in development!

---

**Ready to develop?** Run `npm run db:setup && npm run dev` and start coding! 🚀

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md).