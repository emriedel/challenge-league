# 🏆 Glimpse - Creative Competition League

> A Taskmaster-inspired creative competition platform where players compete in weekly challenges, submit photo responses, and vote on each other's creativity.

## ✨ What is Glimpse?

Glimpse transforms the social media experience into an engaging creative competition. Instead of endless scrolling, players participate in structured weekly challenges that encourage creativity, skill-building, and friendly competition.

### 🎯 How it Works

1. **Weekly Challenges** - Creative tasks like "Submit a photo of a beautiful dinner you made" or "Create something artistic with household items"
2. **Submit & Compete** - Players have 7 days to complete the challenge and submit their photo response
3. **Vote & Rank** - After submissions close, players distribute 3 equal-value votes among submissions
4. **Winners & Glory** - Results are revealed with full rankings and leaderboard updates

### 🏅 Key Features

- **League System**: Join the Main League and compete with everyone
- **Diverse Challenges**: Wide variety of creative prompts covering cooking, photography, art, adventure, DIY, and more
- **Fair Voting**: Anonymous equal-value voting system (3 votes per player)
- **Comprehensive Stats**: Track wins, podium finishes, and total points
- **Automatic Cycles**: Seamless progression from submission → voting → results

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd glimpse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🧪 Test Accounts

The seeded database includes test players for immediate exploration:

| Email | Password | Role |
|-------|----------|------|
| player1@example.com | password123 | Player |
| player2@example.com | password123 | Player |
| player3@example.com | password123 | Player |
| player4@example.com | password123 | Player |
| player5@example.com | password123 | Player |
| player6@example.com | password123 | Player |

**Admin Access**: Use `player1@example.com` to access admin features at `/admin`

## 🎮 Using the App

### For Players

1. **Sign up or log in** - Create your account and automatically join the Main League
2. **Check the dashboard** - See current challenges, your stats, and the leaderboard
3. **Submit responses** - Upload photos and captions for active challenges
4. **Vote on submissions** - Rank your top 3 favorite responses when voting opens
5. **View results** - See rankings and celebrate winners
6. **Track progress** - Monitor your league position and performance stats

### For Admins

1. **Access admin panel** - Go to `/admin` (requires admin permissions)
2. **Create challenges** - Add new tasks with categories and difficulty levels
3. **Manage queue** - Reorder upcoming challenges
4. **Monitor system** - Check prompt status and manually trigger cycles if needed

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, NextAuth.js
- **Database**: SQLite (dev) / PostgreSQL (prod) with Prisma ORM
- **Storage**: Vercel Blob for photo uploads
- **Deployment**: Vercel with automatic deployments

### Key Components

- **3-Phase Cycle System**: Automated progression through submission → voting → results phases
- **League Management**: Comprehensive player rankings and statistics
- **Voting Engine**: Equal-value voting system with automatic rank calculation
- **Admin Interface**: Full challenge management and system monitoring
- **Real-time Updates**: Live status tracking and countdown timers

### Database Schema Highlights

```
Users → League Memberships → Leagues
Users → Responses → Prompts
Users → Votes → Responses
```

The voting system prevents self-voting and ensures fair equal-value scoring (each vote = 1 point).

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Database Commands

```bash
npx prisma studio       # Open database browser
npx prisma migrate dev  # Create and apply migrations
npx prisma generate     # Regenerate Prisma client
npx prisma db seed      # Reseed with test data
```

### Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── api/            # API endpoints
│   ├── auth/           # Authentication pages
│   ├── admin/          # Admin interface
│   └── submit/         # Challenge submission
├── components/         # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and database
└── types/              # TypeScript definitions
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Automatic deployments on push to main

### Environment Variables

```bash
# Database
DATABASE_URL="your-database-url"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# File Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Cron Security
CRON_SECRET="your-cron-secret"
```

## 🎨 Customization

### Adding New Challenge Categories

1. Update the categories list in each league's admin page (`/src/app/league/[leagueId]/admin/page.tsx`)
2. Add corresponding icons/colors in the UI components
3. Update seed data with new category examples

### Modifying Competition Rules

- **Voting Duration**: Update `voteEnd` calculation in prompt queue system
- **Point Values**: Each vote equals 1 point in the current system
- **Cycle Timing**: Adjust cron schedule in `vercel.json`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Phase 2: Enhanced Features
- [ ] Multiple league support
- [ ] Achievement system and badges
- [ ] PWA capabilities with push notifications
- [ ] Advanced photo editing tools
- [ ] Social sharing features

### Phase 3: Mobile App
- [ ] React Native mobile app
- [ ] Native camera integration
- [ ] Offline submission drafts
- [ ] Enhanced mobile voting interface

---

**Made with ❤️ for creative competition and friendly rivalry**

Transform your creative energy into engaging competition with Glimpse! 🏆