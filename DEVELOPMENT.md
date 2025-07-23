# Development Guide

## Test Credentials

The following test accounts are available after running `npm run db:seed`:

### User Accounts
- **Email**: `user1@example.com` | **Password**: `password123` (Admin)
- **Email**: `user2@example.com` | **Password**: `password123`
- **Email**: `user3@example.com` | **Password**: `password123`
- **Email**: `user4@example.com` | **Password**: `password123`
- **Email**: `user5@example.com` | **Password**: `password123`

### Admin Access
- **Username**: `testuser1` (user1@example.com) has admin access to `/admin`
- Admin can manage prompt queue, add/edit/delete prompts, and reorder the queue

### Friend Connections
All test users are pre-connected as friends, so you can:
- View each other's responses in the gallery
- Test the complete sharing flow across accounts

## Development Workflow

### 1. Initial Setup
```bash
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

### 2. Testing Photo Uploads
- **Development Mode**: Photos are stored locally in `public/uploads/`
- **Production Mode**: Requires `BLOB_READ_WRITE_TOKEN` environment variable
- The app automatically falls back to local storage when Vercel Blob is not configured

### 3. Testing the Complete Flow
1. Sign in with `user1@example.com` / `password123`
2. Go to `/submit` to upload a photo and add a caption
3. Submit the response (it won't be published until the prompt ends)
4. Sign in as `user2@example.com` to test from another user's perspective
5. Check `/admin` as `user1@example.com` to manage prompts

### 4. Database Management
```bash
# Reset database and reseed
npx prisma db push --force-reset
npm run db:seed

# View database in browser
npx prisma studio
```

### 5. Environment Variables
Required for development:
```bash
# .env file
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="dev-secret-key-replace-in-production"
NEXTAUTH_URL="http://localhost:3000"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token-here" # Optional for development
```

### 6. Testing Features

#### Photo Upload System
- Drag and drop photos onto the upload area
- Preview images before submission
- File validation (image types, 10MB max)
- Confirmation dialog before final submission

#### Prompt Management (Admin)
- Access `/admin` as `testuser1`
- Add future prompts to the queue
- Reorder prompts with drag and drop
- Edit or delete scheduled prompts

#### Friend System
- Users are pre-connected for testing
- Future: Search and add friends by username

#### Weekly Cycle
- Current prompt is active for submissions
- Past prompts show published responses in gallery
- Future prompts are queued and will activate automatically

## Common Issues

### Authentication Errors
If you see NextAuth.js errors, try:
```bash
rm -rf .next
npm run dev
```

### Database Issues
If database seems corrupted:
```bash
npx prisma db push --force-reset
npm run db:seed
```

### Upload Errors
- Check that `public/uploads/` directory exists
- Verify file size is under 10MB
- Ensure you're signed in before uploading

## File Structure

```
src/
├── app/
│   ├── admin/           # Admin interface for prompt management
│   ├── auth/            # Authentication pages
│   ├── submit/          # Photo submission page
│   └── api/
│       ├── auth/        # NextAuth.js API routes
│       ├── upload/      # Photo upload endpoint
│       ├── responses/   # Response CRUD operations
│       └── admin/       # Admin API routes
├── components/
│   ├── PhotoUpload.tsx  # Drag-and-drop photo upload component
│   ├── SubmissionForm.tsx # Complete submission form with confirmation
│   └── PromptCard.tsx   # Display current prompt with countdown
├── lib/
│   ├── auth.ts         # NextAuth.js configuration
│   ├── db.ts           # Prisma client setup
│   └── promptQueue.ts  # Automatic prompt activation system
└── hooks/
    └── usePrompt.ts    # Hook for fetching current prompt data
```

## Next Steps

After testing locally:
1. Follow `DEPLOYMENT.md` for production deployment
2. Set up Vercel Blob storage for production photo uploads
3. Configure custom domain and monitoring