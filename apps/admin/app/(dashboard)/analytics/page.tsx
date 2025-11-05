'use client';

/**
 * Analytics Page
 * Placeholder for Phase 1
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@whalli/ui';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100">Analytics</h1>
          <p className="text-zinc-400 mt-1">
            Usage statistics and insights
          </p>
        </div>

        {/* Placeholder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-zinc-400">Total API Calls</p>
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-zinc-100">45,231</p>
              <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +12% from last week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-zinc-400">Active Sessions</p>
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-zinc-100">3,456</p>
              <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +8% from last week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-zinc-400">Avg Response Time</p>
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-zinc-100">1.2s</p>
              <p className="text-xs text-green-500 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                -5% from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-violet-500" />
              <div>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>Coming soon in next phase</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
              <p className="text-zinc-500 mb-2">Detailed analytics will be implemented soon</p>
              <p className="text-sm text-zinc-600">
                View comprehensive usage statistics, user behavior, and performance metrics
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
