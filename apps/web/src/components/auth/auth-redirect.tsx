"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectIfAuthenticated?: boolean;
  redirectTo?: string;
}

export function AuthRedirect({ 
  children, 
  redirectIfAuthenticated = false, 
  redirectTo = "/dashboard" 
}: AuthRedirectProps) {
  const { data: session, isPending, error } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [forceRender, setForceRender] = useState(false);

  // Ensure we're on client before rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Safety timeout - if loading takes more than 5 seconds, show content anyway
  useEffect(() => {
    if (!redirectIfAuthenticated) return;
    
    const timeout = setTimeout(() => {
      if (isPending) {
        console.warn("[AuthRedirect] Loading timeout - forcing render");
        setForceRender(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isPending, redirectIfAuthenticated]);

  // Handle redirect when user is authenticated
  useEffect(() => {
    // Only redirect if all conditions are met
    if (isClient && !isPending && session && redirectIfAuthenticated && !isRedirecting) {
      console.debug("[AuthRedirect] User authenticated, redirecting to", redirectTo);
      setIsRedirecting(true);
      
      // Use hard navigation for reliability
      console.debug("[AuthRedirect] Executing window.location.replace");
      window.location.replace(redirectTo);
    }
  }, [isClient, isPending, session, redirectIfAuthenticated, redirectTo, isRedirecting]);

  // Prevent hydration mismatch - render children during SSR
  if (!isClient) {
    return <>{children}</>;
  }

  console.debug("[AuthRedirect] Render state:", { 
    isClient, 
    isPending, 
    hasSession: !!session,
    sessionData: session ? { id: session.id, email: session.email } : null,
    redirectIfAuthenticated,
    isRedirecting,
    forceRender,
    error: error?.message 
  });

  // If timeout occurred or error, show content anyway
  if (forceRender || error) {
    console.warn("[AuthRedirect] Forcing render due to:", forceRender ? "timeout" : error?.message);
    return <>{children}</>;
  }

  // Show loading spinner while checking auth OR while redirecting
  if ((isPending || isRedirecting) && redirectIfAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">
            {isRedirecting ? "Redirecting..." : "Checking authentication..."}
          </p>
        </div>
      </div>
    );
  }

  // If user is authenticated and should redirect, don't show children
  // This prevents flash of content before redirect
  if (session && redirectIfAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Always render children by default
  return <>{children}</>;
}
