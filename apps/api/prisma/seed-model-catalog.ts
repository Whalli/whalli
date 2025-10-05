import { PrismaClient, SubscriptionPlan } from '@prisma/client';

const prisma = new PrismaClient();

const modelCatalog = [
  {
    companyName: 'OpenAI',
    logoUrl: 'https://openai.com/favicon.ico',
    website: 'https://openai.com',
    models: [
      {
        name: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        description: 'Most capable GPT-4 model with 128K context window',
        capabilities: ['chat', 'completion', 'function-calling', 'vision'],
        contextWindow: 128000,
        maxOutput: 4096,
        latencyHint: 'medium',
        costEstimate: 'high',
        tierRequired: SubscriptionPlan.PRO,
        order: 1,
      },
      {
        name: 'gpt-4',
        displayName: 'GPT-4',
        description: 'High intelligence model for complex tasks',
        capabilities: ['chat', 'completion', 'function-calling'],
        contextWindow: 8192,
        maxOutput: 4096,
        latencyHint: 'slow',
        costEstimate: 'high',
        tierRequired: SubscriptionPlan.PRO,
        order: 2,
      },
      {
        name: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo',
        description: 'Fast and efficient model for most tasks',
        capabilities: ['chat', 'completion', 'function-calling'],
        contextWindow: 16385,
        maxOutput: 4096,
        latencyHint: 'fast',
        costEstimate: 'low',
        tierRequired: SubscriptionPlan.BASIC,
        order: 3,
      },
      {
        name: 'gpt-4o',
        displayName: 'GPT-4o',
        description: 'Omnimodal model with vision and audio capabilities',
        capabilities: ['chat', 'completion', 'function-calling', 'vision', 'audio'],
        contextWindow: 128000,
        maxOutput: 16384,
        latencyHint: 'medium',
        costEstimate: 'high',
        tierRequired: SubscriptionPlan.ENTERPRISE,
        order: 0,
      },
    ],
  },
  {
    companyName: 'Anthropic',
    logoUrl: 'https://www.anthropic.com/favicon.ico',
    website: 'https://www.anthropic.com',
    models: [
      {
        name: 'claude-3-opus',
        displayName: 'Claude 3 Opus',
        description: 'Most capable Claude model for complex tasks',
        capabilities: ['chat', 'completion', 'vision'],
        contextWindow: 200000,
        maxOutput: 4096,
        latencyHint: 'slow',
        costEstimate: 'high',
        tierRequired: SubscriptionPlan.ENTERPRISE,
        order: 1,
      },
      {
        name: 'claude-3-sonnet',
        displayName: 'Claude 3 Sonnet',
        description: 'Balanced performance and speed',
        capabilities: ['chat', 'completion', 'vision'],
        contextWindow: 200000,
        maxOutput: 4096,
        latencyHint: 'medium',
        costEstimate: 'medium',
        tierRequired: SubscriptionPlan.PRO,
        order: 2,
      },
      {
        name: 'claude-3-haiku',
        displayName: 'Claude 3 Haiku',
        description: 'Fastest Claude model for simple tasks',
        capabilities: ['chat', 'completion', 'vision'],
        contextWindow: 200000,
        maxOutput: 4096,
        latencyHint: 'fast',
        costEstimate: 'low',
        tierRequired: SubscriptionPlan.BASIC,
        order: 3,
      },
      {
        name: 'claude-3.5-sonnet',
        displayName: 'Claude 3.5 Sonnet',
        description: 'Latest Claude model with enhanced capabilities',
        capabilities: ['chat', 'completion', 'vision', 'coding'],
        contextWindow: 200000,
        maxOutput: 8192,
        latencyHint: 'medium',
        costEstimate: 'medium',
        tierRequired: SubscriptionPlan.PRO,
        order: 0,
      },
    ],
  },
  {
    companyName: 'xAI',
    logoUrl: 'https://x.ai/favicon.ico',
    website: 'https://x.ai',
    models: [
      {
        name: 'grok-2',
        displayName: 'Grok 2',
        description: 'Latest Grok model with enhanced reasoning',
        capabilities: ['chat', 'completion', 'real-time-info'],
        contextWindow: 131072,
        maxOutput: 4096,
        latencyHint: 'medium',
        costEstimate: 'medium',
        tierRequired: SubscriptionPlan.PRO,
        order: 1,
      },
      {
        name: 'grok-2-mini',
        displayName: 'Grok 2 Mini',
        description: 'Faster and more efficient Grok model',
        capabilities: ['chat', 'completion', 'real-time-info'],
        contextWindow: 131072,
        maxOutput: 4096,
        latencyHint: 'fast',
        costEstimate: 'low',
        tierRequired: SubscriptionPlan.BASIC,
        order: 2,
      },
    ],
  },
  {
    companyName: 'Google',
    logoUrl: 'https://www.google.com/favicon.ico',
    website: 'https://ai.google.dev',
    models: [
      {
        name: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        description: 'Advanced multimodal model with 2M token context',
        capabilities: ['chat', 'completion', 'vision', 'audio', 'video'],
        contextWindow: 2097152,
        maxOutput: 8192,
        latencyHint: 'medium',
        costEstimate: 'high',
        tierRequired: SubscriptionPlan.ENTERPRISE,
        order: 1,
      },
      {
        name: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        description: 'Fast and efficient multimodal model',
        capabilities: ['chat', 'completion', 'vision', 'audio'],
        contextWindow: 1048576,
        maxOutput: 8192,
        latencyHint: 'fast',
        costEstimate: 'low',
        tierRequired: SubscriptionPlan.PRO,
        order: 2,
      },
    ],
  },
  {
    companyName: 'Meta',
    logoUrl: 'https://www.meta.com/favicon.ico',
    website: 'https://llama.meta.com',
    models: [
      {
        name: 'llama-3.1-405b',
        displayName: 'Llama 3.1 405B',
        description: 'Largest open-source LLM from Meta',
        capabilities: ['chat', 'completion', 'function-calling'],
        contextWindow: 128000,
        maxOutput: 4096,
        latencyHint: 'slow',
        costEstimate: 'high',
        tierRequired: SubscriptionPlan.ENTERPRISE,
        order: 1,
      },
      {
        name: 'llama-3.1-70b',
        displayName: 'Llama 3.1 70B',
        description: 'Balanced Llama model for most tasks',
        capabilities: ['chat', 'completion', 'function-calling'],
        contextWindow: 128000,
        maxOutput: 4096,
        latencyHint: 'medium',
        costEstimate: 'medium',
        tierRequired: SubscriptionPlan.PRO,
        order: 2,
      },
      {
        name: 'llama-3.1-8b',
        displayName: 'Llama 3.1 8B',
        description: 'Fast and efficient Llama model',
        capabilities: ['chat', 'completion'],
        contextWindow: 128000,
        maxOutput: 4096,
        latencyHint: 'fast',
        costEstimate: 'low',
        tierRequired: SubscriptionPlan.BASIC,
        order: 3,
      },
    ],
  },
  {
    companyName: 'Mistral AI',
    logoUrl: 'https://mistral.ai/favicon.ico',
    website: 'https://mistral.ai',
    models: [
      {
        name: 'mistral-large',
        displayName: 'Mistral Large',
        description: 'Flagship model with strong reasoning capabilities',
        capabilities: ['chat', 'completion', 'function-calling'],
        contextWindow: 128000,
        maxOutput: 4096,
        latencyHint: 'medium',
        costEstimate: 'high',
        tierRequired: SubscriptionPlan.PRO,
        order: 1,
      },
      {
        name: 'mistral-small',
        displayName: 'Mistral Small',
        description: 'Efficient model for cost-effective tasks',
        capabilities: ['chat', 'completion'],
        contextWindow: 32000,
        maxOutput: 4096,
        latencyHint: 'fast',
        costEstimate: 'low',
        tierRequired: SubscriptionPlan.BASIC,
        order: 2,
      },
    ],
  },
  {
    companyName: 'Cohere',
    logoUrl: 'https://cohere.com/favicon.ico',
    website: 'https://cohere.com',
    models: [
      {
        name: 'command-r-plus',
        displayName: 'Command R+',
        description: 'Advanced model optimized for RAG and tool use',
        capabilities: ['chat', 'completion', 'function-calling', 'rag'],
        contextWindow: 128000,
        maxOutput: 4096,
        latencyHint: 'medium',
        costEstimate: 'medium',
        tierRequired: SubscriptionPlan.PRO,
        order: 1,
      },
      {
        name: 'command-r',
        displayName: 'Command R',
        description: 'Efficient model for enterprise use cases',
        capabilities: ['chat', 'completion', 'function-calling', 'rag'],
        contextWindow: 128000,
        maxOutput: 4096,
        latencyHint: 'fast',
        costEstimate: 'low',
        tierRequired: SubscriptionPlan.BASIC,
        order: 2,
      },
    ],
  },
];

async function seedModelCatalog() {
  console.log('🌱 Seeding model catalog...');

  let companiesCreated = 0;
  let modelsCreated = 0;
  let companiesUpdated = 0;
  let modelsUpdated = 0;

  for (const entry of modelCatalog) {
    try {
      // Find or create company
      let company = await prisma.company.findFirst({
        where: { name: entry.companyName },
      });

      if (!company) {
        company = await prisma.company.create({
          data: {
            name: entry.companyName,
            logoUrl: entry.logoUrl,
            website: entry.website,
            isActive: true,
          },
        });
        companiesCreated++;
        console.log(`✅ Created company: ${entry.companyName}`);
      } else {
        // Update company if needed
        company = await prisma.company.update({
          where: { id: company.id },
          data: {
            logoUrl: entry.logoUrl,
            website: entry.website,
          },
        });
        companiesUpdated++;
        console.log(`🔄 Updated company: ${entry.companyName}`);
      }

      // Create or update models
      for (const modelData of entry.models) {
        try {
          const existingModel = await prisma.model.findFirst({
            where: {
              companyId: company.id,
              name: modelData.name,
            },
          });

          if (!existingModel) {
            await prisma.model.create({
              data: {
                companyId: company.id,
                name: modelData.name,
                displayName: modelData.displayName,
                description: modelData.description,
                capabilities: modelData.capabilities,
                contextWindow: modelData.contextWindow,
                maxOutput: modelData.maxOutput,
                latencyHint: modelData.latencyHint,
                costEstimate: modelData.costEstimate,
                tierRequired: modelData.tierRequired,
                isActive: true,
                order: modelData.order,
              },
            });
            modelsCreated++;
            console.log(`  ✅ Created model: ${modelData.displayName}`);
          } else {
            await prisma.model.update({
              where: { id: existingModel.id },
              data: {
                displayName: modelData.displayName,
                description: modelData.description,
                capabilities: modelData.capabilities,
                contextWindow: modelData.contextWindow,
                maxOutput: modelData.maxOutput,
                latencyHint: modelData.latencyHint,
                costEstimate: modelData.costEstimate,
                tierRequired: modelData.tierRequired,
                order: modelData.order,
              },
            });
            modelsUpdated++;
            console.log(`  🔄 Updated model: ${modelData.displayName}`);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          console.error(`  ❌ Error with model ${modelData.name}:`, message);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error with company ${entry.companyName}:`, message);
    }
  }

  console.log('\n📊 Seed Summary:');
  console.log(`  Companies created: ${companiesCreated}`);
  console.log(`  Companies updated: ${companiesUpdated}`);
  console.log(`  Models created: ${modelsCreated}`);
  console.log(`  Models updated: ${modelsUpdated}`);
  console.log('✅ Model catalog seeding completed!');
}

seedModelCatalog()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
