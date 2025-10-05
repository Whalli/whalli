# Slash Command Parser

A robust TypeScript utility for parsing and validating slash commands with Zod schemas.

## Features

- **Type-safe parsing** with Zod validation
- **Multiple command categories**: tasks, projects, messages
- **Flexible parameter syntax**: `key:value` or `key:"value with spaces"`
- **Boolean parameter support**: `urgent:true`, `urgent:false`
- **Comprehensive validation**: email, dates, enums, required fields
- **49 Jest tests** with 100% coverage

## Installation

The parser is already included in your project at:
```
apps/api/src/utils/slash-command-parser.ts
```

## Supported Commands

### Task Commands

#### Create Task
```typescript
/task create title:"Buy milk" due:2025-10-10 project:"groceries" priority:high assignee:user@example.com
```

**Parameters:**
- `title` (required): Task title
- `due` (optional): Due date in ISO format
- `project` (optional): Project name
- `priority` (optional): `low`, `medium`, or `high`
- `assignee` (optional): Email address

**Returns:**
```typescript
{
  action: 'task.create',
  data: {
    title: 'Buy milk',
    due: '2025-10-10',
    project: 'groceries',
    priority: 'high',
    assignee: 'user@example.com'
  }
}
```

#### Complete Task
```typescript
/task complete id:123
```

**Parameters:**
- `id` (required): Task ID

#### Delete Task
```typescript
/task delete id:123
```

**Parameters:**
- `id` (required): Task ID

### Project Commands

#### Invite to Project
```typescript
/project invite email:user@example.com project:"groceries" role:admin
```

**Parameters:**
- `email` (required): User email address
- `project` (required): Project name
- `role` (optional): `admin`, `member`, or `viewer` (default: `member`)

#### Create Project
```typescript
/project create name:"My Project" description:"A great project"
```

**Parameters:**
- `name` (required): Project name
- `description` (optional): Project description

### Message Commands

#### Send Message
```typescript
/message send to:user@example.com content:"Hello world" urgent:true
```

**Parameters:**
- `to` (required): Recipient email
- `content` (required): Message content
- `urgent` (optional): Boolean flag (default: `false`)

### Help Command

```typescript
/help
```

## Usage

### Basic Parsing

```typescript
import { SlashCommandParser } from './slash-command-parser';

try {
  const result = SlashCommandParser.parse('/task create title:"Buy milk"');
  console.log(result);
  // {
  //   action: 'task.create',
  //   data: { title: 'Buy milk' }
  // }
} catch (error) {
  console.error(error.message);
}
```

### With Type Narrowing

```typescript
const result = SlashCommandParser.parse(command);

if (result.action === 'task.create') {
  // TypeScript knows result.data has title, due, project, etc.
  console.log(result.data.title);
  console.log(result.data.due);
}

if (result.action === 'project.invite') {
  // TypeScript knows result.data has email, project, role
  console.log(result.data.email);
  console.log(result.data.role);
}
```

### Helper Functions

```typescript
import { isSlashCommand, extractSlashCommand } from './slash-command-parser';

// Check if text is a slash command
if (isSlashCommand(userInput)) {
  const result = SlashCommandParser.parse(userInput);
}

// Extract command from message
const command = extractSlashCommand('/task create title:"Test"');
// Returns: '/task create title:"Test"'

// Get available commands
const commands = SlashCommandParser.getAvailableCommands();
console.log(commands);
// Returns array of example commands
```

## Parameter Syntax

### With Quotes (for values with spaces)
```typescript
/task create title:"Buy groceries at store"
```

### Without Quotes (for single words)
```typescript
/task create title:BuyMilk project:groceries
```

### Boolean Values
```typescript
/message send to:user@example.com content:"Alert" urgent:true
```

### Date Values
```typescript
/task create title:"Task" due:2025-10-10
/task create title:"Task" due:2025-10-10T14:30:00Z
```

## Validation

The parser automatically validates:

- **Required fields**: Throws error if missing
- **Email addresses**: Must be valid format
- **Enums**: Priority must be `low`, `medium`, or `high`
- **Dates**: Must be valid date format
- **String lengths**: Title must not be empty

### Error Handling

```typescript
try {
  const result = SlashCommandParser.parse('/task create');
} catch (error) {
  console.error(error.message);
  // "Invalid task create command: Required"
}

try {
  const result = SlashCommandParser.parse('/task create title:"" due:invalid-date');
} catch (error) {
  console.error(error.message);
  // "Invalid task create command: Invalid date format"
}
```

## Integration Example

### NestJS Controller

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { SlashCommandParser } from './utils/slash-command-parser';

@Controller('commands')
export class CommandsController {
  @Post('execute')
  async executeCommand(@Body('command') command: string) {
    try {
      const parsed = SlashCommandParser.parse(command);
      
      switch (parsed.action) {
        case 'task.create':
          return await this.tasksService.create(parsed.data);
        
        case 'task.complete':
          return await this.tasksService.complete(parsed.data.id);
        
        case 'project.invite':
          return await this.projectsService.invite(
            parsed.data.project,
            parsed.data.email,
            parsed.data.role
          );
        
        default:
          return { message: 'Command not implemented' };
      }
    } catch (error) {
      return { error: error.message };
    }
  }
}
```

### React Frontend

```typescript
import { SlashCommandParser } from './slash-command-parser';

function ChatInput() {
  const [input, setInput] = useState('');
  
  const handleSubmit = async () => {
    if (isSlashCommand(input)) {
      try {
        const parsed = SlashCommandParser.parse(input);
        const response = await fetch('/api/commands/execute', {
          method: 'POST',
          body: JSON.stringify({ command: input }),
        });
        console.log('Command executed:', parsed);
      } catch (error) {
        console.error('Invalid command:', error.message);
      }
    } else {
      // Handle regular message
    }
  };
  
  return (
    <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
    />
  );
}
```

## Testing

Run the test suite:

```bash
pnpm test slash-command-parser.spec.ts
```

**Test Coverage:**
- ✅ 10 task command tests
- ✅ 9 project command tests  
- ✅ 5 message command tests
- ✅ 1 help command test
- ✅ 5 error handling tests
- ✅ 6 complex scenario tests
- ✅ 7 helper function tests
- ✅ 5 edge case tests
- ✅ 1 integration test

**Total: 49 passing tests**

## Type Definitions

```typescript
type ParsedCommand =
  | { action: 'task.create'; data: { title: string; due?: string; project?: string; priority?: 'low' | 'medium' | 'high'; assignee?: string } }
  | { action: 'task.complete'; data: { id: string } }
  | { action: 'task.delete'; data: { id: string } }
  | { action: 'project.invite'; data: { email: string; project: string; role: 'admin' | 'member' | 'viewer' } }
  | { action: 'project.create'; data: { name: string; description?: string } }
  | { action: 'message.send'; data: { to: string; content: string; urgent: boolean } }
  | { action: 'help'; data: { command?: string } };
```

## Adding New Commands

1. **Define Zod Schema:**

```typescript
export const MyCommandSchema = z.object({
  action: z.literal('category.action'),
  data: z.object({
    param1: z.string(),
    param2: z.number().optional(),
  }),
});
```

2. **Add Parser Method:**

```typescript
private static parseMyCommand(params: Record<string, any>) {
  const result = MyCommandSchema.safeParse({
    action: 'category.action',
    data: params,
  });
  
  if (!result.success) {
    throw new Error(`Invalid command: ${result.error.errors[0].message}`);
  }
  
  return result.data;
}
```

3. **Add to Main Parser:**

```typescript
switch (commandKey) {
  case 'category.action':
    return this.parseMyCommand(parsedParams);
  // ... other cases
}
```

4. **Write Tests:**

```typescript
it('should parse /category action param1:value', () => {
  const result = SlashCommandParser.parse('/category action param1:value');
  expect(result.action).toBe('category.action');
});
```

## Best Practices

1. **Always validate input**: Use try-catch blocks
2. **Type narrow after parsing**: Use discriminated unions
3. **Provide user feedback**: Show helpful error messages
4. **Test edge cases**: Empty values, special characters, etc.
5. **Document new commands**: Update this README

## License

MIT
