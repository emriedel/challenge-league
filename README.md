# Glimpse 📸

> A web application that encourages meaningful sharing through weekly photo prompts

Glimpse transforms how we share memories by giving you exactly one week to respond to a thoughtful prompt. Every Saturday at noon PT, all responses are published simultaneously and the next prompt becomes available. No endless scrolling, no daily pressure—just intentional sharing with friends.

## ✨ How It Works

**The Weekly Cycle:**
1. **Saturday 12 PM PT**: New prompt releases, previous responses published
2. **Submission Window**: You have exactly 7 days to submit your photo and caption  
3. **Waiting Period**: After submitting, see "waiting for others" until window closes
4. **Gallery Moment**: Everyone's responses appear at once when the cycle resets

**Two Simple Pages:**
- **Gallery**: Scroll through your friends' responses from last week
- **Submit**: See the current prompt, upload your photo, write your caption

## 🎯 The Philosophy

Glimpse addresses social media fatigue by:
- **Synchronized sharing**: Everyone responds to the same prompt, published together
- **Time boundaries**: Exactly one week to submit, no editing after
- **Friends only**: Intimate sharing without public pressure  
- **Ephemeral content**: Photos are deleted after each cycle
- **Quality over quantity**: One meaningful post per week

### Example Prompts
- "Share your favorite vacation photo and tell us why it was special"
- "Post the oldest photo of yourself on your phone"
- "What's the best activity you did this week?"
- "Share a photo of something that made you smile recently"
- "Post a picture of your favorite comfort food"

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Git
- PostgreSQL (for production) or SQLite (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/glimpse.git
   cd glimpse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🔐 Test Accounts

The database seed creates test users for development:

- **Email**: `user1@example.com` | **Password**: `password123`
- **Email**: `user2@example.com` | **Password**: `password123`  
- **Email**: `user3@example.com` | **Password**: `password123`
- **Email**: `user4@example.com` | **Password**: `password123`
- **Email**: `user5@example.com` | **Password**: `password123`

**Admin Access**: `testuser1` has admin privileges for managing prompts at `/admin`

All test accounts are already connected as friends, so you can see content across accounts.

## 🌐 Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes (same repo)
- **Database**: PostgreSQL with Prisma ORM (SQLite for development)
- **Authentication**: NextAuth.js
- **File Storage**: Vercel Blob
- **Deployment**: Vercel
- **Future**: React Native mobile app using same backend

## 🗂️ Project Structure

```
src/
├── app/                 # Next.js app directory (pages and layouts)
│   ├── (auth)/          # Authentication pages
│   ├── gallery/         # Gallery page and components
│   ├── submit/          # Submit page and components
│   └── api/             # API routes
├── components/          # Reusable UI components
├── lib/                # Database, auth, and utility functions
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── constants/          # App constants and configuration
└── public/             # Static assets
```

## 🎨 Key Features

Glimpse is intentionally simple:

### Core Experience
- **Synchronized Cycles**: Every Saturday 12 PM PT, new prompt + previous responses
- **Two-Page App**: Gallery (view responses) and Submit (respond to prompt)
- **Friends Only**: Add friends by username, all content is private
- **No Permanence**: Photos deleted after each cycle, no history to browse
- **No Editing**: Submit once with confirmation, can't change afterwards

### User Flow
1. **Onboarding**: Simple explanation of how the app works
2. **Add Friends**: Search by username to build your network
3. **Submit**: Upload photo, write caption, confirm submission
4. **Wait**: See "waiting for others" until submission window closes
5. **Gallery**: Browse everyone's responses when they're published together

### Technical Features
- **Responsive Design**: Mobile-first design that works great on all screen sizes
- **PWA Ready**: Install as an app on mobile devices (Phase 2)
- **Auto Cleanup**: Photos automatically deleted after each cycle
- **Real-time Updates**: Countdown timer and status updates

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file with:
```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/glimpse"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Email (for authentication)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"  
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@glimpse.com"

# File Storage
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
# OR for AWS S3:
# AWS_ACCESS_KEY_ID="your-aws-key"
# AWS_SECRET_ACCESS_KEY="your-aws-secret"
# AWS_S3_BUCKET="glimpse-photos"
# AWS_REGION="us-east-1"
```

### Customization
- **Prompt Categories**: Edit `src/constants/promptCategories.ts`
- **App Theme**: Modify `src/constants/theme.ts`
- **Notification Settings**: Configure in `src/services/notifications.ts`

## 📊 Development Roadmap

### Phase 1: Web MVP ✨
- [x] Project setup and documentation
- [ ] Next.js app with TypeScript and Tailwind
- [ ] User authentication with NextAuth.js
- [ ] Database schema and Prisma setup
- [ ] Basic onboarding flow
- [ ] Weekly prompt system with countdown timer
- [ ] Photo upload and caption submission
- [ ] Friend system (search and add by username)
- [ ] Gallery page for viewing responses
- [ ] Submit page with confirmation step
- [ ] Automatic photo cleanup after each cycle

### Phase 2: Enhanced Web Experience
- [ ] PWA configuration for mobile-like experience
- [ ] Web push notifications for new prompts
- [ ] Enhanced UI/UX polish and animations
- [ ] Performance optimizations and caching
- [ ] Advanced prompt categories and variety
- [ ] User profile management and settings
- [ ] Error handling and edge case management

### Phase 3: Mobile App
- [ ] React Native app development
- [ ] Native push notifications
- [ ] Enhanced mobile user experience
- [ ] App store preparation and deployment
- [ ] Feature parity with web version
- [ ] Platform-specific optimizations

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Code of conduct
- Development process
- Coding standards
- Pull request guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Project Documentation](docs/)
- [API Documentation](docs/api.md)
- [Design System](docs/design-system.md)
- [Deployment Guide](docs/deployment.md)

## 🙏 Acknowledgments

- Inspired by the BeReal app's authenticity approach
- Thanks to all beta testers and early contributors
- Special thanks to the React Native community

---

**Ready to start sharing meaningful memories?** 
Join the Glimpse community and rediscover the joy of intentional social sharing.