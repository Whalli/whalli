"use client";

import { MessageSquare, CheckSquare, Folder, Sparkles, Zap, Shield, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { WhalliLogo } from '@/components/logo';
import { AuthRedirect } from '@/components/auth/auth-redirect';

const features = [
  {
    icon: MessageSquare,
    title: 'AI-Powered Chat',
    description: 'Interact with 10 AI models from 7 providers including GPT-4, Claude, and Grok',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: CheckSquare,
    title: 'Task Management',
    description: 'Organize and track your tasks with intelligent prioritization and status tracking',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    icon: Folder,
    title: 'Project Collaboration',
    description: 'Manage projects with your team, share resources, and track progress',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
];

const stats = [
  { label: 'AI Models', value: '10+', icon: Sparkles },
  { label: 'Fast Response', value: '27x', icon: Zap },
  { label: 'Secure', value: '100%', icon: Shield },
];

export default function LandingPage() {
  return (
    <AuthRedirect redirectIfAuthenticated={true}>
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">{/* Rest of component stays the same */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <WhalliLogo 
                color="#040069" 
                width={120} 
                height={36}
                className="hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Se connecter
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                S'inscrire
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-6 py-16">
            <div className="flex justify-center mb-8">
              <WhalliLogo 
                color="#040069" 
                width={380} 
                height={114} 
                className="hover:scale-105 transition-transform animate-fade-in"
              />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground">
              Bienvenue sur <span className="text-primary">Whalli</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Une plateforme moderne de gestion de projets alimentée par l'IA qui combine 
              chat intelligent, suivi des tâches et collaboration fluide
            </p>
            <div className="flex items-center justify-center gap-6 pt-8">
              <Link
                href="/signup"
                className="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-card border border-border text-foreground rounded-lg hover:bg-accent transition-colors font-medium text-lg"
              >
                Se connecter
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-card rounded-xl border border-border p-6 text-center space-y-4 hover:shadow-lg transition-shadow"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Icon className="h-10 w-10 text-primary mx-auto" />
                  <div className="text-4xl font-bold text-foreground">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>

          {/* Features */}
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Fonctionnalités puissantes
              </h2>
              <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
                Tout ce dont vous avez besoin pour gérer vos projets efficacement
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group bg-card rounded-xl border border-border p-6 hover:shadow-xl transition-all duration-300"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="space-y-4">
                      <div className={`w-14 h-14 rounded-xl ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-7 w-7 ${feature.color}`} />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-12 text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground">
              Prêt à commencer ?
            </h2>
            <p className="text-primary-foreground/90 text-xl max-w-3xl mx-auto leading-relaxed">
              Rejoignez des milliers d'équipes qui utilisent déjà Whalli pour rationaliser 
              leur flux de travail et augmenter leur productivité avec l'IA
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link
                href="/signup"
                className="inline-block px-8 py-4 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg shadow-lg"
              >
                Commencer gratuitement
              </Link>
              <Link
                href="/login"
                className="inline-block px-8 py-4 bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 rounded-lg hover:bg-primary-foreground/20 transition-colors font-medium text-lg"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2025 Whalli. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
    </AuthRedirect>
  );
}