"use client";

import { useSession } from "@/lib/auth-client";

interface UserBadgeProps {
  variant?: "default" | "compact";
  showStatus?: boolean;
}

export function UserBadge({ variant = "default", showStatus = true }: UserBadgeProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
        {variant === "default" && (
          <div className="space-y-1">
            <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
            <div className="h-2 w-16 bg-muted rounded animate-pulse"></div>
          </div>
        )}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <span className="text-xs">?</span>
        </div>
        {variant === "default" && <span>Not signed in</span>}
      </div>
    );
  }

  const initial = session.name ? session.name.charAt(0).toUpperCase() : session.email.charAt(0).toUpperCase();

  if (variant === "compact") {
    return (
      <div className="relative inline-flex">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
          {initial}
        </div>
        {showStatus && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-semibold text-primary">
          {initial}
        </div>
        {showStatus && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background animate-pulse"></span>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">
          {session.name || 'User'}
        </span>
        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
          {session.email}
        </span>
      </div>
    </div>
  );
}
