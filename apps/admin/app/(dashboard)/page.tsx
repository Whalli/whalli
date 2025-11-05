'use client';

/**
 * Admin Dashboard Home
 * Overview with stats and quick actions
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@whalli/ui';
import { Users, MessageSquare, Palette, Activity, TrendingUp, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-zinc-400 mt-1">
            Welcome to Whalli Admin Panel
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-zinc-100">1,234</p>
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +12% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Total Chats</p>
                  <p className="text-3xl font-bold text-zinc-100">5,678</p>
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +8% from last month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Active Presets</p>
                  <p className="text-3xl font-bold text-zinc-100">42</p>
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +3 this week
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-pink-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">System Health</p>
                  <p className="text-3xl font-bold text-green-500">98%</p>
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    All systems operational
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest user actions and system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { user: 'John Doe', action: 'Created new chat', time: '2 minutes ago' },
                  { user: 'Jane Smith', action: 'Updated preset "Code Reviewer"', time: '15 minutes ago' },
                  { user: 'Bob Johnson', action: 'Registered account', time: '1 hour ago' },
                  { user: 'Alice Brown', action: 'Deleted chat conversation', time: '2 hours ago' },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                    <div>
                      <p className="text-sm text-zinc-100">{activity.user}</p>
                      <p className="text-xs text-zinc-500">{activity.action}</p>
                    </div>
                    <span className="text-xs text-zinc-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Important notifications and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">High API usage</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      API calls increased by 45% in the last hour
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">Database backup completed</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Last backup: 30 minutes ago
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <AlertCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-100">All services running</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      No issues detected
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
