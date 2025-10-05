"use client";

import { Plus, Filter, CheckSquare, Circle, Clock, AlertCircle } from 'lucide-react';

interface TasksSecondarySidebarProps {
  filters?: {
    status?: string;
    priority?: string;
  };
  onFilterChange?: (filters: any) => void;
  stats?: {
    todo: number;
    inProgress: number;
    completed: number;
  };
}

export function TasksSecondarySidebar({ 
  filters,
  onFilterChange,
  stats = { todo: 0, inProgress: 0, completed: 0 }
}: TasksSecondarySidebarProps) {
  return (
    <div className="h-full flex flex-col bg-primary text-primary-foreground overflow-hidden">
      {/* Header */}
      <div className="p-3 lg:p-4 border-b border-primary-foreground/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Tasks</h2>
          <button 
            className="flex items-center gap-2 px-3 py-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg transition-colors text-sm"
            aria-label="New task"
          >
            <Plus className="h-4 w-4" />
            <span>New</span>
          </button>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <StatItem 
            icon={<Circle className="h-4 w-4" />}
            label="To Do"
            count={stats.todo}
            color="text-gray-300"
          />
          <StatItem 
            icon={<Clock className="h-4 w-4" />}
            label="In Progress"
            count={stats.inProgress}
            color="text-blue-300"
          />
          <StatItem 
            icon={<CheckSquare className="h-4 w-4" />}
            label="Completed"
            count={stats.completed}
            color="text-green-300"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-primary-foreground/10">
        <div className="flex items-center gap-2 mb-3 text-xs font-medium text-primary-foreground/70">
          <Filter className="h-3 w-3" />
          <span>Filters</span>
        </div>

        <div className="space-y-3">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium mb-2">Status</label>
            <select className="w-full px-3 py-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground/30">
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-xs font-medium mb-2">Priority</label>
            <select className="w-full px-3 py-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground/30">
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-xs font-medium mb-2">Project</label>
            <select className="w-full px-3 py-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground/30">
              <option value="all">All Projects</option>
              <option value="whalli-core">Whalli Core</option>
              <option value="mobile-app">Mobile App</option>
              <option value="design-system">Design System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3">
        <div className="text-xs font-medium text-primary-foreground/70 mb-3">
          Quick Actions
        </div>
        <div className="space-y-2">
          <QuickAction label="My Tasks" count={12} />
          <QuickAction label="Assigned to Me" count={8} />
          <QuickAction label="Due Today" count={3} />
          <QuickAction label="Overdue" count={2} urgent />
        </div>
      </div>
    </div>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color?: string;
}

function StatItem({ icon, label, count, color = "text-primary-foreground" }: StatItemProps) {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-primary-foreground/5 rounded-lg transition-colors cursor-pointer">
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium">{count}</span>
    </div>
  );
}

interface QuickActionProps {
  label: string;
  count: number;
  urgent?: boolean;
}

function QuickAction({ label, count, urgent }: QuickActionProps) {
  return (
    <button className="w-full flex items-center justify-between p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors text-left">
      <span className="text-sm">{label}</span>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
        urgent 
          ? 'bg-red-500/20 text-red-300' 
          : 'bg-primary-foreground/20 text-primary-foreground'
      }`}>
        {count}
      </span>
    </button>
  );
}
