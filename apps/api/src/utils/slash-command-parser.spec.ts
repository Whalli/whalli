import { SlashCommandParser, isSlashCommand, extractSlashCommand } from './slash-command-parser';

describe('SlashCommandParser', () => {
  // ============================================================================
  // Task Commands Tests
  // ============================================================================

  describe('Task Commands', () => {
    it('should parse /task create with all parameters', () => {
      const command = '/task create title:"Buy milk" due:2025-10-10 project:"groceries" priority:high assignee:john@example.com';
      const result = SlashCommandParser.parse(command);

      expect(result).toEqual({
        action: 'task.create',
        data: {
          title: 'Buy milk',
          due: '2025-10-10',
          project: 'groceries',
          priority: 'high',
          assignee: 'john@example.com',
        },
      });
    });

    it('should parse /task create with minimal parameters', () => {
      const command = '/task create title:"Buy milk"';
      const result = SlashCommandParser.parse(command);

      expect(result).toEqual({
        action: 'task.create',
        data: {
          title: 'Buy milk',
        },
      });
    });

    it('should parse /task create with title without quotes', () => {
      const command = '/task create title:BuyMilk project:groceries';
      const result = SlashCommandParser.parse(command);

      expect(result).toEqual({
        action: 'task.create',
        data: {
          title: 'BuyMilk',
          project: 'groceries',
        },
      });
    });

    it('should parse /task complete command', () => {
      const command = '/task complete id:123';
      const result = SlashCommandParser.parse(command);

      expect(result).toEqual({
        action: 'task.complete',
        data: {
          id: '123',
        },
      });
    });

    it('should parse /task delete command', () => {
      const command = '/task delete id:cm1234567890';
      const result = SlashCommandParser.parse(command);

      expect(result).toEqual({
        action: 'task.delete',
        data: {
          id: 'cm1234567890',
        },
      });
    });

    it('should fail to parse task create without title', () => {
      const command = '/task create due:2025-10-10';
      
      expect(() => SlashCommandParser.parse(command)).toThrow();
    });

    it('should fail to parse task complete without id', () => {
      const command = '/task complete';
      
      expect(() => SlashCommandParser.parse(command)).toThrow();
    });

    it('should fail to parse task create with invalid date', () => {
      const command = '/task create title:"Buy milk" due:invalid-date';
      
      expect(() => SlashCommandParser.parse(command)).toThrow('Invalid date format');
    });

    it('should fail to parse task create with invalid priority', () => {
      const command = '/task create title:"Buy milk" priority:urgent';
      
      expect(() => SlashCommandParser.parse(command)).toThrow();
    });

    it('should fail to parse task create with invalid email', () => {
      const command = '/task create title:"Buy milk" assignee:not-an-email';
      
      expect(() => SlashCommandParser.parse(command)).toThrow();
    });
  });

  // ============================================================================
  // Project Commands Tests
  // ============================================================================

  describe('Project Commands', () => {
    it('should parse /project invite with all parameters', () => {
      const command = '/project invite email:user@example.com project:"groceries" role:admin';
      const result = SlashCommandParser.parse(command);

      expect(result).toEqual({
        action: 'project.invite',
        data: {
          email: 'user@example.com',
          project: 'groceries',
          role: 'admin',
        },
      });
    });

    it('should parse /project invite with default role', () => {
      const command = '/project invite email:user@example.com project:"groceries"';
      const result = SlashCommandParser.parse(command);

      expect(result).toEqual({
        action: 'project.invite',
        data: {
          email: 'user@example.com',
          project: 'groceries',
          role: 'member',
        },
      });
    });

    it('should parse /project create with all parameters', () => {
      const command = '/project create name:"My Project" description:"A great project"';
      const result = SlashCommandParser.parse(command);

      expect(result).toEqual({
        action: 'project.create',
        data: {
          name: 'My Project',
          description: 'A great project',
        },
      });
    });

    it('should parse /project create with minimal parameters', () => {
      const command = '/project create name:"My Project"';
      const result = SlashCommandParser.parse(command);

      expect(result).toEqual({
        action: 'project.create',
        data: {
          name: 'My Project',
        },
      });
    });

    it('should fail to parse project invite with invalid email', () => {
      const command = '/project invite email:invalid-email project:"groceries"';
      
      expect(() => SlashCommandParser.parse(command)).toThrow('Invalid email address');
    });

    it('should fail to parse project invite without email', () => {
      const command = '/project invite project:"groceries"';
      
      expect(() => SlashCommandParser.parse(command)).toThrow();
    });

    it('should fail to parse project invite without project', () => {
      const command = '/project invite email:user@example.com';
      
      expect(() => SlashCommandParser.parse(command)).toThrow();
    });

    it('should fail to parse project create without name', () => {
      const command = '/project create description:"A project"';
      
      expect(() => SlashCommandParser.parse(command)).toThrow();
    });

    it('should fail to parse project invite with invalid role', () => {
      const command = '/project invite email:user@example.com project:"groceries" role:owner';
      
      expect(() => SlashCommandParser.parse(command)).toThrow();
    });
  });

  // ============================================================================
  // Message Commands Tests
  // ============================================================================

  describe('Message Commands', () => {
    it('should parse /message send with all parameters', () => {
      const command = '/message send to:user@example.com content:"Hello world" urgent:true';
      const result = SlashCommandParser.parse(command);

      expect(result).toEqual({
        action: 'message.send',
        data: {
          to: 'user@example.com',
          content: 'Hello world',
          urgent: true,
        },
      });
    });

    it('should parse /message send with default urgent flag', () => {
      const command = '/message send to:user@example.com content:"Hello"';
      const result = SlashCommandParser.parse(command);

      expect(result).toEqual({
        action: 'message.send',
        data: {
          to: 'user@example.com',
          content: 'Hello',
          urgent: false,
        },
      });
    });

    it('should parse /message send with long content', () => {
      const command = '/message send to:user@example.com content:"This is a very long message with multiple words and punctuation!"';
      const result = SlashCommandParser.parse(command);

      expect(result.action).toBe('message.send');
      if (result.action === 'message.send') {
        expect(result.data.content).toBe('This is a very long message with multiple words and punctuation!');
      }
    });

    it('should fail to parse message send with invalid email', () => {
      const command = '/message send to:invalid content:"Hello"';
      
      expect(() => SlashCommandParser.parse(command)).toThrow('Invalid recipient email');
    });

    it('should fail to parse message send without content', () => {
      const command = '/message send to:user@example.com';
      
      expect(() => SlashCommandParser.parse(command)).toThrow();
    });
  });

  // ============================================================================
  // Help Command Tests
  // ============================================================================

  describe('Help Command', () => {
    it('should parse /help command', () => {
      const command = '/help';
      const result = SlashCommandParser.parse(command);

      expect(result).toEqual({
        action: 'help',
        data: {},
      });
    });
  });

  // ============================================================================
  // Error Cases Tests
  // ============================================================================

  describe('Error Cases', () => {
    it('should throw error for command without leading slash', () => {
      const command = 'task create title:"Buy milk"';
      
      expect(() => SlashCommandParser.parse(command)).toThrow('Command must start with /');
    });

    it('should throw error for unknown command category', () => {
      const command = '/unknown action param:value';
      
      expect(() => SlashCommandParser.parse(command)).toThrow('Unknown command: /unknown.action');
    });

    it('should throw error for unknown command action', () => {
      const command = '/task unknown id:123';
      
      expect(() => SlashCommandParser.parse(command)).toThrow('Unknown command: /task.unknown');
    });

    it('should throw error for empty command', () => {
      const command = '/';
      
      expect(() => SlashCommandParser.parse(command)).toThrow('Invalid command format');
    });

    it('should handle extra whitespace', () => {
      const command = '  /task   create   title:"Buy milk"  ';
      const result = SlashCommandParser.parse(command);

      expect(result.action).toBe('task.create');
      if (result.action === 'task.create') {
        expect(result.data.title).toBe('Buy milk');
      }
    });
  });

  // ============================================================================
  // Complex Scenarios Tests
  // ============================================================================

  describe('Complex Scenarios', () => {
    it('should parse command with special characters in quoted values', () => {
      const command = '/task create title:"Buy milk & eggs!" project:"Shopping @ Store #1"';
      const result = SlashCommandParser.parse(command);

      expect(result.action).toBe('task.create');
      if (result.action === 'task.create') {
        expect(result.data.title).toBe('Buy milk & eggs!');
        expect(result.data.project).toBe('Shopping @ Store #1');
      }
    });

    it('should parse command with numeric values', () => {
      const command = '/task complete id:12345';
      const result = SlashCommandParser.parse(command);

      expect(result.action).toBe('task.complete');
      if (result.action === 'task.complete') {
        expect(result.data.id).toBe('12345');
      }
    });

    it('should parse command with date formats', () => {
      const command = '/task create title:"Task" due:2025-10-10';
      const result = SlashCommandParser.parse(command);

      expect(result.action).toBe('task.create');
      if (result.action === 'task.create') {
        expect(result.data.due).toBe('2025-10-10');
      }
    });

    it('should parse command with ISO date format', () => {
      const command = '/task create title:"Task" due:2025-10-10T14:30:00Z';
      const result = SlashCommandParser.parse(command);

      expect(result.action).toBe('task.create');
      if (result.action === 'task.create') {
        expect(result.data.due).toBe('2025-10-10T14:30:00Z');
      }
    });

    it('should parse boolean flags correctly', () => {
      const command = '/message send to:user@example.com content:"Test" urgent:true';
      const result = SlashCommandParser.parse(command);

      expect(result.action).toBe('message.send');
      if (result.action === 'message.send') {
        expect(result.data.urgent).toBe(true);
      }
    });

    it('should parse false boolean flags correctly', () => {
      const command = '/message send to:user@example.com content:"Test" urgent:false';
      const result = SlashCommandParser.parse(command);

      expect(result.action).toBe('message.send');
      if (result.action === 'message.send') {
        expect(result.data.urgent).toBe(false);
      }
    });
  });

  // ============================================================================
  // Helper Functions Tests
  // ============================================================================

  describe('Helper Functions', () => {
    describe('isSlashCommand', () => {
      it('should return true for valid slash commands', () => {
        expect(isSlashCommand('/task create')).toBe(true);
        expect(isSlashCommand('  /task create  ')).toBe(true);
        expect(isSlashCommand('/help')).toBe(true);
      });

      it('should return false for non-slash commands', () => {
        expect(isSlashCommand('task create')).toBe(false);
        expect(isSlashCommand('Hello /task')).toBe(false);
        expect(isSlashCommand('')).toBe(false);
      });
    });

    describe('extractSlashCommand', () => {
      it('should extract slash command from beginning of text', () => {
        expect(extractSlashCommand('/task create title:"Buy milk"')).toBe('/task create title:"Buy milk"');
        expect(extractSlashCommand('/help')).toBe('/help');
      });

      it('should return null for text without slash command', () => {
        expect(extractSlashCommand('Hello world')).toBe(null);
        expect(extractSlashCommand('Use /task create later')).toBe(null);
      });

      it('should extract only the command part', () => {
        expect(extractSlashCommand('/task create')).toBe('/task create');
      });
    });

    describe('getAvailableCommands', () => {
      it('should return list of available commands', () => {
        const commands = SlashCommandParser.getAvailableCommands();
        
        expect(commands).toBeInstanceOf(Array);
        expect(commands.length).toBeGreaterThan(0);
        expect(commands[0]).toContain('/task create');
      });
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle commands with multiple spaces between parameters', () => {
      const command = '/task create  title:"Buy milk"    project:"groceries"';
      const result = SlashCommandParser.parse(command);

      expect(result.action).toBe('task.create');
      if (result.action === 'task.create') {
        expect(result.data.title).toBe('Buy milk');
        expect(result.data.project).toBe('groceries');
      }
    });

    it('should handle empty quoted strings', () => {
      const command = '/project create name:""';
      
      expect(() => SlashCommandParser.parse(command)).toThrow('Project name is required');
    });

    it('should handle parameters in any order', () => {
      const command = '/task create project:"groceries" due:2025-10-10 title:"Buy milk"';
      const result = SlashCommandParser.parse(command);

      expect(result.action).toBe('task.create');
      if (result.action === 'task.create') {
        expect(result.data.title).toBe('Buy milk');
        expect(result.data.project).toBe('groceries');
        expect(result.data.due).toBe('2025-10-10');
      }
    });

    it('should handle single word values without quotes', () => {
      const command = '/task create title:BuyMilk';
      const result = SlashCommandParser.parse(command);

      expect(result.action).toBe('task.create');
      if (result.action === 'task.create') {
        expect(result.data.title).toBe('BuyMilk');
      }
    });

    it('should preserve case in values', () => {
      const command = '/task create title:"BUY Milk" project:"GROCERIES"';
      const result = SlashCommandParser.parse(command);

      expect(result.action).toBe('task.create');
      if (result.action === 'task.create') {
        expect(result.data.title).toBe('BUY Milk');
        expect(result.data.project).toBe('GROCERIES');
      }
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Integration Tests', () => {
    it('should parse and validate a complete workflow', () => {
      // Create a project
      const createProject = SlashCommandParser.parse('/project create name:"My Project"');
      expect(createProject.action).toBe('project.create');

      // Invite a user
      const inviteUser = SlashCommandParser.parse('/project invite email:user@example.com project:"My Project"');
      expect(inviteUser.action).toBe('project.invite');

      // Create a task
      const createTask = SlashCommandParser.parse('/task create title:"First task" project:"My Project"');
      expect(createTask.action).toBe('task.create');

      // Complete the task
      const completeTask = SlashCommandParser.parse('/task complete id:123');
      expect(completeTask.action).toBe('task.complete');
    });

    it('should handle realistic user input scenarios', () => {
      const commands = [
        '/task create title:"Review PR #123" due:2025-10-15 priority:high',
        '/project invite email:developer@company.com project:"Backend API" role:admin',
        '/message send to:manager@company.com content:"Meeting at 3pm" urgent:true',
        '/task complete id:abc123xyz',
        '/project create name:"Q4 Planning" description:"Planning for Q4 2025"',
      ];

      commands.forEach(cmd => {
        expect(() => SlashCommandParser.parse(cmd)).not.toThrow();
      });
    });
  });
});
