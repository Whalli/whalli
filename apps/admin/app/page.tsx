import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@whalli/ui';
import { Settings } from 'lucide-react';

export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            <CardTitle>Whalli Admin Panel</CardTitle>
          </div>
          <CardDescription>
            Manage your application, users, and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Users</CardTitle>
                <CardDescription>Manage user accounts</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
                <CardDescription>Configure your app</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analytics</CardTitle>
                <CardDescription>View statistics</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Database</CardTitle>
                <CardDescription>Manage data</CardDescription>
              </CardHeader>
            </Card>
          </div>
          <Button className="w-full" variant="outline">
            View Dashboard
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
