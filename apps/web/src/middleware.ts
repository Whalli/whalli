import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/api/auth", // Auth API endpoints
  ];

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(route);
  });

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, check for access_token cookie
  const accessToken = request.cookies.get("access_token");

  // If no access token, check refresh token
  if (!accessToken) {
    const refreshToken = request.cookies.get("refresh_token");
    
    // If no refresh token either, redirect to login
    if (!refreshToken) {
      console.debug("[Middleware] No auth cookies, redirecting to login");
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Has refresh token but no access token - let client handle refresh
    console.debug("[Middleware] Has refresh token, allowing access for client-side refresh");
    return NextResponse.next();
  }

  // Has access token - verify it's valid by calling API
  try {
    const response = await fetch(
      new URL("/api/auth/profile", process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"),
      {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    );

    if (!response.ok) {
      console.debug("[Middleware] Token validation failed");
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    console.debug("[Middleware] Token valid, allowing access");
  } catch (error) {
    console.error("[Middleware] Session verification failed:", error);
    // On error, allow access and let client-side handle it
    // This prevents middleware errors from blocking the app
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};