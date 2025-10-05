"use client";

import { Plus, Search, Users, FolderOpen, MoreVertical } from 'lucide-react';
import { useState } from 'react';

// Mock data - à remplacer par des appels API
const mockProjects = [
  {
    id: '1',
    name: 'Whalli Core',
    description: 'Main platform development with AI chat, tasks, and projects management',
    color: '#040069',
    membersCount: 5,
    tasksCount: 12,
    completedTasks: 8,
    lastActivity: '2 hours ago',
  },
  {
    id: '2',
    name: 'Mobile App',
    description: 'React Native mobile application for iOS and Android',
    color: '#10B981',
    membersCount: 3,
    tasksCount: 8,
    completedTasks: 3,
    lastActivity: '1 day ago',
  },
  {
    id: '3',
    name: 'Design System',
    description: 'UI component library and design tokens',
    color: '#F59E0B',
    membersCount: 2,
    tasksCount: 15,
    completedTasks: 12,
    lastActivity: '3 hours ago',
  },
  {
    id: '4',
    name: 'Marketing Website',
    description: 'Landing page and marketing materials',
    color: '#EF4444',
    membersCount: 4,
    tasksCount: 6,
    completedTasks: 6,
    lastActivity: '5 days ago',
  },
];

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = mockProjects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage your projects and collaborate with your team</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Plus className="h-5 w-5" />
            <span>New Project</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => {
            const progress = (project.completedTasks / project.tasksCount) * 100;

            return (
              <div
                key={project.id}
                className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              >
                {/* Color Header */}
                <div
                  className="h-2"
                  style={{ backgroundColor: project.color }}
                />

                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${project.color}20` }}
                      >
                        <FolderOpen
                          className="h-5 w-5"
                          style={{ color: project.color }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-foreground">
                        {project.completedTasks}/{project.tasksCount} tasks
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {project.membersCount} members
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {project.lastActivity}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
            <p className="text-muted-foreground">Try adjusting your search</p>
          </div>
        )}
      </div>
  );
}
