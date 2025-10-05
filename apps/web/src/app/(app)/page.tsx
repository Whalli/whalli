"use client";

import { MessageSquare, CheckSquare, Folder, Sparkles, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import { WhalliLogo } from '@/components/logo';

const features = [
  {
    icon: MessageSquare,
    title: 'AI-Powered Chat',
    description: 'Interact with 10 AI models from 7 providers including GPT-4, Claude, and Grok',
    href: '/chat',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Organize and track your tasks with intelligent prioritization and status tracking',
    href: '/tasks',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    icon: Folder,
    title: 'Project Collaboration',
    description: 'Manage projects with your team, share resources, and track progress',
    href: '/projects',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
];

const stats = [
  { label: 'AI Models', value: '10+', icon: Sparkles },
  { label: 'Fast Response', value: '27x', icon: Zap },
  { label: 'Secure', value: '100%', icon: Shield },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="flex justify-center mb-6">
            <WhalliLogo 
              color="#0801DA" 
              width={320} 
              height={96} 
              className="hover:scale-105 transition-transform animate-fade-in"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-foreground">
            Welcome to <span className="text-primary">Whalli</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A modern AI-powered project management platform that combines intelligent chat, 
            task tracking, and seamless collaboration
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/chat"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Start Chatting
            </Link>
            <Link
              href="/projects"
              className="px-6 py-3 bg-card border border-border text-foreground rounded-lg hover:bg-accent transition-colors font-medium"
            >
              Browse Projects
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-card rounded-lg border border-border p-4 text-center space-y-2"
              >
                <Icon className="h-8 w-8 text-primary mx-auto" />
                <div className="text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Features */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Powerful Features
            </h2>
            <p className="text-muted-foreground mt-2">
              Everything you need to manage your projects efficiently
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.title}
                  href={feature.href}
                  className="group bg-card rounded-lg border border-border p-4 hover:shadow-lg transition-all duration-300"
                >
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                    <div className="flex items-center text-primary text-sm font-medium">
                      Explore
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-primary/60 rounded-2xl p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold text-primary-foreground">
            Ready to get started?
          </h2>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
            Join thousands of teams already using Whalli to streamline their workflow 
            and boost productivity with AI
          </p>
          <Link
            href="/chat"
            className="inline-block px-8 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors font-medium mt-4"
          >
            Get Started Free
          </Link>
        </div>
      </div>
  );
}
