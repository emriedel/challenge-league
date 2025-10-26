/**
 * Test script to send a sample Challenge Started email notification
 *
 * Usage:
 * 1. Set RESEND_API_KEY in .env.local
 * 2. Update TEST_EMAIL below with your email address
 * 3. Run: npx tsx scripts/send-test-email.ts
 */

// Load environment variables BEFORE any imports
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local first (takes precedence), then .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

// Verify API key is loaded
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not found in .env.local');
  console.error('Please add your Resend API key to .env.local');
  process.exit(1);
}

// Now we can safely import these modules
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { ChallengeStartedEmail } from '../src/emails/ChallengeStarted';

// UPDATE THIS WITH YOUR EMAIL ADDRESS
const TEST_EMAIL = 'eriedel4@gmail.com';

// Initialize Resend directly here with the loaded env variable
const resend = new Resend(process.env.RESEND_API_KEY);
// Always use the display name format, even if env variable doesn't include it
const FROM_EMAIL = process.env.FROM_EMAIL?.includes('<')
  ? process.env.FROM_EMAIL
  : `Challenge League <${process.env.FROM_EMAIL || 'noreply@challenge-league.app'}>`;

async function sendTestEmail() {
  console.log('🚀 Sending test Challenge Started email...\n');

  try {
    // Sample data for testing
    const sampleData = {
      username: 'testuser',
      leagueName: 'Creative Champions',
      challengeText: 'Take a photo that could be an album cover',
      challengeUrl: 'https://challenge-league.app/app/league/test-league-id',
      submissionDeadline: 'Friday, November 1, 2024 at 7:00 PM PDT',
      appUrl: 'https://challenge-league.app',
      unsubscribeToken: 'test-unsubscribe-token-123456789',
      previousChallenge: {
        text: 'Find the strangest street name',
        challengeNumber: 5,
        topSubmissions: [
          {
            rank: 1,
            username: 'photophoenix',
            caption: 'Found this gem on my morning walk - Psycho Path',
            imageUrl: 'https://images.unsplash.com/photo-1591123120675-6f7f1aae0e5b?w=600&h=400&fit=crop&q=80',
            votes: 12,
          },
          {
            rank: 2,
            username: 'craftycaptain',
            caption: 'Nothing beats Error Place - even GPS gave up',
            imageUrl: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=600&h=400&fit=crop&q=80',
            votes: 8,
          },
          {
            rank: 3,
            username: 'pixelpioneer',
            caption: 'Welcome to This Is It Street. That is literally it.',
            imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=600&fit=crop&q=80',
            votes: 6,
          },
        ],
      },
    };

    // Render the React component to HTML
    const emailHtml = await render(ChallengeStartedEmail(sampleData));

    console.log('Sending from:', FROM_EMAIL);

    // Send email directly using Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TEST_EMAIL,
      subject: '🏆 New Challenge in Creative Champions',
      html: emailHtml,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }

    console.log('✅ Test email sent successfully!\n');
    console.log(`📧 Check your inbox at: ${TEST_EMAIL}\n`);
    console.log('Email details:');
    console.log(`  - League: ${sampleData.leagueName}`);
    console.log(`  - Challenge: ${sampleData.challengeText}`);
    console.log(`  - Previous winner: ${sampleData.previousChallenge.topSubmissions[0].username}`);
    console.log(`  - Top 3 shown: Yes\n`);
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    process.exit(1);
  }
}

// Run the test
sendTestEmail();
