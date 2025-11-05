'use client';

/**
 * Users Management Page
 * Placeholder for Phase 1
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@whalli/ui';
import { Users, Plus, Search } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-100">Users</h1>
            <p className="text-zinc-400 mt-1">
              Manage user accounts and permissions
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Placeholder Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-violet-500" />
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Coming soon in next phase</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
              <p className="text-zinc-500 mb-2">User management features will be implemented soon</p>
              <p className="text-sm text-zinc-600">
                View, edit, and manage user accounts, roles, and permissions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
