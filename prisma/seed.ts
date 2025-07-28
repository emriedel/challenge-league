import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getWeeklyPromptDates } from '../src/lib/weeklyPrompts';

const prisma = new PrismaClient();

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Exclude O and 0 for clarity
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a URL-safe slug from a name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const competitionTasks = [
  "Submit a photo of a beautiful dinner you made this week",
  "Create something artistic with household items and share the result",
  "Capture an interesting shadow or reflection in your daily life",
  "Visit somewhere you've never been before and document it",
  "Make your workspace/room look as cozy as possible",
  "Create the most impressive snack or drink presentation",
  "Find and photograph the most interesting texture around you",
  "Build something functional using only items from your junk drawer",
];

async function main() {
  console.log('🌱 Starting competition game database seed...');

  // Clear existing data
  await prisma.vote.deleteMany();
  await prisma.response.deleteMany();
  await prisma.leagueMembership.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.league.deleteMany();
  await prisma.user.deleteMany();

  // Create test users first (need user ID for league owner)
  const users = [];
  for (let i = 1; i <= 6; i++) {
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await prisma.user.create({
      data: {
        email: `player${i}@example.com`,
        username: `player${i}`,
        password: hashedPassword,
      },
    });
    users.push(user);
    console.log(`✅ Created player: ${user.username}`);
  }

  // Create main league with player1 as owner
  const mainLeague = await prisma.league.create({
    data: {
      name: "Main League",
      slug: "main",
      description: "The primary competition league where all players compete in creative challenges!",
      inviteCode: generateInviteCode(),
      isActive: true,
      ownerId: users[0].id, // player1 is the owner
    },
  });
  console.log(`🏆 Created league: ${mainLeague.name} (owner: ${users[0].username}, invite: ${mainLeague.inviteCode})`);

  // Add all users to main league
  for (const user of users) {
    await prisma.leagueMembership.create({
      data: {
        userId: user.id,
        leagueId: mainLeague.id,
        isActive: true,
      },
    });
    console.log(`👥 Added ${user.username} to Main League`);
  }

  // Calculate dates for 3-phase cycle
  const { weekStart, weekEnd } = getWeeklyPromptDates();
  const voteStart = new Date(weekEnd); // Voting starts when submissions close
  const voteEnd = new Date(voteStart);
  voteEnd.setDate(voteEnd.getDate() + 2); // Vote for 2 days (Sat-Mon)

  // Create current active task
  const currentTask = await prisma.prompt.create({
    data: {
      text: competitionTasks[0],
      weekStart,
      weekEnd,
      voteStart,
      voteEnd,
      status: 'ACTIVE',
      queueOrder: 1,
      leagueId: mainLeague.id,
    },
  });
  console.log(`📝 Created current task: "${currentTask.text}"`);
  console.log(`   Submit: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`);
  console.log(`   Vote: ${voteStart.toLocaleDateString()} - ${voteEnd.toLocaleDateString()}`);

  // Create a completed task with responses and votes
  const pastTaskStart = new Date(weekStart);
  pastTaskStart.setDate(weekStart.getDate() - 14); // 2 weeks ago
  const pastTaskEnd = new Date(weekEnd);
  pastTaskEnd.setDate(weekEnd.getDate() - 14);
  const pastVoteStart = new Date(pastTaskEnd);
  const pastVoteEnd = new Date(pastVoteStart);
  pastVoteEnd.setDate(pastVoteEnd.getDate() + 2);

  const completedTask = await prisma.prompt.create({
    data: {
      text: competitionTasks[1],
      weekStart: pastTaskStart,
      weekEnd: pastTaskEnd,
      voteStart: pastVoteStart,
      voteEnd: pastVoteEnd,
      status: 'COMPLETED',
      queueOrder: 0,
      leagueId: mainLeague.id,
    },
  });
  console.log(`📝 Created completed task: "${completedTask.text}"`);

  // Create responses for completed task
  const sampleCaptions = [
    "Really proud of how this turned out! Took me several tries but worth it.",
    "Had so much fun with this challenge. Used stuff I never thought would work together!",
    "This was harder than I expected, but I learned a lot in the process.",
    "Definitely pushed my creative boundaries with this one. Love the result!",
    "Simple approach but I think it's effective. Sometimes less is more.",
  ];

  const sampleImageUrls = [
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500", // Art supplies
    "https://images.unsplash.com/photo-1550950158-8e6aa8b6e5c1?w=500", // Creative workspace
    "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500", // Artistic creation
    "https://images.unsplash.com/photo-1502780402662-acc01917ef2e?w=500", // Handmade item
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500", // Craft project
  ];

  const completedResponses = [];
  for (let i = 0; i < 5; i++) {
    const publishedAt = new Date(pastTaskEnd);
    publishedAt.setMinutes(publishedAt.getMinutes() + (i * 5)); // Stagger publication times

    const response = await prisma.response.create({
      data: {
        caption: sampleCaptions[i],
        imageUrl: sampleImageUrls[i],
        userId: users[i].id,
        promptId: completedTask.id,
        isPublished: true,
        publishedAt,
        totalVotes: 0, // Will be calculated after votes
        totalPoints: 0, // Will be calculated after votes
      },
    });
    completedResponses.push(response);
  }
  console.log(`📸 Created 5 responses for completed task`);

  // Create votes for the completed task
  // Each player votes for their top 3 (excluding their own submission)
  for (let voterIndex = 0; voterIndex < users.length; voterIndex++) {
    const voter = users[voterIndex];
    const availableResponses = completedResponses.filter(r => r.userId !== voter.id);
    
    // Shuffle and take top 3
    const shuffled = availableResponses.sort(() => 0.5 - Math.random());
    const top3 = shuffled.slice(0, 3);
    
    for (let rank = 1; rank <= 3; rank++) {
      if (top3[rank - 1]) {
        const points = 4 - rank; // 1st = 3pts, 2nd = 2pts, 3rd = 1pt
        await prisma.vote.create({
          data: {
            voterId: voter.id,
            responseId: top3[rank - 1].id,
            rank,
            points,
          },
        });
      }
    }
  }
  console.log(`🗳️ Created votes for completed task`);

  // Update response vote counts and calculate rankings
  for (const response of completedResponses) {
    const votes = await prisma.vote.findMany({
      where: { responseId: response.id }
    });
    
    const totalVotes = votes.length;
    const totalPoints = votes.reduce((sum, vote) => sum + vote.points, 0);
    
    await prisma.response.update({
      where: { id: response.id },
      data: { totalVotes, totalPoints },
    });
  }

  // Calculate final rankings
  const responsesByPoints = await prisma.response.findMany({
    where: { promptId: completedTask.id },
    orderBy: [
      { totalPoints: 'desc' },
      { totalVotes: 'desc' },
      { submittedAt: 'asc' },
    ],
  });

  for (let i = 0; i < responsesByPoints.length; i++) {
    await prisma.response.update({
      where: { id: responsesByPoints[i].id },
      data: { finalRank: i + 1 },
    });
  }
  console.log(`🏅 Calculated final rankings for completed task`);

  // Create future scheduled tasks
  for (let i = 2; i < competitionTasks.length; i++) {
    const futureStart = new Date(weekStart);
    futureStart.setDate(weekStart.getDate() + (7 * (i - 1)));
    const futureEnd = new Date(weekEnd);
    futureEnd.setDate(weekEnd.getDate() + (7 * (i - 1)));
    const futureVoteStart = new Date(futureEnd);
    const futureVoteEnd = new Date(futureVoteStart);
    futureVoteEnd.setDate(futureVoteEnd.getDate() + 2);

    await prisma.prompt.create({
      data: {
        text: competitionTasks[i],
        weekStart: futureStart,
        weekEnd: futureEnd,
        voteStart: futureVoteStart,
        voteEnd: futureVoteEnd,
        status: 'SCHEDULED',
        queueOrder: i + 1,
        leagueId: mainLeague.id,
      },
    });
    console.log(`📅 Scheduled future task: "${competitionTasks[i]}"`);
  }

  // Create some current task submissions (not published yet)
  for (let i = 0; i < 3; i++) {
    await prisma.response.create({
      data: {
        caption: `My submission for the current cooking challenge! ${i + 1}`,
        imageUrl: sampleImageUrls[i % sampleImageUrls.length],
        userId: users[i].id,
        promptId: currentTask.id,
        isPublished: false,
      },
    });
  }
  console.log(`🕒 Created 3 pending submissions for current task`);

  console.log('\n🎉 Competition game database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 Main League created`);
  console.log(`   - 6 players created and auto-joined league`);
  console.log(`   - 1 active task (submissions open)`);
  console.log(`   - 1 completed task with votes and rankings`);
  console.log(`   - ${competitionTasks.length - 2} future scheduled tasks`);
  console.log(`   - 3 pending submissions for current task`);
  console.log('\n🔐 Test login credentials:');
  console.log('   Email: player1@example.com | Password: password123');
  console.log('   Email: player2@example.com | Password: password123');
  console.log('   Email: player3@example.com | Password: password123');
  console.log('   (etc. for player4, player5, player6)');
  console.log('\n🏆 Competition Features:');
  console.log('   - Creative task categories (Cooking, Creativity, Photography, etc.)');
  console.log('   - Difficulty levels (1-3)');
  console.log('   - 3-choice voting system (3pts, 2pts, 1pt)');
  console.log('   - Automatic ranking calculation');
  console.log('   - League-based competition');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });