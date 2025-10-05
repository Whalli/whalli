"use client";

import { Plus, Filter, FolderOpen, Users, TrendingUp } from 'lucide-react';

interface ProjectsSecondarySidebarProps {
  projects?: {
    id: string;
    name: string;
    color: string;
    progress: number;
  }[];
  stats?: {
    total: number;
    active: number;
    archived: number;
  };
}

export function ProjectsSecondarySidebar({ 
  projects = [],
  stats = { total: 0, active: 0, archived: 0 }
}: ProjectsSecondarySidebarProps) {
  return (
    <div className="h-full flex flex-col bg-primary text-primary-foreground overflow-hidden">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-primary-foreground/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Projects</h2>
          <button 
            className="flex items-center gap-2 px-3 py-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-lg transition-colors text-sm"
            aria-label="New project"
          >
            <Plus className="h-4 w-4" />
            <span>New</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Active" value={stats.active} />
          <StatCard label="Archived" value={stats.archived} />
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-primary-foreground/10">
        <div className="flex items-center gap-2 mb-3 text-xs font-medium text-primary-foreground/70">
          <Filter className="h-3 w-3" />
          <span>Filters</span>
        </div>

        <div className="space-y-3">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium mb-2">Status</label>
            <select className="w-full px-3 py-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground/30">
              <option value="all">All Projects</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-xs font-medium mb-2">Sort By</label>
            <select className="w-full px-3 py-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground/30">
              <option value="recent">Recent Activity</option>
              <option value="name">Name</option>
              <option value="progress">Progress</option>
              <option value="members">Members</option>
            </select>
          </div>
        </div>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs font-medium text-primary-foreground/70 mb-3">
          Your Projects
        </div>
        <div className="space-y-2">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectItem key={project.id} project={project} />
            ))
          ) : (
            <div className="text-center py-8 text-primary-foreground/60 text-sm">
              No projects yet
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 border-t border-primary-foreground/10">
        <div className="space-y-2">
          <QuickStat 
            icon={<TrendingUp className="h-4 w-4" />}
            label="Average Progress"
            value="67%"
          />
          <QuickStat 
            icon={<Users className="h-4 w-4" />}
            label="Team Members"
            value="24"
          />
          <QuickStat 
            icon={<FolderOpen className="h-4 w-4" />}
            label="Active Tasks"
            value="156"
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-primary-foreground/10 rounded-lg p-3 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-primary-foreground/70">{label}</div>
    </div>
  );
}

interface ProjectItemProps {
  project: {
    id: string;
    name: string;
    color: string;
    progress: number;
  };
}

function ProjectItem({ project }: ProjectItemProps) {
  return (
    <a
      href={`/projects/${project.id}`}
      className="block p-3 hover:bg-primary-foreground/10 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-3 mb-2">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${project.color}30` }}
        >
          <FolderOpen 
            className="h-4 w-4"
            style={{ color: project.color }}
          />
        </div>
        <span className="font-medium text-sm flex-1 truncate">{project.name}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-primary-foreground/20 rounded-full h-1.5 overflow-hidden">
          <div 
            className="h-full bg-primary-foreground transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="text-xs text-primary-foreground/70">{project.progress}%</span>
      </div>
    </a>
  );
}

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function QuickStat({ icon, label, value }: QuickStatProps) {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-primary-foreground/5 rounded-lg transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-primary-foreground/70">{icon}</span>
        <span className="text-xs text-primary-foreground/70">{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
