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

// 20 diverse usernames and emails
const users = [
  { username: 'PhotoPhoenix', email: 'photophoenix@example.com' },
  { username: 'CraftyCaptain', email: 'craftycaptain@example.com' },
  { username: 'PixelPioneer', email: 'pixelpioneer@example.com' },
  { username: 'ArtisticAce', email: 'artisticace@example.com' },
  { username: 'CreativeComet', email: 'creativecomet@example.com' },
  { username: 'SnapSage', email: 'snapsage@example.com' },
  { username: 'VisionVoyager', email: 'visionvoyager@example.com' },
  { username: 'DreamDesigner', email: 'dreamdesigner@example.com' },
  { username: 'StudioStar', email: 'studiostar@example.com' },
  { username: 'FrameFusion', email: 'framefusion@example.com' },
  { username: 'ColorCrafter', email: 'colorcrafter@example.com' },
  { username: 'LensLegend', email: 'lenslegend@example.com' },
  { username: 'BrushBoss', email: 'brushboss@example.com' },
  { username: 'SketchSorcerer', email: 'sketchsorcerer@example.com' },
  { username: 'PaintPro', email: 'paintpro@example.com' },
  { username: 'DigitalDynamo', email: 'digitaldynamo@example.com' },
  { username: 'ArtfulAvenger', email: 'artfulavenger@example.com' },
  { username: 'CreativeClimber', email: 'creativeclimber@example.com' },
  { username: 'VisualVibe', email: 'visualvibe@example.com' },
  { username: 'MasterMaker', email: 'mastermaker@example.com' }
];

// Competition tasks for different rounds
const competitionTasks = [
  // Completed tasks (past rounds)
  "Submit a photo of a beautiful dinner you made this week",
  "Create something artistic with household items and share the result",
  "Capture an interesting shadow or reflection in your daily life",
  "Visit somewhere you've never been before and document it",
  "Make your workspace/room look as cozy as possible",
  "Create the most impressive snack or drink presentation",
  "Find and photograph the most interesting texture around you",
  "Build something functional using only items from your junk drawer",
  "Take a photo that represents your current mood or feeling",
  "Show us your most creative use of natural lighting",
  
  // Current and future tasks
  "Design a cozy reading nook using items you already own",
  "Create an abstract composition using only kitchen utensils",
  "Photograph the most interesting architectural detail near you",
  "Make a miniature world scene in a small container",
  "Create a color gradient using natural objects",
  "Build the tallest stable structure using paper only",
  "Photograph water in its most interesting form",
  "Design a functional bookmark with recycled materials",
  "Create a pattern using shadows and light",
  "Make edible art that's almost too pretty to eat"
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
  "My kids helped me with this one - their creativity amazes me!",
  "Found this old material in my garage and it was perfect for this.",
  "The weather wasn't cooperating but I made it work somehow.",
  "This reminded me why I love being creative. Pure joy!",
  "Learned a new technique just for this challenge. Always growing!",
  "My neighbors probably think I'm crazy, but art is art!",
  "This took longer than expected but the process was so relaxing.",
  "Happy accident turned into my favorite part of this piece.",
  "Sometimes the best ideas come at 2am. This was one of those times."
];

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // Clear existing data
  await prisma.vote.deleteMany();
  await prisma.response.deleteMany();
  await prisma.leagueMembership.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.league.deleteMany();
  
  // Clear sessions and accounts (NextAuth data) to force fresh login after reseed
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  
  console.log('🔑 Cleared all sessions - users will need to log in again after reseed');
  
  // Delete users last due to foreign key constraints
  await prisma.user.deleteMany();

  // Create 20 users
  const hashedPassword = await bcrypt.hash('password123', 10);
  const createdUsers = [];
  
  for (let i = 0; i < users.length; i++) {
    const user = await prisma.user.create({
      data: {
        username: users[i].username,
        email: users[i].email,
        hashedPassword,
        profileComplete: true,
      },
    });
    createdUsers.push(user);
    console.log(`✅ Created user: ${user.username}`);
  }

  // Create 3 leagues with different themes
  const leagues = [
    {
      name: "Main Creative League",
      description: "The original creative competition for all skill levels",
      slug: "main-creative-league"
    },
    {
      name: "Photography Masters",
      description: "Advanced photography challenges for skilled shooters",
      slug: "photography-masters"
    },
    {
      name: "Crafty Creators",
      description: "Hands-on making and building challenges",
      slug: "crafty-creators"
    }
  ];

  const createdLeagues = [];
  for (let i = 0; i < leagues.length; i++) {
    const league = await prisma.league.create({
      data: {
        name: leagues[i].name,
        description: leagues[i].description,
        slug: leagues[i].slug,
        inviteCode: generateInviteCode(),
        ownerId: createdUsers[i].id,
      },
    });
    createdLeagues.push(league);
    console.log(`🏆 Created league: ${league.name} (owner: ${createdUsers[i].username}, invite: ${league.inviteCode})`);
  }

  // Distribute users across leagues (including some in multiple leagues)
  const leagueMemberships = [
    // Main Creative League - 15 members (users 0-14)
    ...Array.from({ length: 15 }, (_, i) => ({ userId: createdUsers[i].id, leagueId: createdLeagues[0].id })),
    
    // Photography Masters - 10 members (users 5-14, overlapping with main)
    ...Array.from({ length: 10 }, (_, i) => ({ userId: createdUsers[i + 5].id, leagueId: createdLeagues[1].id })),
    
    // Crafty Creators - 12 members (users 8-19, overlapping with others)
    ...Array.from({ length: 12 }, (_, i) => ({ userId: createdUsers[i + 8].id, leagueId: createdLeagues[2].id }))
  ];

  for (const membership of leagueMemberships) {
    await prisma.leagueMembership.create({ data: membership });
    const user = createdUsers.find(u => u.id === membership.userId);
    const league = createdLeagues.find(l => l.id === membership.leagueId);
    console.log(`👥 Added ${user?.username} to ${league?.name}`);
  }

  // Create rounds for each league
  for (let leagueIndex = 0; leagueIndex < createdLeagues.length; leagueIndex++) {
    const league = createdLeagues[leagueIndex];
    const leagueMembers = createdUsers.filter(user => 
      leagueMemberships.some(m => m.userId === user.id && m.leagueId === league.id)
    );
    
    console.log(`\n📅 Creating rounds for ${league.name}...`);
    
    // Create 3 completed rounds
    for (let roundIndex = 0; roundIndex < 3; roundIndex++) {
      const taskIndex = leagueIndex * 10 + roundIndex; // Unique tasks per league
      const task = competitionTasks[taskIndex];
      
      // Create completed prompt (3 weeks ago, 2 weeks ago, 1 week ago)
      const weeksAgo = 3 - roundIndex;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (weeksAgo * 7));
      
      const { submissionStart, submissionEnd, votingStart, votingEnd } = getWeeklyPromptDates(startDate);
      
      const prompt = await prisma.prompt.create({
        data: {
          text: task,
          leagueId: league.id,
          status: 'COMPLETED',
          submissionStart,
          submissionEnd,
          votingStart,
          votingEnd,
          queueOrder: roundIndex,
        },
      });
      
      console.log(`📝 Created completed round: "${task}"`);
      
      // Create submissions from 60-80% of league members
      const participationRate = 0.6 + Math.random() * 0.2; // 60-80%
      const numParticipants = Math.floor(leagueMembers.length * participationRate);
      const participants = leagueMembers.slice(0, numParticipants);
      
      const createdResponses = [];
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const response = await prisma.response.create({
          data: {
            userId: participant.id,
            promptId: prompt.id,
            photoUrl: `https://picsum.photos/800/600?random=${Date.now() + i}`,
            caption: sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)],
            submitted: true,
          },
        });
        createdResponses.push(response);
      }
      
      console.log(`📸 Created ${createdResponses.length} submissions for completed round`);
      
      // Create votes from league members (everyone gets 3 votes)
      const voters = leagueMembers.filter(member => 
        !createdResponses.some(r => r.userId === member.id)
      ); // Non-participants vote
      
      for (const voter of voters) {
        // Each voter gives 3 votes (can be distributed as 3-0-0, 2-1-0, or 1-1-1)
        const voteDistributions = [
          [3, 0, 0], [2, 1, 0], [1, 1, 1], [2, 0, 1]
        ];
        const distribution = voteDistributions[Math.floor(Math.random() * voteDistributions.length)];
        
        // Shuffle responses and assign votes
        const shuffledResponses = [...createdResponses].sort(() => Math.random() - 0.5);
        
        for (let voteIndex = 0; voteIndex < distribution.length && voteIndex < shuffledResponses.length; voteIndex++) {
          const votes = distribution[voteIndex];
          if (votes > 0) {
            await prisma.vote.create({
              data: {
                userId: voter.id,
                responseId: shuffledResponses[voteIndex].id,
                votes: votes,
              },
            });
          }
        }
      }
      
      // Calculate and update final rankings
      for (const response of createdResponses) {
        const totalVotes = await prisma.vote.aggregate({
          where: { responseId: response.id },
          _sum: { votes: true },
        });
        
        await prisma.response.update({
          where: { id: response.id },
          data: { 
            totalVotes: totalVotes._sum.votes || 0,
            published: true 
          },
        });
      }
      
      // Calculate rankings
      const responsesWithVotes = await prisma.response.findMany({
        where: { promptId: prompt.id },
        orderBy: { totalVotes: 'desc' },
      });
      
      for (let i = 0; i < responsesWithVotes.length; i++) {
        await prisma.response.update({
          where: { id: responsesWithVotes[i].id },
          data: { finalRank: i + 1 },
        });
      }
      
      console.log(`🗳️ Created votes and calculated rankings for completed round`);
    }
    
    // Create 1 current round (active submission phase)
    const currentTaskIndex = leagueIndex * 10 + 3;
    const currentTask = competitionTasks[currentTaskIndex];
    const { submissionStart, submissionEnd, votingStart, votingEnd } = getWeeklyPromptDates();
    
    const currentPrompt = await prisma.prompt.create({
      data: {
        text: currentTask,
        leagueId: league.id,
        status: 'ACTIVE',
        submissionStart,
        submissionEnd,
        votingStart,
        votingEnd,
        queueOrder: 3,
      },
    });
    
    console.log(`📝 Created current round: "${currentTask}"`);
    
    // Create some partial submissions for current round (30-50% of members)
    const currentParticipationRate = 0.3 + Math.random() * 0.2;
    const currentParticipants = Math.floor(leagueMembers.length * currentParticipationRate);
    
    for (let i = 0; i < currentParticipants; i++) {
      await prisma.response.create({
        data: {
          userId: leagueMembers[i].id,
          promptId: currentPrompt.id,
          photoUrl: `https://picsum.photos/800/600?random=${Date.now() + i + 1000}`,
          caption: sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)],
          submitted: true,
        },
      });
    }
    
    console.log(`🕒 Created ${currentParticipants} submissions for current round`);
    
    // Create 3 future scheduled rounds
    for (let futureIndex = 0; futureIndex < 3; futureIndex++) {
      const futureTaskIndex = leagueIndex * 10 + 4 + futureIndex;
      const futureTask = competitionTasks[futureTaskIndex];
      
      await prisma.prompt.create({
        data: {
          text: futureTask,
          leagueId: league.id,
          status: 'SCHEDULED',
          queueOrder: 4 + futureIndex,
        },
      });
      
      console.log(`📅 Scheduled future round: "${futureTask}"`);
    }
  }

  console.log('\n🎉 Comprehensive database seed completed successfully!');
  
  console.log('\n📊 Summary:');
  console.log(`   - 3 leagues created with different themes`);
  console.log(`   - 20 users created and distributed across leagues`);
  console.log(`   - Each league has 3 completed rounds with submissions and votes`);
  console.log(`   - Each league has 1 active round with partial submissions`);
  console.log(`   - Each league has 3 scheduled future rounds`);
  console.log(`   - Users participate in multiple leagues with realistic overlap`);

  console.log('\n🔐 Test login credentials:');
  console.log('   Email: photophoenix@example.com | Password: password123');
  console.log('   Email: craftycaptain@example.com | Password: password123');
  console.log('   Email: pixelpioneer@example.com | Password: password123');
  console.log('   (All 20 users use password123)');

  console.log('\n🏆 League Features:');
  console.log('   - Multi-league membership support');
  console.log('   - Completed rounds with realistic vote distributions');
  console.log('   - Active rounds with partial participation');
  console.log('   - Scheduled future rounds ready for activation');
  console.log('   - Comprehensive competition history and rankings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });