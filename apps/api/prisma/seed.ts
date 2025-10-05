import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with AI models and companies...');

  // Create companies
  const companies = [
    {
      id: 'openai',
      name: 'OpenAI',
      logoUrl: 'https://cdn.openai.com/assets/logo-share-card.png',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      logoUrl: 'https://www.anthropic.com/images/icons/anthropic-logo.svg',
    },
    {
      id: 'xai',
      name: 'xAI',
      logoUrl: 'https://x.ai/favicon.svg',
    },
    {
      id: 'google',
      name: 'Google',
      logoUrl: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
    },
    {
      id: 'meta',
      name: 'Meta',
      logoUrl: 'https://www.meta.com/static_resource/meta-logo.svg',
    },
    {
      id: 'mistral',
      name: 'Mistral',
      logoUrl: 'https://mistral.ai/images/logo.svg',
    },
    {
      id: 'cohere',
      name: 'Cohere',
      logoUrl: 'https://cohere.com/favicon.svg',
    },
  ];

  for (const company of companies) {
    await prisma.company.upsert({
      where: { id: company.id },
      update: {},
      create: company,
    });
  }
  console.log('✅ Created 6 companies');

  // Create AI models
  const models = [
    // OpenAI models
    {
      id: 'gpt-4-turbo',
      companyId: 'openai',
      name: 'GPT-4 Turbo',
      description: 'Most capable GPT-4 model with improved performance and 128K context',
      capabilities: {
        reasoning: 'excellent',
        coding: 'excellent',
        creative: 'excellent',
        context: '128k',
      },
      latencyHint: 'Medium (2-5s)',
      costEstimate: '$$$',
    },
    {
      id: 'gpt-4',
      companyId: 'openai',
      name: 'GPT-4',
      description: 'Powerful model for complex tasks requiring deep reasoning',
      capabilities: {
        reasoning: 'excellent',
        coding: 'excellent',
        creative: 'excellent',
        context: '8k',
      },
      latencyHint: 'Medium (3-6s)',
      costEstimate: '$$',
    },
    {
      id: 'gpt-3.5-turbo',
      companyId: 'openai',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and efficient for most conversational tasks',
      capabilities: {
        reasoning: 'good',
        coding: 'good',
        creative: 'good',
        context: '16k',
      },
      latencyHint: 'Fast (1-2s)',
      costEstimate: '$',
    },
    {
      id: 'gpt-3.5-turbo-16k',
      companyId: 'openai',
      name: 'GPT-3.5 Turbo 16K',
      description: 'Extended context version of GPT-3.5 Turbo',
      capabilities: {
        reasoning: 'good',
        coding: 'good',
        creative: 'good',
        context: '16k',
      },
      latencyHint: 'Fast (1-2s)',
      costEstimate: '$',
    },
    // Anthropic models
    {
      id: 'claude-3-opus',
      companyId: 'anthropic',
      name: 'Claude 3 Opus',
      description: 'Most powerful Claude model for complex reasoning and analysis',
      capabilities: {
        reasoning: 'excellent',
        coding: 'excellent',
        creative: 'excellent',
        context: '200k',
      },
      latencyHint: 'Medium (3-5s)',
      costEstimate: '$$$',
    },
    {
      id: 'claude-3-sonnet',
      companyId: 'anthropic',
      name: 'Claude 3 Sonnet',
      description: 'Balanced performance and speed for most tasks',
      capabilities: {
        reasoning: 'very good',
        coding: 'very good',
        creative: 'very good',
        context: '200k',
      },
      latencyHint: 'Fast (2-3s)',
      costEstimate: '$$',
    },
    {
      id: 'claude-3-haiku',
      companyId: 'anthropic',
      name: 'Claude 3 Haiku',
      description: 'Fastest Claude model for quick responses',
      capabilities: {
        reasoning: 'good',
        coding: 'good',
        creative: 'good',
        context: '200k',
      },
      latencyHint: 'Very Fast (<1s)',
      costEstimate: '$',
    },
    {
      id: 'claude-2.1',
      companyId: 'anthropic',
      name: 'Claude 2.1',
      description: 'Previous generation with reliable performance',
      capabilities: {
        reasoning: 'very good',
        coding: 'very good',
        creative: 'very good',
        context: '100k',
      },
      latencyHint: 'Fast (2-3s)',
      costEstimate: '$$',
    },
    // xAI models
    {
      id: 'grok-beta',
      companyId: 'xai',
      name: 'Grok Beta',
      description: 'Beta version of Grok with real-time information access',
      capabilities: {
        reasoning: 'very good',
        coding: 'very good',
        creative: 'excellent',
        context: '128k',
        realtime: true,
      },
      latencyHint: 'Fast (2-3s)',
      costEstimate: '$$',
    },
    {
      id: 'grok-2',
      companyId: 'xai',
      name: 'Grok 2',
      description: 'Latest Grok model with enhanced reasoning and real-time data',
      capabilities: {
        reasoning: 'excellent',
        coding: 'excellent',
        creative: 'excellent',
        context: '128k',
        realtime: true,
      },
      latencyHint: 'Medium (2-4s)',
      costEstimate: '$$$',
    },
  ];

  for (const model of models) {
    await prisma.model.upsert({
      where: { id: model.id },
      update: {},
      create: model,
    });
  }
  console.log(`✅ Created ${models.length} AI models (4 OpenAI + 4 Anthropic + 2 xAI)`);

  // Show summary
  const companiesWithModels = await prisma.company.findMany({
    include: {
      _count: {
        select: { models: true },
      },
    },
  });

  console.log('\n📊 Summary:');
  companiesWithModels.forEach((company) => {
    console.log(`  ${company.name}: ${company._count.models} models`);
  });
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
