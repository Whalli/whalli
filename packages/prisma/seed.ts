import { prisma, UserRole } from './index';

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@whalli.com' },
    update: {},
    create: {
      email: 'admin@whalli.com',
      name: 'Admin User',
      password: '$2a$10$XYZ...', // In production, use proper hashed password
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@whalli.com' },
    update: {},
    create: {
      email: 'test@whalli.com',
      name: 'Test User',
      password: '$2a$10$XYZ...', // In production, use proper hashed password
      role: UserRole.USER,
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // Create sample presets
  const helpfulPreset = await prisma.preset.upsert({
    where: { id: 'preset-helpful' },
    update: {},
    create: {
      id: 'preset-helpful',
      name: 'Helpful Assistant',
      color: '#3B82F6',
      systemInstruction:
        'You are a helpful, friendly, and knowledgeable assistant. Provide clear, accurate, and concise responses.',
      userId: testUser.id,
    },
  });

  console.log('✅ Created preset:', helpfulPreset.name);

  const codePreset = await prisma.preset.upsert({
    where: { id: 'preset-code' },
    update: {},
    create: {
      id: 'preset-code',
      name: 'Code Expert',
      color: '#10B981',
      systemInstruction:
        'You are an expert software developer. Help users with coding problems, explain technical concepts clearly, and write clean, well-documented code.',
      userId: testUser.id,
    },
  });

  console.log('✅ Created preset:', codePreset.name);

  // Create sample chat with messages
  const chat = await prisma.chat.create({
    data: {
      title: 'Welcome Chat',
      model: 'gpt-4',
      userId: testUser.id,
      presetId: helpfulPreset.id,
      messages: {
        create: [
          {
            role: 'SYSTEM',
            content: helpfulPreset.systemInstruction,
          },
          {
            role: 'USER',
            content: 'Hello! Can you help me understand how this app works?',
          },
          {
            role: 'ASSISTANT',
            content:
              "Of course! I'd be happy to help. This is a chat application where you can have conversations with AI assistants. You can create different presets with custom instructions to tailor the AI's behavior to your needs. What would you like to know more about?",
          },
        ],
      },
    },
    include: {
      messages: true,
    },
  });

  console.log('✅ Created sample chat:', chat.title);
  console.log('   with', chat.messages.length, 'messages');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📊 Database summary:');
  console.log('   Users:', await prisma.user.count());
  console.log('   Presets:', await prisma.preset.count());
  console.log('   Chats:', await prisma.chat.count());
  console.log('   Messages:', await prisma.message.count());
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
