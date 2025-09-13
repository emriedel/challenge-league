# 🏆 Challenge League

A Taskmaster-inspired creative competition platform where players compete in weekly challenges, submit photo responses, and vote on each other's creativity.

![Challenge League](https://img.shields.io/badge/status-MVP%20Complete-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue)

## ✨ What is Challenge League?

Challenge League brings the creative spirit of Taskmaster to your friend group. Join leagues, tackle weekly creative challenges, and compete for the top spot on the leaderboard.

### 🎯 How it Works

1. **Join a League** - Create or join a league with your friends
2. **Get Creative** - Each week brings a new challenge to test your creativity  
3. **Snap & Submit** - Take your best photo during the submission window
4. **Vote & Compete** - Vote for your favorites when the voting phase opens
5. **Climb the Leaderboard** - Earn points and track your progress over time

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL)
- Git

### Installation

```bash
# Clone and install
git clone <repository-url>
cd challenge-league
npm install

# Start PostgreSQL database
docker compose up -d

# Set up database with initial migration and test data
npm run db:init

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start competing!

## 🧪 Test Accounts

All test accounts use password `password123`:

- `photophoenix@example.com` - Main League Owner
- `craftycaptain@example.com` - Photography Masters Owner  
- `pixelpioneer@example.com` - Crafty Creators Owner
- `artisticace@example.com` - Multi-league member
- `creativecomet@example.com` - Multi-league member

## 🎮 Features

### For Players
- **Creative Challenges** - Weekly prompts across categories like cooking, photography, art, and adventure
- **Photo Submissions** - Upload photos with captions during 7-day submission windows
- **Voting System** - Rank your top 3 favorites during 2-day voting periods
- **Leaderboards** - Track your progress and compete for the top spot
- **Results Gallery** - View past challenge winners and submissions

### For League Owners
- **League Management** - Create leagues and manage members
- **Challenge Curation** - Add custom challenges with categories and difficulty levels
- **Admin Controls** - Manual phase transitions and league settings
- **Real-time Monitoring** - Track participation and engagement

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, NextAuth.js authentication
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Vercel Blob for photo uploads
- **Deployment**: Vercel with automated CI/CD

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router pages and API routes
├── components/          # Reusable React components
├── hooks/              # Custom React hooks
├── lib/                # Database utilities and core logic
├── types/              # TypeScript type definitions
└── constants/          # App configuration and constants
```

## 🔄 Competition Cycle

The app automatically manages 2-phase competition cycles:

- **Submission Phase** (7 days): Players submit creative photo responses
- **Voting Phase** (2 days): Players vote for their top 3 favorites
- **Results**: Winners announced, leaderboard updated, next challenge begins

Automated cron jobs handle phase transitions every 12 hours.

## 🚀 Development

### Essential Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Check code style
npm run type-check   # TypeScript validation
npm run db:reset     # Reset database with fresh migrations and test data
```

### Database Management

```bash
docker compose up -d     # Start PostgreSQL
npx prisma studio        # Database browser
npx prisma migrate dev   # Apply schema changes
npm run db:seed         # Seed test data
```

## 📖 Documentation

- **[Development Guide](docs/DEVELOPMENT.md)** - Detailed setup and development workflow
- **[CLAUDE.md](CLAUDE.md)** - Complete project context for AI assistance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is private and proprietary.

---

**Ready to compete?** Start your creative journey with Challenge League! 🎨📸