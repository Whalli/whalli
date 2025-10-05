import { z } from 'zod';

/**
 * Slash Command Parser Utility
 * Parses slash commands and validates them with Zod schemas
 */

// ============================================================================
// Zod Schemas for Command Validation
// ============================================================================

export const TaskCreateSchema = z.object({
  action: z.literal('task.create'),
  data: z.object({
    title: z.string().min(1, 'Title is required'),
    due: z.string().optional().refine(
      (val) => !val || !isNaN(Date.parse(val)),
      'Invalid date format'
    ),
    project: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    assignee: z.string().email().optional(),
  }),
});

export const TaskCompleteSchema = z.object({
  action: z.literal('task.complete'),
  data: z.object({
    id: z.string().min(1, 'Task ID is required'),
  }),
});

export const TaskDeleteSchema = z.object({
  action: z.literal('task.delete'),
  data: z.object({
    id: z.string().min(1, 'Task ID is required'),
  }),
});

export const ProjectInviteSchema = z.object({
  action: z.literal('project.invite'),
  data: z.object({
    email: z.string().email('Invalid email address'),
    project: z.string().min(1, 'Project name is required'),
    role: z.enum(['admin', 'member', 'viewer']).optional().default('member'),
  }),
});

export const ProjectCreateSchema = z.object({
  action: z.literal('project.create'),
  data: z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
  }),
});

export const MessageSendSchema = z.object({
  action: z.literal('message.send'),
  data: z.object({
    to: z.string().email('Invalid recipient email'),
    content: z.string().min(1, 'Message content is required'),
    urgent: z.boolean().optional().default(false),
  }),
});

export const HelpSchema = z.object({
  action: z.literal('help'),
  data: z.object({
    command: z.string().optional(),
  }),
});

// Union type for all command schemas
export type ParsedCommand =
  | z.infer<typeof TaskCreateSchema>
  | z.infer<typeof TaskCompleteSchema>
  | z.infer<typeof TaskDeleteSchema>
  | z.infer<typeof ProjectInviteSchema>
  | z.infer<typeof ProjectCreateSchema>
  | z.infer<typeof MessageSendSchema>
  | z.infer<typeof HelpSchema>;

// ============================================================================
// Parser Implementation
// ============================================================================

export class SlashCommandParser {
  /**
   * Parse a slash command string into a structured object
   */
  static parse(command: string): ParsedCommand {
    // Trim whitespace
    const trimmed = command.trim();

    // Must start with /
    if (!trimmed.startsWith('/')) {
      throw new Error('Command must start with /');
    }

    // Extract command parts: /category action param:value param:value
    const parts = trimmed.slice(1).split(/\s+/);
    
    if (parts.length === 0) {
      throw new Error('Invalid command format');
    }

    // Handle single-word commands like /help
    if (parts.length === 1) {
      const [command] = parts;
      if (command === '') {
        throw new Error('Invalid command format');
      }
      if (command === 'help') {
        return this.parseHelp('');
      }
      throw new Error(`Unknown command: /${command}`);
    }

    const [category, action, ...params] = parts;

    // Parse parameters into key-value object
    const parsedParams = this.parseParameters(params.join(' '));

    // Route to appropriate parser based on category and action
    const commandKey = `${category}.${action}`;

    switch (commandKey) {
      case 'task.create':
        return this.parseTaskCreate(parsedParams);
      
      case 'task.complete':
        return this.parseTaskComplete(parsedParams);
      
      case 'task.delete':
        return this.parseTaskDelete(parsedParams);
      
      case 'project.invite':
        return this.parseProjectInvite(parsedParams);
      
      case 'project.create':
        return this.parseProjectCreate(parsedParams);
      
      case 'message.send':
        return this.parseMessageSend(parsedParams);
      
      default:
        throw new Error(`Unknown command: /${commandKey}`);
    }
  }

  /**
   * Parse parameters from command string
   * Supports: key:value and key:"value with spaces"
   */
  private static parseParameters(paramString: string): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Regex to match key:value or key:"value with spaces"
    const regex = /(\w+):((?:"[^"]*")|(?:[^\s]+))/g;
    let match;

    while ((match = regex.exec(paramString)) !== null) {
      const key = match[1];
      let value = match[2];

      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      // Convert boolean strings
      if (value === 'true') params[key] = true;
      else if (value === 'false') params[key] = false;
      else params[key] = value;
    }

    return params;
  }

  /**
   * Parse /task create command
   */
  private static parseTaskCreate(params: Record<string, any>): z.infer<typeof TaskCreateSchema> {
    const result = TaskCreateSchema.safeParse({
      action: 'task.create',
      data: params,
    });

    if (!result.success) {
      const firstError = result.error.errors[0];
      throw new Error(`Invalid task create command: ${firstError.message}`);
    }

    return result.data;
  }

  /**
   * Parse /task complete command
   */
  private static parseTaskComplete(params: Record<string, any>): z.infer<typeof TaskCompleteSchema> {
    const result = TaskCompleteSchema.safeParse({
      action: 'task.complete',
      data: params,
    });

    if (!result.success) {
      const firstError = result.error.errors[0];
      throw new Error(`Invalid task complete command: ${firstError.message}`);
    }

    return result.data;
  }

  /**
   * Parse /task delete command
   */
  private static parseTaskDelete(params: Record<string, any>): z.infer<typeof TaskDeleteSchema> {
    const result = TaskDeleteSchema.safeParse({
      action: 'task.delete',
      data: params,
    });

    if (!result.success) {
      throw new Error(`Invalid task delete command: ${result.error.errors[0].message}`);
    }

    return result.data;
  }

  /**
   * Parse /project invite command
   */
  private static parseProjectInvite(params: Record<string, any>): z.infer<typeof ProjectInviteSchema> {
    const result = ProjectInviteSchema.safeParse({
      action: 'project.invite',
      data: params,
    });

    if (!result.success) {
      const firstError = result.error.errors[0];
      throw new Error(`Invalid project invite command: ${firstError.message}`);
    }

    return result.data;
  }

  /**
   * Parse /project create command
   */
  private static parseProjectCreate(params: Record<string, any>): z.infer<typeof ProjectCreateSchema> {
    const result = ProjectCreateSchema.safeParse({
      action: 'project.create',
      data: params,
    });

    if (!result.success) {
      const firstError = result.error.errors[0];
      throw new Error(`Invalid project create command: ${firstError.message}`);
    }

    return result.data;
  }

  /**
   * Parse /message send command
   */
  private static parseMessageSend(params: Record<string, any>): z.infer<typeof MessageSendSchema> {
    const result = MessageSendSchema.safeParse({
      action: 'message.send',
      data: params,
    });

    if (!result.success) {
      const firstError = result.error.errors[0];
      throw new Error(`Invalid message send command: ${firstError.message}`);
    }

    return result.data;
  }

  /**
   * Parse /help command
   */
  private static parseHelp(command: string): z.infer<typeof HelpSchema> {
    return {
      action: 'help',
      data: {
        command: command || undefined,
      },
    };
  }

  /**
   * Get available commands (for help text)
   */
  static getAvailableCommands(): string[] {
    return [
      '/task create title:"Task name" due:2025-10-10 project:"Project name" priority:high assignee:user@example.com',
      '/task complete id:123',
      '/task delete id:123',
      '/project invite email:user@example.com project:"Project name" role:admin',
      '/project create name:"Project name" description:"Project description"',
      '/message send to:user@example.com content:"Hello world" urgent:true',
      '/help',
    ];
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate if a string is a valid slash command
 */
export function isSlashCommand(text: string): boolean {
  return text.trim().startsWith('/');
}

/**
 * Extract slash command from a message that may contain other text
 */
export function extractSlashCommand(text: string): string | null {
  const match = text.match(/^\/\S+(?:\s+\S+)*/);
  return match ? match[0] : null;
}
