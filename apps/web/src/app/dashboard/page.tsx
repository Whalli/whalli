"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@whalli/ui";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Si pas de session, rediriger vers login
  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header avec statut de connexion */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">Dashboard</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Connected
              </span>
            </div>
            <p className="text-muted-foreground mt-2">
              Welcome back, <span className="font-semibold text-foreground">{session.name || session.email}</span>!
            </p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* Carte des informations utilisateur - Plus détaillée */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              {session.name ? session.name.charAt(0).toUpperCase() : session.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-1">{session.name || 'User'}</h2>
              <p className="text-sm text-muted-foreground mb-3">{session.email}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs mt-1 truncate">{session.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email Verified</p>
                  <p className="mt-1 flex items-center gap-1">
                    {session.emailVerified ? (
                      <><span className="text-green-600">✓</span> Verified</>
                    ) : (
                      <><span className="text-yellow-600">⚠</span> Not verified</>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Member Since</p>
                  <p className="mt-1">{new Date(session.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="mt-1">{new Date(session.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Profile Summary</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                {session.email}
              </p>
              {session.name && (
                <p>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  {session.name}
                </p>
              )}
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Create Project
              </Button>
              <Button variant="outline" className="w-full justify-start">
                View Tasks
              </Button>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Statistics</h3>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">Active Projects</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <p className="text-muted-foreground text-center py-8">
            No recent activity to display.
          </p>
        </div>
      </div>
    </div>
  );
}