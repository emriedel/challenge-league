import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 20 diverse usernames
const usernames = [
  'PhotoPhoenix', 'CraftyCaptain', 'PixelPioneer', 'ArtisticAce', 'CreativeComet',
  'SnapSage', 'VisionVoyager', 'DreamDesigner', 'StudioStar', 'FrameFusion',
  'ColorCrafter', 'LensLegend', 'BrushBoss', 'SketchSorcerer', 'PaintPro',
  'DigitalDynamo', 'ArtfulAvenger', 'CreativeClimber', 'VisualVibe', 'MasterMaker'
];

// 10 completed competition tasks with variety
const completedTasks = [
  "Submit a photo of a beautiful dinner you made this week",
  "Create something artistic with household items and share the result", 
  "Capture an interesting shadow or reflection in your daily life",
  "Visit somewhere you've never been before and document it",
  "Make your workspace/room look as cozy as possible",
  "Create the most impressive snack or drink presentation",
  "Find and photograph the most interesting texture around you",
  "Build something functional using only items from your junk drawer",
  "Take a photo that represents your current mood or feeling",
  "Show us your most creative use of natural lighting"
];

// Diverse sample captions
const sampleCaptions = [
  "Really proud of how this turned out! Took me several tries but worth it.",
  "Had so much fun with this challenge. Used stuff I never thought would work together!",
  "This was harder than I expected, but I learned a lot in the process.",
  "Definitely pushed my creative boundaries with this one. Love the result!",
  "Simple approach but I think it's effective. Sometimes less is more.",
  "Spent way too much time on this but couldn't stop tweaking it!",
  "First time trying something like this - pleasantly surprised with the outcome.",
  "The lighting was perfect for this shot. Sometimes timing is everything.",
  "Inspired by a tutorial I watched, but added my own twist to it.",
  "This challenge made me look at everyday objects in a completely new way.",
  "Almost gave up halfway through, but so glad I persisted!",
  "My kids helped me with this one - family collaboration at its finest.",
  "Found all the materials in my garage. One person's junk is another's treasure!",
  "The weather wasn't cooperating, but I think it added character.",
  "This represents exactly how I felt this week - chaotic but beautiful.",
  "Minimalist approach this time. Trying to say more with less.",
  "Happy accident turned into my favorite part of this creation.",
  "Couldn't decide between two versions, went with my gut feeling.",
  "This challenge pushed me out of my comfort zone in the best way.",
  "Nature provided the perfect backdrop - I just had to capture it right."
];

// Reliable placeholder images using picsum.photos (Lorem Picsum)
const imageUrls = [
  "https://picsum.photos/500/400?random=1", // Random image 1
  "https://picsum.photos/500/400?random=2", // Random image 2
  "https://picsum.photos/500/400?random=3", // Random image 3
  "https://picsum.photos/500/400?random=4", // Random image 4
  "https://picsum.photos/500/400?random=5", // Random image 5
  "https://picsum.photos/500/400?random=6", // Random image 6
  "https://picsum.photos/500/400?random=7", // Random image 7
  "https://picsum.photos/500/400?random=8", // Random image 8
  "https://picsum.photos/500/400?random=9", // Random image 9
  "https://picsum.photos/500/400?random=10", // Random image 10
  "https://picsum.photos/500/400?random=11", // Random image 11
  "https://picsum.photos/500/400?random=12", // Random image 12
  "https://picsum.photos/500/400?random=13", // Random image 13
  "https://picsum.photos/500/400?random=14", // Random image 14
  "https://picsum.photos/500/400?random=15", // Random image 15
  "https://picsum.photos/500/400?random=16", // Random image 16
  "https://picsum.photos/500/400?random=17", // Random image 17
  "https://picsum.photos/500/400?random=18", // Random image 18
  "https://picsum.photos/500/400?random=19", // Random image 19
  "https://picsum.photos/500/400?random=20"  // Random image 20
];

// Helper function to get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

// Helper function to get random item from array  
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function main() {
  console.log('🌱 Starting LARGE competition database seed...');
  console.log('   Creating 20 users and 5 completed rounds with realistic data...');

  // Clear existing data
  console.log('🧽 Clearing existing data...');
  await prisma.vote.deleteMany();
  await prisma.response.deleteMany();
  await prisma.leagueMembership.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.league.deleteMany();
  await prisma.user.deleteMany();

  // Create 20 test users
  console.log('👥 Creating 20 users...');
  const users = [];
  for (let i = 0; i < 20; i++) {
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await prisma.user.create({
      data: {
        email: `${usernames[i].toLowerCase()}@example.com`,
        username: usernames[i],
        password: hashedPassword,
      },
    });
    users.push(user);
    if (i % 5 === 0) console.log(`   ✅ Created ${i + 1}/20 users...`);
  }
  console.log(`✅ All 20 users created!`);

  // Create main league with first user as owner
  const mainLeague = await prisma.league.create({
    data: {
      name: "Creative Champions League",
      slug: "creative-champions",
      description: "A vibrant community of 20 creative minds competing in weekly artistic challenges. From photography to crafts, cooking to digital art - creativity knows no bounds here!",
      inviteCode: generateInviteCode(),
      isActive: true,
      ownerId: users[0].id,
    },
  });
  console.log(`🏆 Created league: ${mainLeague.name}`);
  console.log(`   Owner: ${users[0].username} | Invite Code: ${mainLeague.inviteCode}`);

  // Add all users to the league
  console.log('👥 Adding all users to the league...');
  for (let i = 0; i < users.length; i++) {
    await prisma.leagueMembership.create({
      data: {
        userId: users[i].id,
        leagueId: mainLeague.id,
        isActive: true,
      },
    });
    if (i % 5 === 0) console.log(`   Added ${i + 1}/20 users to league...`);
  }
  console.log(`✅ All 20 users added to league!`);

  // Create 5 completed rounds
  console.log('🏁 Creating 5 completed rounds with submissions and votes...');
  
  for (let roundNum = 0; roundNum < 5; roundNum++) {
    console.log(`\\n📝 Creating Round ${roundNum + 1}/5: "${completedTasks[roundNum]}"`);
    
    // Calculate dates for this round (going backwards in time)
    const weeksAgo = 5 - roundNum; // Round 1 is 5 weeks ago, Round 5 is 1 week ago
    const roundStart = new Date();
    roundStart.setDate(roundStart.getDate() - (weeksAgo * 7));
    roundStart.setHours(12, 0, 0, 0); // Saturday 12 PM
    
    const roundEnd = new Date(roundStart);
    roundEnd.setDate(roundEnd.getDate() + 7); // Next Saturday
    
    const voteStart = new Date(roundEnd);
    const voteEnd = new Date(voteStart);
    voteEnd.setDate(voteEnd.getDate() + 2); // Monday

    // Create the completed prompt
    const prompt = await prisma.prompt.create({
      data: {
        text: completedTasks[roundNum],
        weekStart: roundStart,
        weekEnd: roundEnd,
        voteStart: voteStart,
        voteEnd: voteEnd,
        status: 'COMPLETED',
        queueOrder: roundNum,
        leagueId: mainLeague.id,
      },
    });

    // Determine how many users submitted (between 12-18 out of 20)
    const submissionCount = 12 + Math.floor(Math.random() * 7); // 12-18 submissions
    const submittingUsers = getRandomItems(users, submissionCount);
    
    console.log(`   📸 Creating ${submissionCount} submissions...`);
    
    // Create responses for this round
    const responses = [];
    for (let i = 0; i < submittingUsers.length; i++) {
      const user = submittingUsers[i];
      const publishedAt = new Date(roundEnd);
      publishedAt.setMinutes(publishedAt.getMinutes() + (i * 2)); // Stagger publications
      
      const response = await prisma.response.create({
        data: {
          caption: getRandomItem(sampleCaptions),
          imageUrl: getRandomItem(imageUrls),
          userId: user.id,
          promptId: prompt.id,
          isPublished: true,
          publishedAt,
          totalVotes: 0,
          totalPoints: 0,
        },
      });
      responses.push(response);
    }

    console.log(`   🗳️ Creating votes from all 20 users...`);
    
    // Create votes - every user gets exactly 3 votes per round (even if they didn't submit)
    // Each vote is worth 1 point, users can distribute votes however they want
    
    for (let voterIndex = 0; voterIndex < users.length; voterIndex++) {
      const voter = users[voterIndex];
      const availableResponses = responses.filter(r => r.userId !== voter.id);
      
      if (availableResponses.length >= 1) {
        // Shuffle available responses
        const shuffled = [...availableResponses].sort(() => 0.5 - Math.random());
        
        // Each user gets exactly 3 votes to distribute
        // They can give multiple votes to the same response or spread them out
        const votesToGive = 3;
        const voteDistribution = [];
        
        // Randomly decide how to distribute the 3 votes
        // Options: [3,0,0], [2,1,0], [1,1,1], etc.
        const remainingVotes = votesToGive;
        const maxResponsestoVoteFor = Math.min(3, shuffled.length);
        const responsesToVoteFor = shuffled.slice(0, maxResponsestoVoteFor);
        
        // Simple approach: distribute votes randomly but ensure total = 3
        let votesLeft = votesToGive;
        for (let i = 0; i < responsesToVoteFor.length - 1; i++) {
          const maxVotesForThis = Math.min(votesLeft, 3); // Max 3 votes per response
          const votesForThis = Math.floor(Math.random() * (maxVotesForThis + 1));
          voteDistribution.push({ response: responsesToVoteFor[i], votes: votesForThis });
          votesLeft -= votesForThis;
        }
        // Give remaining votes to last response
        if (votesLeft > 0 && responsesToVoteFor.length > 0) {
          voteDistribution.push({ 
            response: responsesToVoteFor[responsesToVoteFor.length - 1], 
            votes: votesLeft 
          });
        }
        
        // Create the actual vote records
        for (const { response, votes } of voteDistribution) {
          for (let v = 0; v < votes; v++) {
            await prisma.vote.create({
              data: {
                voterId: voter.id,
                responseId: response.id,
                points: 1, // Each vote worth 1 point
              },
            });
          }
        }
      }
    }

    // Calculate vote totals and rankings
    console.log(`   🏅 Calculating results...`);
    
    // Update response vote counts
    for (const response of responses) {
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
      where: { promptId: prompt.id },
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
    
    // Show round results
    const topResponse = responsesByPoints[0];
    const topUser = users.find(u => u.id === topResponse.userId);
    console.log(`   🏆 Winner: ${topUser?.username} with ${topResponse.totalPoints} points`);
  }

  console.log('\\n📊 FINAL SUMMARY:');
  console.log(`   🏆 League: ${mainLeague.name}`);
  console.log(`   👥 Users: 20 active members`);
  console.log(`   🏁 Completed Rounds: 5`);
  console.log(`   📸 Total Submissions: ~75-90 (varies per round)`);
  console.log(`   🗳️ Total Votes: ~300 (20 users × 3 votes × 5 rounds)`);
  
  // Calculate and display leaderboard
  console.log('\\n🏅 LEAGUE LEADERBOARD:');
  
  const leaderboardData = [];
  for (const user of users) {
    const userResponses = await prisma.response.findMany({
      where: {
        userId: user.id,
        isPublished: true,
        prompt: { status: 'COMPLETED', leagueId: mainLeague.id }
      }
    });
    
    const totalPoints = userResponses.reduce((sum, r) => sum + r.totalPoints, 0);
    const wins = userResponses.filter(r => r.finalRank === 1).length;
    const podiums = userResponses.filter(r => r.finalRank && r.finalRank <= 3).length;
    
    leaderboardData.push({
      username: user.username,
      totalPoints,
      wins,
      podiums,
      submissions: userResponses.length
    });
  }
  
  leaderboardData.sort((a, b) => b.totalPoints - a.totalPoints);
  
  console.log('   Rank | Player         | Points | Wins | Podiums | Submissions');
  console.log('   -----|----------------|--------|------|---------|------------');
  for (let i = 0; i < Math.min(10, leaderboardData.length); i++) {
    const player = leaderboardData[i];
    const rank = (i + 1).toString().padStart(4);
    const name = player.username.padEnd(14);
    const points = player.totalPoints.toString().padStart(6);
    const wins = player.wins.toString().padStart(4);
    const podiums = player.podiums.toString().padStart(7);
    const subs = player.submissions.toString().padStart(11);
    console.log(`   ${rank} | ${name} | ${points} | ${wins} | ${podiums} | ${subs}`);
  }
  
  console.log('\\n🔐 LOGIN CREDENTIALS:');
  console.log('   Any user: [username]@example.com | Password: password123');
  console.log('   Examples:');
  console.log(`   - ${users[0].email} (League Owner)`);
  console.log(`   - ${users[1].email}`);
  console.log(`   - ${users[2].email}`);
  
  console.log('\\n🎉 LARGE DATABASE SEED COMPLETED!');
  console.log('   The league is now ready for testing with realistic data.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });