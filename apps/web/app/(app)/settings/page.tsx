'use client';

/**
 * Settings Page
 * 
 * User account and application settings.
 */

import { useAuth } from '@/contexts/auth-context';
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  const sections = [
    { icon: User, label: 'Profile', description: 'Manage your account information' },
    { icon: Bell, label: 'Notifications', description: 'Configure notification preferences' },
    { icon: Shield, label: 'Privacy & Security', description: 'Control your data and security' },
    { icon: Palette, label: 'Appearance', description: 'Customize the look and feel' },
  ];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-100">Settings</h1>
            <p className="text-zinc-400 mt-1">Manage your account and preferences</p>
          </div>

          {/* User Info */}
          {user && (
            <div className="mb-8 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-2xl font-bold">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-zinc-100">{user.name}</h2>
                  <p className="text-zinc-400">{user.email}</p>
                  <p className="text-sm text-zinc-500 mt-1">Role: {user.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Sections */}
          <div className="space-y-3">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.label}
                  className="w-full p-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
                      <Icon className="w-6 h-6 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-zinc-100 mb-1">{section.label}</h3>
                      <p className="text-sm text-zinc-500">{section.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-8 p-4 bg-blue-950/30 border border-blue-900/50 rounded-lg text-center">
            <SettingsIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-blue-300">
              Detailed settings configuration coming soon
            </p>
          </div>
        </div>
      </div>
  );
}
