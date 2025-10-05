import { useState, KeyboardEvent } from 'react';
import { 
  CheckCircle, 
  Check, 
  Trash2, 
  FolderPlus, 
  UserPlus, 
  MessageCircle, 
  HelpCircle, 
  Eraser, 
  Settings 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SlashCommand {
  command: string;
  description: string;
  icon: LucideIcon;
  syntax?: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/task create',
    description: 'Create a new task',
    icon: CheckCircle,
    syntax: '/task create [title] due:[date] project:[name]',
  },
  {
    command: '/task complete',
    description: 'Complete a task',
    icon: Check,
    syntax: '/task complete [task-id]',
  },
  {
    command: '/task delete',
    description: 'Delete a task',
    icon: Trash2,
    syntax: '/task delete [task-id]',
  },
  {
    command: '/project create',
    description: 'Create a new project',
    icon: FolderPlus,
    syntax: '/project create [name] desc:[description]',
  },
  {
    command: '/project invite',
    description: 'Invite user to project',
    icon: UserPlus,
    syntax: '/project invite [email] project:[name] role:[admin|member|viewer]',
  },
  {
    command: '/message send',
    description: 'Send a direct message',
    icon: MessageCircle,
    syntax: '/message send [user-email] [message]',
  },
  {
    command: '/help',
    description: 'Show all available commands',
    icon: HelpCircle,
  },
  {
    command: '/clear',
    description: 'Clear chat history',
    icon: Eraser,
  },
  {
    command: '/settings',
    description: 'Open settings',
    icon: Settings,
  },
];

export function useSlashCommands(
  input: string,
  setInput: (value: string) => void
) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleInputChange = (value: string) => {
    // Check if we should show autocomplete
    const lines = value.split('\n');
    const currentLine = lines[lines.length - 1];

    if (currentLine.startsWith('/')) {
      const searchTerm = currentLine.toLowerCase();
      const filtered = SLASH_COMMANDS.filter((cmd) =>
        cmd.command.toLowerCase().startsWith(searchTerm)
      );

      setFilteredCommands(filtered);
      setShowAutocomplete(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowAutocomplete(false);
      setFilteredCommands([]);
    }
  };

  const selectCommand = (command: SlashCommand) => {
    const lines = input.split('\n');
    const currentLineIndex = lines.length - 1;
    
    // Replace current line with selected command
    lines[currentLineIndex] = command.command + ' ';
    setInput(lines.join('\n'));
    
    setShowAutocomplete(false);
    setFilteredCommands([]);
  };

  const handleKeyDown = (e: KeyboardEvent): boolean => {
    if (!showAutocomplete) return false;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
        return true;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return true;

      case 'Tab':
      case 'Enter':
        if (filteredCommands.length > 0) {
          e.preventDefault();
          selectCommand(filteredCommands[selectedIndex]);
          return true;
        }
        return false;

      case 'Escape':
        e.preventDefault();
        setShowAutocomplete(false);
        setFilteredCommands([]);
        return true;

      default:
        return false;
    }
  };

  const closeAutocomplete = () => {
    setShowAutocomplete(false);
    setFilteredCommands([]);
    setSelectedIndex(0);
  };

  return {
    showAutocomplete,
    filteredCommands,
    selectedIndex,
    handleInputChange,
    handleKeyDown,
    selectCommand,
    closeAutocomplete,
  };
}
