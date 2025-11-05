'use client';

/**
 * System Settings Page
 * Placeholder for Phase 1
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@whalli/ui';
import { Settings, Database, Lock, Mail, Globe, Bell } from 'lucide-react';

export default function SystemPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100">System Settings</h1>
          <p className="text-zinc-400 mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-500" />
                <div>
                  <CardTitle className="text-lg">Database</CardTitle>
                  <CardDescription>Database configuration and backups</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Configure Database
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-purple-500" />
                <div>
                  <CardTitle className="text-lg">Security</CardTitle>
                  <CardDescription>Authentication and authorization</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Security Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-green-500" />
                <div>
                  <CardTitle className="text-lg">Email</CardTitle>
                  <CardDescription>Email server and notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Email Configuration
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-cyan-500" />
                <div>
                  <CardTitle className="text-lg">API Settings</CardTitle>
                  <CardDescription>API keys and rate limits</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                API Configuration
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-yellow-500" />
                <div>
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <CardDescription>System alerts and notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Notification Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-violet-500" />
                <div>
                  <CardTitle className="text-lg">General</CardTitle>
                  <CardDescription>General system preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                General Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="bg-zinc-900 border-zinc-800 mt-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Settings className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-zinc-100">Configuration Coming Soon</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Detailed system configuration features will be implemented in the next phase
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
