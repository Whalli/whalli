'use client';

import { SlashCommand } from '@/hooks/useSlashCommands';

interface SlashCommandAutocompleteProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
}

export function SlashCommandAutocomplete({
  commands,
  selectedIndex,
  onSelect,
}: SlashCommandAutocompleteProps) {
  if (commands.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-2">
        <div className="text-xs font-medium text-gray-500 mb-2 px-2">
          Slash Commands
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {commands.map((command, index) => {
            const IconComponent = command.icon;
            return (
              <button
                key={command.command}
                onClick={() => onSelect(command)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg transition
                  ${
                    index === selectedIndex
                      ? 'bg-blue-50 text-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5" strokeWidth={2} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{command.command}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {command.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
