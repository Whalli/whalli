"use client";

import { Plus, Search, Filter, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';

// Mock data - à remplacer par des appels API
const mockTasks = [
  {
    id: '1',
    title: 'Implement authentication system',
    description: 'Set up Better Auth with OAuth providers',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-01-15',
    project: 'Whalli Core',
  },
  {
    id: '2',
    title: 'Design database schema',
    description: 'Create Prisma models for all entities',
    status: 'completed',
    priority: 'high',
    dueDate: '2024-01-10',
    project: 'Whalli Core',
  },
  {
    id: '3',
    title: 'Setup CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-01-20',
    project: 'DevOps',
  },
];

const statusConfig = {
  'todo': { label: 'To Do', icon: Clock, color: 'text-gray-500 bg-gray-100' },
  'in-progress': { label: 'In Progress', icon: AlertCircle, color: 'text-blue-600 bg-blue-100' },
  'completed': { label: 'Completed', icon: CheckCircle2, color: 'text-success bg-success/10' },
};

const priorityConfig = {
  'high': { label: 'High', color: 'text-red-600 bg-red-100' },
  'medium': { label: 'Medium', color: 'text-yellow-600 bg-yellow-100' },
  'low': { label: 'Low', color: 'text-green-600 bg-green-100' },
};

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage your tasks and track progress</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="h-5 w-5" />
            <span>New Task</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg border border-border p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map((task) => {
            const StatusIcon = statusConfig[task.status as keyof typeof statusConfig].icon;
            const statusStyle = statusConfig[task.status as keyof typeof statusConfig];
            const priorityStyle = priorityConfig[task.priority as keyof typeof priorityConfig];

            return (
              <div
                key={task.id}
                className="bg-card rounded-lg border border-border p-4 hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="space-y-4">
                  {/* Status & Priority */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${statusStyle.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusStyle.label}
                    </span>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${priorityStyle.color}`}>
                      {priorityStyle.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                    {task.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">{task.project}</span>
                    <span className="text-xs text-muted-foreground">Due: {task.dueDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No tasks found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
  );
}
