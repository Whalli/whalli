import { Button } from "@whalli/ui";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-primary">1,234</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Active Projects</h3>
            <p className="text-3xl font-bold text-primary">56</p>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Tasks Completed</h3>
            <p className="text-3xl font-bold text-primary">789</p>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <Button>Manage Users</Button>
            <Button variant="outline">View Reports</Button>
            <Button variant="secondary">System Settings</Button>
          </div>
        </div>
        
        <div className="mt-8">
          <p className="text-muted-foreground">
            This is the admin panel for Whalli. Protected routes with Better Auth authentication.
          </p>
        </div>
      </div>
    </div>
  );
}