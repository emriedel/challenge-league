import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getWeeklyPromptDates } from '../src/lib/weeklyPrompts';

const prisma = new PrismaClient();

const samplePrompts = [
  "Share a photo that represents your favorite moment from this week",
  "Post a picture of something that made you smile recently",
  "Show us your current view right now",
  "Share a photo of your favorite comfort food",
  "Post a picture of something you're grateful for today",
  "Show us your workspace or study area",
  "Share a photo of your favorite book or something you're reading",
  "Post a picture of the weather outside your window",
  "Show us something you created or made recently",
  "Share a photo of your favorite place to relax",
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  await prisma.response.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const users = [];
  for (let i = 1; i <= 5; i++) {
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await prisma.user.create({
      data: {
        email: `user${i}@example.com`,
        username: `testuser${i}`,
        password: hashedPassword,
      },
    });
    users.push(user);
    console.log(`✅ Created user: ${user.username}`);
  }

  // Create friendships between users
  const friendships = [
    { sender: users[0], receiver: users[1] },
    { sender: users[0], receiver: users[2] },
    { sender: users[1], receiver: users[3] },
    { sender: users[2], receiver: users[3] },
    { sender: users[3], receiver: users[4] },
  ];

  for (const { sender, receiver } of friendships) {
    await prisma.friendship.create({
      data: {
        senderId: sender.id,
        receiverId: receiver.id,
        status: 'ACCEPTED',
      },
    });
    console.log(`🤝 Created friendship: ${sender.username} ↔ ${receiver.username}`);
  }

  // Create current week's prompt
  const { weekStart, weekEnd } = getWeeklyPromptDates();
  const currentPrompt = await prisma.prompt.create({
    data: {
      text: samplePrompts[0],
      weekStart,
      weekEnd,
      status: 'ACTIVE',
      queueOrder: 1,
    },
  });
  console.log(`📝 Created current prompt: "${currentPrompt.text}"`);
  console.log(`   Week: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`);

  // Create a few past prompts with published responses
  const pastPrompts = [];
  for (let i = 1; i <= 3; i++) {
    const pastWeekStart = new Date(weekStart);
    pastWeekStart.setDate(weekStart.getDate() - (7 * i));
    const pastWeekEnd = new Date(weekEnd);
    pastWeekEnd.setDate(weekEnd.getDate() - (7 * i));

    const pastPrompt = await prisma.prompt.create({
      data: {
        text: samplePrompts[i],
        weekStart: pastWeekStart,
        weekEnd: pastWeekEnd,
        status: 'COMPLETED',
        queueOrder: i - 3, // Negative numbers for past prompts
      },
    });
    pastPrompts.push(pastPrompt);
    console.log(`📝 Created past prompt: "${pastPrompt.text}"`);
  }

  // Create future scheduled prompts
  for (let i = 4; i <= 7; i++) {
    const futureWeekStart = new Date(weekStart);
    futureWeekStart.setDate(weekStart.getDate() + (7 * (i - 3)));
    const futureWeekEnd = new Date(weekEnd);
    futureWeekEnd.setDate(weekEnd.getDate() + (7 * (i - 3)));

    await prisma.prompt.create({
      data: {
        text: samplePrompts[i],
        weekStart: futureWeekStart,
        weekEnd: futureWeekEnd,
        status: 'SCHEDULED',
        queueOrder: i + 1,
      },
    });
    console.log(`📅 Created scheduled prompt: "${samplePrompts[i]}"`);
  }

  // Create some published responses for past prompts
  const sampleCaptions = [
    "This was such a beautiful moment!",
    "Couldn't resist sharing this 😊",
    "Perfect way to end the week",
    "This made my day so much better",
    "Found this absolutely fascinating",
    "Such a peaceful moment",
    "This brings back great memories",
    "Love how this turned out",
    "This was completely unexpected",
    "Perfect timing for this photo",
  ];

  const sampleImageUrls = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500",
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=500",
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=500",
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=500",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500",
    "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500",
    "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?w=500",
    "https://images.unsplash.com/photo-1544967882-b6ef5aa6ad64?w=500",
    "https://images.unsplash.com/photo-1570136041404-b2c22b5d3388?w=500",
    "https://images.unsplash.com/photo-1585503418537-88331351ad99?w=500",
  ];

  let responseIndex = 0;
  for (const pastPrompt of pastPrompts) {
    // Create 2-4 responses per past prompt
    const numResponses = Math.floor(Math.random() * 3) + 2;
    const selectedUsers = users.slice(0, numResponses);
    
    for (const user of selectedUsers) {
      const publishedAt = new Date(pastPrompt.weekEnd);
      publishedAt.setMinutes(publishedAt.getMinutes() + Math.floor(Math.random() * 60));

      await prisma.response.create({
        data: {
          caption: sampleCaptions[responseIndex % sampleCaptions.length],
          imageUrl: sampleImageUrls[responseIndex % sampleImageUrls.length],
          userId: user.id,
          promptId: pastPrompt.id,
          isPublished: true,
          publishedAt,
        },
      });
      responseIndex++;
    }
    console.log(`📸 Created ${numResponses} responses for prompt: "${pastPrompt.text}"`);
  }

  // Create some pending responses for current prompt (not published yet)
  for (let i = 0; i < 2; i++) {
    await prisma.response.create({
      data: {
        caption: `My response to this week's prompt ${i + 1}`,
        imageUrl: sampleImageUrls[i % sampleImageUrls.length],
        userId: users[i].id,
        promptId: currentPrompt.id,
        isPublished: false,
      },
    });
  }
  console.log(`🕒 Created 2 pending responses for current prompt`);

  console.log('🎉 Database seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 5 test users created`);
  console.log(`   - 5 friendships created`);
  console.log(`   - 4 prompts created (1 current, 3 past)`);
  console.log(`   - Multiple published responses for past prompts`);
  console.log(`   - 2 pending responses for current prompt`);
  console.log('\n🔐 Test login credentials:');
  console.log('   Email: user1@example.com | Password: password123');
  console.log('   Email: user2@example.com | Password: password123');
  console.log('   Email: user3@example.com | Password: password123');
  console.log('   (etc. for user4, user5)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });