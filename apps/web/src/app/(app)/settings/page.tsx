"use client";

import { Palette, Bell, Lock, Globe, Zap, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

const themes = [
  { id: 'deep-ocean', name: 'Deep Ocean', color: '#040069', description: 'The default dark blue theme' },
  { id: 'forest', name: 'Forest', color: '#10B981', description: 'Fresh green theme' },
  { id: 'sunset', name: 'Sunset', color: '#F59E0B', description: 'Warm orange theme' },
  { id: 'rose', name: 'Rose', color: '#EF4444', description: 'Elegant red theme' },
];

export default function SettingsPage() {
  const [selectedTheme, setSelectedTheme] = useState('deep-ocean');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    taskReminders: true,
    projectUpdates: true,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Customize your Whalli experience</p>
        </div>

        {/* Appearance */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
              <div>
                <p className="font-medium text-foreground">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Theme Selector */}
          <div className="space-y-4">
            <div>
              <p className="font-medium text-foreground mb-2">Color Theme</p>
              <p className="text-sm text-muted-foreground mb-4">Choose your preferred color scheme</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTheme === theme.id
                      ? 'border-primary shadow-lg'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div
                    className="w-full h-16 rounded-lg mb-3"
                    style={{ backgroundColor: theme.color }}
                  />
                  <p className="font-medium text-foreground text-sm">{theme.name}</p>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
          </div>

          <div className="space-y-4">
            {Object.entries(notifications).map(([key, value]) => {
              const labels = {
                email: { title: 'Email Notifications', desc: 'Receive updates via email' },
                push: { title: 'Push Notifications', desc: 'Browser push notifications' },
                taskReminders: { title: 'Task Reminders', desc: 'Get notified about task deadlines' },
                projectUpdates: { title: 'Project Updates', desc: 'Stay updated on project changes' },
              };
              const label = labels[key as keyof typeof labels];

              return (
                <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium text-foreground">{label.title}</p>
                    <p className="text-sm text-muted-foreground">{label.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={value}
                      onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Privacy & Security</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Secure your account with 2FA</p>
              </div>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                Enable
              </button>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Active Sessions</p>
                <p className="text-sm text-muted-foreground">Manage your logged-in devices</p>
              </div>
              <button className="px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-accent transition-colors text-sm">
                View
              </button>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">API Keys</p>
                <p className="text-sm text-muted-foreground">Manage your API access keys</p>
              </div>
              <button className="px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-accent transition-colors text-sm">
                Manage
              </button>
            </div>
          </div>
        </div>

        {/* Language & Region */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Language & Region</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Language</label>
              <select className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Timezone</label>
              <select className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="utc">UTC</option>
                <option value="pst">PST (Pacific)</option>
                <option value="est">EST (Eastern)</option>
                <option value="cet">CET (Central European)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-card rounded-lg border border-border p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Performance</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium text-foreground">Enable Caching</p>
                <p className="text-sm text-muted-foreground">Speed up responses with Redis cache (27x faster)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">Preload AI Models</p>
                <p className="text-sm text-muted-foreground">Load AI models in advance for faster responses</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
            Save All Settings
          </button>
        </div>
      </div>
  );
}
