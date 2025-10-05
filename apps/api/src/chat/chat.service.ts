import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChatCacheService } from './chat-cache.service';
import { OpenAIAdapter } from './adapters/openai.adapter';
import { AnthropicAdapter } from './adapters/anthropic.adapter';
import { XAIAdapter } from './adapters/xai.adapter';
import { SubscriptionPlan } from '@prisma/client';
import { SlashCommandParser, isSlashCommand, type ParsedCommand } from '../utils/slash-command-parser';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';
import { MetricsService } from '../common/metrics/metrics.service';

/**
 * Model access configuration based on subscription plans
 */
const MODEL_ACCESS_MATRIX: Record<SubscriptionPlan, string[]> = {
  BASIC: [
    'gpt-3.5-turbo', // OpenAI
    'claude-3-haiku', // Anthropic
  ],
  PRO: [
    'gpt-3.5-turbo',
    'gpt-4',
    'gpt-3.5-turbo-16k',
    'claude-3-haiku',
    'claude-3-sonnet',
    'claude-2.1',
    'grok-beta', // xAI
  ],
  ENTERPRISE: [
    // Full access to all models
    'gpt-3.5-turbo',
    'gpt-4',
    'gpt-4-turbo',
    'gpt-3.5-turbo-16k',
    'claude-3-haiku',
    'claude-3-sonnet',
    'claude-3-opus',
    'claude-2.1',
    'grok-beta', // xAI
    'grok-2', // xAI
  ],
};

/**
 * ChatService - Handles AI chat with subscription-based model access control
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private chatCache: ChatCacheService,
    private openaiAdapter: OpenAIAdapter,
    private anthropicAdapter: AnthropicAdapter,
    private xaiAdapter: XAIAdapter,
    private projectsService: ProjectsService,
    private tasksService: TasksService,
    private metricsService: MetricsService,
  ) {}

  /**
   * Get available models based on user subscription
   */
  async getAvailableModels(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Default to BASIC if no active subscription
    const plan =
      user.subscription?.status === 'active'
        ? user.subscription.plan
        : SubscriptionPlan.BASIC;

    const allowedModelIds = MODEL_ACCESS_MATRIX[plan];

    // Get all models from database and filter by allowed IDs
    const allModels = await this.prisma.model.findMany({
      include: {
        company: {
          select: {
            name: true,
            logoUrl: true,
          },
        },
      },
    });

    const availableModels = allModels.filter((model) =>
      allowedModelIds.includes(model.id),
    );

    return {
      models: availableModels.map((model) => ({
        id: model.id,
        name: model.name,
        company: model.company.name,
        description: model.description,
        capabilities: model.capabilities,
        latencyHint: model.latencyHint,
        costEstimate: model.costEstimate,
      })),
      userPlan: plan,
      subscriptionStatus: user.subscription?.status || 'none',
    };
  }

  /**
   * Check if user can access a specific model
   */
  async checkModelAccess(
    userId: string,
    modelId: string,
  ): Promise<{ allowed: boolean; plan: SubscriptionPlan; reason?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return { allowed: false, plan: SubscriptionPlan.BASIC, reason: 'User not found' };
    }

    const plan =
      user.subscription?.status === 'active'
        ? user.subscription.plan
        : SubscriptionPlan.BASIC;

    const allowedModelIds = MODEL_ACCESS_MATRIX[plan];
    const allowed = allowedModelIds.includes(modelId);

    if (!allowed) {
      return {
        allowed: false,
        plan,
        reason: `Model ${modelId} requires a higher subscription tier. Current plan: ${plan}`,
      };
    }

    return { allowed: true, plan };
  }

  /**
   * Handle slash command execution
   * Returns command result without AI streaming
   */
  async handleSlashCommand(data: {
    userId: string;
    command: string;
    projectId?: string;
    taskId?: string;
  }): Promise<{ success: boolean; message: string; data?: any; error?: string }> {
    this.logger.log(`User ${data.userId} executing slash command: ${data.command}`);

    try {
      // Parse the slash command
      const parsed = SlashCommandParser.parse(data.command);

      // Route to appropriate service
      switch (parsed.action) {
        case 'task.create':
          return await this.tasksService.createFromSlashCommand({
            title: parsed.data.title,
            due: parsed.data.due,
            project: parsed.data.project,
            priority: parsed.data.priority,
            assignee: parsed.data.assignee,
            userId: data.userId,
          });

        case 'task.complete':
          return await this.tasksService.completeFromSlashCommand({
            id: parsed.data.id,
            userId: data.userId,
          });

        case 'task.delete':
          return await this.tasksService.deleteFromSlashCommand({
            id: parsed.data.id,
            userId: data.userId,
          });

        case 'project.create':
          return await this.projectsService.createFromSlashCommand({
            name: parsed.data.name,
            description: parsed.data.description,
            ownerId: data.userId,
          });

        case 'project.invite':
          return await this.projectsService.inviteFromSlashCommand({
            email: parsed.data.email,
            project: parsed.data.project,
            role: parsed.data.role,
            inviterId: data.userId,
          });

        case 'help':
          return this.getSlashCommandHelp(parsed.data.command);

        default:
          return {
            success: false,
            message: `Unknown command action: ${parsed.action}`,
            error: 'UNKNOWN_COMMAND',
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Slash command error: ${errorMessage}`);

      return {
        success: false,
        message: errorMessage,
        error: 'COMMAND_EXECUTION_ERROR',
      };
    }
  }

  /**
   * Get help information for slash commands
   */
  private getSlashCommandHelp(command?: string): {
    success: boolean;
    message: string;
    data: any;
  } {
    const commands = [
      {
        command: '/task create',
        description: 'Create a new task',
        example: '/task create title:"Fix bug" due:2025-10-15 project:"My Project" priority:high assignee:dev@example.com',
        params: [
          { name: 'title', required: true, description: 'Task title' },
          { name: 'due', required: false, description: 'Due date (YYYY-MM-DD)' },
          { name: 'project', required: false, description: 'Project name (partial match)' },
          { name: 'priority', required: false, description: 'Priority: low, medium, high' },
          { name: 'assignee', required: false, description: 'Assignee email' },
        ],
      },
      {
        command: '/task complete',
        description: 'Mark a task as complete',
        example: '/task complete id:task_abc123',
        params: [
          { name: 'id', required: true, description: 'Task ID' },
        ],
      },
      {
        command: '/task delete',
        description: 'Delete a task',
        example: '/task delete id:task_abc123',
        params: [
          { name: 'id', required: true, description: 'Task ID' },
        ],
      },
      {
        command: '/project create',
        description: 'Create a new project',
        example: '/project create name:"Website Redesign" description:"Q4 2025 project"',
        params: [
          { name: 'name', required: true, description: 'Project name' },
          { name: 'description', required: false, description: 'Project description' },
        ],
      },
      {
        command: '/project invite',
        description: 'Invite a user to a project',
        example: '/project invite email:user@example.com project:"Website Redesign" role:member',
        params: [
          { name: 'email', required: true, description: 'User email' },
          { name: 'project', required: true, description: 'Project name (partial match)' },
          { name: 'role', required: false, description: 'Role: admin, member, viewer' },
        ],
      },
      {
        command: '/help',
        description: 'Show available commands',
        example: '/help',
        params: [],
      },
    ];

    if (command) {
      const found = commands.find((c) => c.command.includes(command));
      if (found) {
        return {
          success: true,
          message: 'Command help',
          data: found,
        };
      }
    }

    return {
      success: true,
      message: 'Available slash commands',
      data: { commands },
    };
  }

  /**
   * Create a chat session
   * Called by POST /chat/start
   */
  async createChatSession(data: {
    userId: string;
    modelId: string;
    chatId?: string;
    projectId?: string;
    taskId?: string;
    prompt: string;
  }) {
    this.logger.log(`Creating chat session for user ${data.userId}`);

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check model access
    const accessCheck = await this.checkModelAccess(data.userId, data.modelId);
    if (!accessCheck.allowed) {
      throw new ForbiddenException(accessCheck.reason);
    }

    // Create session (expires in 10 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const session = await this.prisma.chatSession.create({
      data: {
        userId: data.userId,
        modelId: data.modelId,
        chatId: data.chatId,
        projectId: data.projectId,
        taskId: data.taskId,
        expiresAt,
      },
    });

    // Save user message immediately
    await this.prisma.message.create({
      data: {
        userId: data.userId,
        content: data.prompt,
        modelId: data.modelId,
        projectId: data.projectId,
        taskId: data.taskId,
      },
    });

    this.logger.log(`Chat session created: ${session.id}`);

    return session;
  }

  /**
   * Stream AI response for a chat session
   * Called by GET /chat/stream?sessionId=xxx (SSE endpoint)
   * Returns an async generator that yields SSE events
   */
  async *streamChatResponse(
    sessionId: string,
    userId: string,
  ): AsyncGenerator<{ type: string; content?: string; message?: string }, void, unknown> {
    this.logger.log(`Streaming response for session ${sessionId}`);

    // 1. Fetch and validate session
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      yield {
        type: 'error',
        message: 'Session not found',
      };
      return;
    }

    // 2. Verify user owns the session
    if (session.userId !== userId) {
      yield {
        type: 'error',
        message: 'Access denied: You do not own this session',
      };
      return;
    }

    // 3. Check if session expired
    if (session.expiresAt < new Date()) {
      yield {
        type: 'error',
        message: 'Session expired. Please start a new chat.',
      };
      return;
    }

    // 4. Get the last user message for this session
    // (We need the prompt that was saved when session was created)
    const userMessage = await this.prisma.message.findFirst({
      where: {
        userId: session.userId,
        modelId: session.modelId,
        ...(session.projectId && { projectId: session.projectId }),
        ...(session.taskId && { taskId: session.taskId }),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!userMessage) {
      yield {
        type: 'error',
        message: 'User message not found',
      };
      return;
    }

    const prompt = userMessage.content;

    // 5. Check if this is a slash command
    if (isSlashCommand(prompt)) {
      this.logger.log(`Detected slash command: ${prompt}`);

      try {
        const result = await this.handleSlashCommand({
          userId: session.userId,
          command: prompt,
          projectId: session.projectId,
          taskId: session.taskId,
        });

        // Save the result as an assistant message
        const responseContent = result.success
          ? `✅ ${result.message}`
          : `❌ ${result.message}`;

        await this.prisma.message.create({
          data: {
            userId: session.userId,
            content: responseContent,
            modelId: session.modelId,
            projectId: session.projectId,
            taskId: session.taskId,
          },
        });

        // Stream the result character by character
        for (const char of responseContent) {
          yield {
            type: 'token',
            content: char,
          };
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        yield {
          type: 'done',
        };

        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Slash command error: ${errorMessage}`);

        yield {
          type: 'error',
          message: `Command failed: ${errorMessage}`,
        };

        return;
      }
    }

    // 6. Verify model exists
    const model = await this.prisma.model.findUnique({
      where: { id: session.modelId },
      include: { company: true },
    });

    if (!model) {
      yield {
        type: 'error',
        message: `Model ${session.modelId} not found`,
      };
      return;
    }

    // 7. Check cache for identical request
    const cachedResponse = await this.chatCache.getCachedResponse(
      session.modelId,
      prompt,
    );

    if (cachedResponse) {
      this.logger.log(`Streaming cached response for session ${sessionId}`);

      // Track cache hit
      this.metricsService.recordCacheHit('chat');

      // Stream cached response character by character
      for (const char of cachedResponse) {
        yield {
          type: 'token',
          content: char,
        };

        // Small delay to simulate natural streaming
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Save assistant message to database
      await this.prisma.message.create({
        data: {
          userId: session.userId,
          content: cachedResponse,
          modelId: session.modelId,
          projectId: session.projectId,
          taskId: session.taskId,
        },
      });

      yield {
        type: 'done',
      };

      return;
    }

    // 8. No cache - stream from AI model
    this.logger.log(`Cache miss - querying AI model ${session.modelId}`);

    // Track cache miss
    this.metricsService.recordCacheMiss('chat');

    // Track AI request start time
    const aiRequestStartTime = Date.now();

    let fullResponse = '';
    let aiRequestSuccess = false;

    try {
      // Route to appropriate adapter based on company
      let adapter: OpenAIAdapter | AnthropicAdapter | XAIAdapter;

      if (model.company.name.toLowerCase() === 'openai') {
        adapter = this.openaiAdapter;
      } else if (model.company.name.toLowerCase() === 'anthropic') {
        adapter = this.anthropicAdapter;
      } else if (model.company.name.toLowerCase() === 'xai') {
        adapter = this.xaiAdapter;
      } else {
        // Default to OpenAI for stub
        adapter = this.openaiAdapter;
      }

      // Stream response chunks as SSE events: { type: "token", content: "text" }
      for await (const chunk of adapter.streamChatCompletion(
        session.modelId,
        prompt,
      )) {
        fullResponse += chunk;
        yield {
          type: 'token',
          content: chunk,
        };
      }

      // 9. Cache the complete response
      await this.chatCache.setCachedResponse(
        session.modelId,
        prompt,
        fullResponse,
      );

      // 10. Save AI response to database (persist full assistant message)
      await this.prisma.message.create({
        data: {
          userId: session.userId,
          content: fullResponse,
          modelId: session.modelId,
          projectId: session.projectId,
          taskId: session.taskId,
        },
      });

      aiRequestSuccess = true;

      // 11. Send "done" event
      yield {
        type: 'done',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error streaming response: ${errorMessage}`,
        errorStack,
      );
      
      yield {
        type: 'error',
        message: 'Failed to generate response',
      };
    } finally {
      // Record AI model metrics
      const duration = (Date.now() - aiRequestStartTime) / 1000; // Convert to seconds
      this.metricsService.recordAiModelRequest(
        session.modelId,
        model.company.name,
        aiRequestSuccess ? 'success' : 'error',
        duration,
      );
    }
  }

  /**
   * Get chat history for a user
   * If chatId is provided, returns all messages for that conversation
   * Otherwise returns recent messages (filtered by projectId/taskId if provided)
   */
  async getChatHistory(data: {
    userId: string;
    chatId?: string;
    projectId?: string;
    taskId?: string;
    limit?: number;
  }) {
    const { userId, chatId, projectId, taskId, limit = 50 } = data;

    // If chatId is provided, get all sessions for this chat and find related messages
    let messages;

    if (chatId) {
      // Get all sessions for this chatId
      const sessions = await this.prisma.chatSession.findMany({
        where: {
          chatId,
          userId, // Ensure user owns the chat
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (sessions.length === 0) {
        // No sessions found, return empty
        return { chatId, messages: [] };
      }

      // Get messages created after the first session started
      const firstSessionTime = sessions[0].createdAt;

      messages = await this.prisma.message.findMany({
        where: {
          userId,
          createdAt: {
            gte: firstSessionTime,
          },
        },
        take: limit,
        orderBy: {
          createdAt: 'asc',
        },
        include: {
          model: {
            include: {
              company: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          messageAttachments: true,
        },
      });

      return { chatId, messages };
    }

    // No chatId - return recent messages (filtered by projectId/taskId)
    messages = await this.prisma.message.findMany({
      where: {
        userId,
        ...(projectId && { projectId }),
        ...(taskId && { taskId }),
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        model: {
          include: {
            company: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        messageAttachments: true,
      },
    });

    return { messages: messages.reverse() }; // Reverse to show oldest first
  }

  /**
   * Get single message by ID
   */
  async getMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        userId, // Ensure user owns the message
      },
      include: {
        model: {
          include: {
            company: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        messageAttachments: true,
        project: true,
        task: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found or access denied');
    }

    return message;
  }
}
